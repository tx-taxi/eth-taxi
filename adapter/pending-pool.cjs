'use strict';

const {WebSocket} = require('ws');

const RECONCILE_MS = 5 * 60_000;
const MAX_PENDING = 20_000;

function createPendingPool(rpcUrl) {
  const transactions = new Map();
  const confirmed = new Map();
  const wsUrl = rpcUrl.replace(/^http/, 'ws');
  let socket;
  let connected = false;
  let bootstrapped = false;
  let lastObservedAt = 0;
  let reconnectDelay = 1_000;
  let reconciling;
  let subscriptionId;
  let headsId;

  async function rpc(method, params = []) {
    const response = await fetch(rpcUrl, {
      method: 'POST',
      headers: {'content-type': 'application/json'},
      body: JSON.stringify({jsonrpc: '2.0', id: 1, method, params}),
      signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok) throw new Error(`Pending pool RPC returned ${response.status}`);
    const payload = await response.json();
    if (payload.error || !payload.result) throw new Error(payload.error?.message || 'Pending pool unavailable');
    return payload.result;
  }

  async function reconcile() {
    if (reconciling) return reconciling;
    reconciling = (async () => {
      const content = await rpc('txpool_content');
      const next = new Map();
      const cutoff = Date.now() - 10 * 60_000;
      for (const [hash, at] of confirmed) if (at < cutoff) confirmed.delete(hash);
      for (const account of Object.values(content.pending || {})) {
        for (const tx of Object.values(account)) {
          if (tx?.hash && next.size < MAX_PENDING && !confirmed.has(tx.hash.toLowerCase())) next.set(tx.hash.toLowerCase(), tx);
        }
      }
      // Preserve transactions received while the HTTP snapshot was in flight.
      for (const [hash, tx] of transactions) {
        if (tx.__receivedAt > Date.now() - 30_000 && !confirmed.has(hash)) next.set(hash, tx);
      }
      transactions.clear();
      for (const [hash, tx] of next) transactions.set(hash, tx);
      bootstrapped = true;
      lastObservedAt = Date.now();
    })().finally(() => { reconciling = null; });
    return reconciling;
  }

  async function removeMinedBlock(hash) {
    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        const block = await rpc('eth_getBlockByHash', [hash, false]);
        for (const txHash of block.transactions || []) {
          const normalizedHash = txHash.toLowerCase();
          confirmed.set(normalizedHash, Date.now());
          transactions.delete(normalizedHash);
        }
        return;
      } catch {
        // The head subscription can precede the block's availability on the
        // HTTP RPC endpoint. Retry before treating this as a provider failure.
        if (attempt < 4) await new Promise((resolve) => setTimeout(resolve, 500 * (attempt + 1)));
      }
    }
    await reconcile().catch(() => {});
  }

  function connect() {
    socket = new WebSocket(wsUrl);
    socket.on('open', () => {
      connected = true;
      reconnectDelay = 1_000;
      socket.send(JSON.stringify({jsonrpc: '2.0', id: 1, method: 'eth_subscribe', params: ['newPendingTransactions', true]}));
      socket.send(JSON.stringify({jsonrpc: '2.0', id: 2, method: 'eth_subscribe', params: ['newHeads']}));
      reconcile().catch(() => {});
    });
    socket.on('message', (data) => {
      let message;
      try { message = JSON.parse(String(data)); } catch { return; }
      if (message.id === 1) subscriptionId = message.result;
      if (message.id === 2) headsId = message.result;
      if (subscriptionId && message.params?.subscription === subscriptionId && message.params?.result?.hash) {
        const tx = message.params.result;
        if (confirmed.has(tx.hash.toLowerCase())) return;
        tx.__receivedAt = Date.now();
        transactions.set(tx.hash.toLowerCase(), tx);
        if (transactions.size > MAX_PENDING) transactions.delete(transactions.keys().next().value);
        lastObservedAt = Date.now();
      }
      if (headsId && message.params?.subscription === headsId && message.params?.result?.hash) {
        lastObservedAt = Date.now();
        removeMinedBlock(message.params.result.hash).catch(() => {});
      }
    });
    socket.on('error', () => {});
    socket.on('close', () => {
      connected = false;
      bootstrapped = false;
      subscriptionId = undefined;
      headsId = undefined;
      const delay = reconnectDelay;
      reconnectDelay = Math.min(reconnectDelay * 2, 30_000);
      setTimeout(connect, delay).unref();
    });
  }

  function snapshot() {
    if (!connected || !bootstrapped || Date.now() - lastObservedAt > 45_000) return null;
    return {transactions: [...transactions.values()], observedAt: lastObservedAt};
  }

  function start() {
    connect();
    setInterval(() => { if (connected) reconcile().catch(() => {}); }, RECONCILE_MS).unref();
  }

  return {start, snapshot};
}

module.exports = {createPendingPool};
