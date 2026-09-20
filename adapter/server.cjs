#!/usr/bin/env node
'use strict';

const fs = require('node:fs/promises');
const http = require('node:http');
const path = require('node:path');
const { URL } = require('node:url');
const { WebSocketServer } = require('ws');

const host = process.env.ETH_ADAPTER_HOST || '0.0.0.0';
const port = Number(process.env.PORT || 8080);
const staticRoot = path.resolve(process.env.ETH_STATIC_ROOT || '/app/public');
const providers = (process.env.ETH_PROVIDER_URLS || 'https://eth.blockscout.com,https://blockscout.com/eth/mainnet')
  .split(',')
  .map((provider) => provider.trim().replace(/\/$/, ''))
  .filter(Boolean);
const sockets = new Set();
let activeProvider = providers[0];
let cachedSnapshot;
let cachedAt = 0;
let mempoolSamples = [];

// These mirror the frontend's BigInt filter flags. Keep them below 2^53 so
// they retain their exact value when serialized through the JSON adapter.
const ETHEREUM_TRANSACTION_FLAGS = {
  transfer: 2 ** 48,
  contractCall: 2 ** 49,
  tokenTransfer: 2 ** 50,
};

const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.gz': 'application/gzip',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webmanifest': 'application/manifest+json',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

function number(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function wei(value) {
  return number(value);
}

function gwei(value) {
  try {
    const atomic = BigInt(value || 0);
    const whole = atomic / 1_000_000_000n;
    const fraction = (atomic % 1_000_000_000n).toString().padStart(9, '0').slice(0, 6);
    return Number(`${whole}.${fraction}`);
  } catch {
    return 0;
  }
}

function gweiToWei(value) {
  return Math.round(number(value) * 1_000_000_000);
}

function timestamp(value) {
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? Math.floor(parsed / 1000) : Math.floor(Date.now() / 1000);
}

async function providerJson(requestPath) {
  let lastError;
  for (const provider of providers) {
    try {
      const response = await fetch(new URL(requestPath.replace(/^\//, ''), `${provider}/`), {
        headers: { accept: 'application/json', 'user-agent': 'eth-taxi/0.1' },
        signal: AbortSignal.timeout(12_000),
      });
      if (!response.ok) throw new Error(`${provider}${requestPath} returned ${response.status}`);
      activeProvider = provider;
      return response.json();
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError || new Error('No Ethereum providers configured');
}

function mapBlock(block) {
  const baseFee = wei(block.base_fee_per_gas);
  const totalFees = wei(block.transaction_fees);
  const reward = wei(block.rewards?.reduce((sum, item) => sum + BigInt(item.reward || 0), 0n));
  return {
    id: block.hash,
    height: number(block.height),
    version: 0,
    timestamp: timestamp(block.timestamp),
    bits: 0,
    nonce: number(block.nonce),
    difficulty: number(block.total_difficulty || block.difficulty),
    merkle_root: '',
    tx_count: number(block.transactions_count),
    size: number(block.size),
    weight: number(block.gas_used),
    previousblockhash: block.parent_hash,
    extras: {
      reward,
      totalFees,
      medianFee: baseFee,
      minFee: baseFee,
      maxFee: baseFee,
      feeRange: [baseFee, baseFee, baseFee, baseFee, baseFee, baseFee, baseFee],
      pool: { id: 0, name: block.miner?.name || block.miner?.hash || 'Unknown validator', slug: 'ethereum-validator' },
    },
  };
}

function mapTransaction(tx) {
  const gas = number(tx.gas_used || tx.gas_limit);
  const rate = wei(tx.gas_price || tx.max_fee_per_gas);
  const types = new Set(tx.transaction_types || []);
  let flags = 0;
  if (types.has('coin_transfer')) flags += ETHEREUM_TRANSACTION_FLAGS.transfer;
  if (types.has('contract_call')) flags += ETHEREUM_TRANSACTION_FLAGS.contractCall;
  if (types.has('token_transfer') || (tx.token_transfers?.length ?? 0) > 0) flags += ETHEREUM_TRANSACTION_FLAGS.tokenTransfer;
  return {
    txid: tx.hash,
    fee: wei(tx.fee?.value),
    vsize: gas,
    value: wei(tx.value),
    rate,
    flags,
    time: tx.timestamp ? timestamp(tx.timestamp) : Math.floor(Date.now() / 1000),
  };
}

function compressTransaction(transaction) {
  return [
    transaction.txid,
    transaction.fee,
    transaction.vsize,
    transaction.value,
    transaction.rate,
    transaction.flags,
    transaction.time,
  ];
}

function mapTransactionDetail(tx, blockHash) {
  const transaction = mapTransaction(tx);
  const gas = number(tx.gas_used || tx.gas_limit);
  const confirmed = Boolean(tx.block_number);
  const from = tx.from?.hash || '';
  const to = tx.to?.hash || tx.created_contract?.hash || '';
  const rawInput = tx.raw_input || '0x';
  return {
    ...transaction,
    // Blockscout supplies a timestamp for pending transactions. Preserve it so
    // the inherited first-seen component does not retry an unavailable
    // Bitcoin-specific endpoint indefinitely.
    ...(!confirmed ? { firstSeen: tx.timestamp ? timestamp(tx.timestamp) : Math.floor(Date.now() / 1000) } : {}),
    version: number(tx.type),
    locktime: 0,
    size: Math.max(0, Math.floor(Math.max(rawInput.length - 2, 0) / 2)),
    weight: gas * 4,
    vin: [{
      txid: from,
      vout: 0,
      is_coinbase: false,
      scriptsig: rawInput,
      scriptsig_asm: tx.method || 'contract call',
      sequence: number(tx.nonce),
      prevout: { scriptpubkey: '', scriptpubkey_asm: '', scriptpubkey_type: 'ethereum-address', scriptpubkey_address: from, value: 0 },
    }],
    vout: [{
      scriptpubkey: rawInput,
      scriptpubkey_asm: tx.method || 'transfer',
      scriptpubkey_type: to ? 'ethereum-address' : 'contract-creation',
      ...(to ? { scriptpubkey_address: to } : {}),
      value: wei(tx.value),
    }],
    status: {
      confirmed,
      ...(confirmed ? {
        block_height: number(tx.block_number),
        ...(blockHash ? { block_hash: blockHash } : {}),
        ...(tx.timestamp ? { block_time: timestamp(tx.timestamp) } : {}),
      } : {}),
    },
  };
}

function sampleMempool(pendingItems, gasUsed, gasFees) {
  const sample = { added: Math.floor(Date.now() / 1000), count: pendingItems.length, vbytes_per_second: 0, total_fee: gasFees, mempool_byte_weight: gasUsed, vsizes: [] };
  const previous = mempoolSamples.at(-1);
  if (!previous || sample.added - previous.added >= 10) {
    mempoolSamples.push(sample);
    mempoolSamples = mempoolSamples.filter((item) => item.added >= sample.added - 7_200);
  }
  return mempoolSamples.at(-1);
}

async function blocksEndingAt(height) {
  const heights = Array.from({ length: 6 }, (_, index) => height - index).filter((value) => value > 0);
  const blocks = await Promise.all(heights.map(async (blockHeight) => {
    try { return mapBlock(await providerJson(`/api/v2/blocks/${blockHeight}`)); } catch { return null; }
  }));
  return blocks.filter(Boolean);
}

async function blockById(id) {
  return mapBlock(await providerJson(`/api/v2/blocks/${encodeURIComponent(id)}`));
}

async function transactionById(id) {
  const transaction = await providerJson(`/api/v2/transactions/${encodeURIComponent(id)}`);
  let blockHash;
  if (transaction.block_number) {
    try { blockHash = (await providerJson(`/api/v2/blocks/${transaction.block_number}`)).hash; } catch { /* Detail remains useful without a block hash. */ }
  }
  return mapTransactionDetail(transaction, blockHash);
}

async function addressById(address) {
  const [details, transactions] = await Promise.all([
    providerJson(`/api/v2/addresses/${encodeURIComponent(address)}`),
    providerJson(`/api/v2/addresses/${encodeURIComponent(address)}/transactions`),
  ]);
  const balance = wei(details.coin_balance);
  const transactionCount = (transactions.items || []).length;
  return {
    // Marks this non-UTXO compatibility view so the frontend suppresses BTC-only rows.
    electrum: true,
    address: details.hash || address,
    chain_stats: { funded_txo_count: 0, funded_txo_sum: balance, spent_txo_count: 0, spent_txo_sum: 0, tx_count: transactionCount },
    mempool_stats: { funded_txo_count: 0, funded_txo_sum: 0, spent_txo_count: 0, spent_txo_sum: 0, tx_count: 0 },
  };
}

async function addressTransactions(address) {
  const response = await providerJson(`/api/v2/addresses/${encodeURIComponent(address)}/transactions`);
  return (response.items || []).map((transaction) => mapTransactionDetail(transaction, transaction.block_hash));
}

async function blockTransactions(blockId, start = 0) {
  const response = await providerJson(`/api/v2/blocks/${encodeURIComponent(blockId)}/transactions`);
  return (response.items || [])
    .slice(start, start + 25)
    .map((transaction) => mapTransactionDetail(transaction, blockId));
}

async function snapshot(force = false) {
  if (!force && cachedSnapshot && Date.now() - cachedAt < 4_000) return cachedSnapshot;
  const [blocks, transactions, pending, stats] = await Promise.all([
    providerJson('/api/v2/main-page/blocks'),
    providerJson('/api/v2/main-page/transactions'),
    providerJson('/api/v2/transactions?filter=pending'),
    providerJson('/api/v2/stats'),
  ]);
  const mappedBlocks = blocks.map(mapBlock).reverse();
  const pendingItems = pending.items || [];
  const pendingTransactions = pendingItems.map(mapTransaction);
  const gasPrices = stats.gas_prices || {};
  const slow = number(gasPrices.slow);
  const average = number(gasPrices.average);
  const fast = number(gasPrices.fast);
  const gasUsed = pendingItems.reduce((sum, item) => sum + number(item.gas_limit || item.gas_used), 0);
  const gasFees = pendingItems.reduce((sum, item) => sum + wei(item.fee?.value), 0);
  const liveMempoolSample = sampleMempool(pendingItems, gasUsed, gasFees);
  const tip = mappedBlocks.at(-1);
  cachedSnapshot = {
    backend: 'blockscout',
    backendInfo: { hostname: new URL(activeProvider).hostname, version: 'eth-taxi-adapter', gitCommit: 'main', lightning: false },
    loadingIndicators: { mempool: 100 },
    blocks: mappedBlocks,
    'mempool-blocks': pendingTransactions.length ? [{ blockSize: gasUsed, blockVSize: Math.ceil(gasUsed / 4), nTx: pendingTransactions.length, medianFee: gweiToWei(average), totalFees: gasFees, feeRange: [slow, slow, average, average, fast, fast, fast].map(gweiToWei), index: 0 }] : [],
    // Ethereum does not have Bitcoin's configurable byte-based mempool limit.
    // Use a stable gas reference so the pending-gas meter is informative rather
    // than reporting every non-empty pending set as 100% full.
    mempoolInfo: { loaded: true, size: pendingTransactions.length, bytes: gasUsed, usage: gasUsed, maxmempool: Math.max(Math.ceil(gasUsed * 1.25), 60_000_000), mempoolminfee: gweiToWei(slow), minrelaytxfee: gweiToWei(slow), total_fee: gasFees },
    vBytesPerSecond: 0,
    fees: { fastestFee: gweiToWei(fast), halfHourFee: gweiToWei(average), hourFee: gweiToWei(average), economyFee: gweiToWei(slow), minimumFee: gweiToWei(slow) },
    da: {
      progressPercent: 100,
      difficultyChange: 0,
      estimatedRetargetDate: tip?.timestamp ? tip.timestamp * 1_000 + 12_000 : Date.now() + 12_000,
      remainingBlocks: 1,
      remainingTime: 12_000,
      previousRetarget: 0,
      nextRetargetHeight: (tip?.height || 0) + 1,
      timeAvg: 12_000,
      adjustedTimeAvg: 12_000,
      timeOffset: 0,
    },
    transactions: pendingTransactions.slice(0, 6),
    projectedTransactions: pendingTransactions,
    'live-2h-chart': liveMempoolSample,
    conversions: { USD: number(stats.coin_price) },
  };
  cachedAt = Date.now();
  return cachedSnapshot;
}

function respond(res, status, value) {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
  res.end(JSON.stringify(value));
}

function respondJavaScript(res, source) {
  res.writeHead(200, { 'content-type': 'application/javascript; charset=utf-8', 'cache-control': 'no-store' });
  res.end(source);
}

function isApiPath(pathname) {
  return pathname === '/api' || pathname.startsWith('/api/');
}

function isSupportedApiPath(pathname) {
  return new Set([
    '/api/v1/init-data',
    '/api/v1/blocks',
    '/api/v1/txs',
    '/api/v1/transaction-times',
    '/api/txs/outspends',
    '/api/v1/historical-price',
    '/api/v1/mempool',
    '/api/v1/statistics/2h',
    '/api/v1/fees/recommended',
    '/api/v1/info',
  ]).has(pathname) || [
    /^\/api\/v1\/blocks\/\d+$/,
    /^\/api\/v1\/block\/0x[a-fA-F0-9]+(?:\/summary)?$/,
    /^\/api\/block\/0x[a-fA-F0-9]+\/txs\/\d+$/,
    /^\/api(?:\/v1)?\/tx\/0x[a-fA-F0-9]+$/,
    /^\/api\/tx\/0x[a-fA-F0-9]+\/status$/,
    /^\/api\/address\/0x[a-fA-F0-9]{40}(?:\/txs)?$/,
    /^\/api\/v1\/cpfp\/0x[a-fA-F0-9]+$/,
    /^\/api\/v1\/tx\/0x[a-fA-F0-9]+\/rbf$/,
    /^\/api\/v1\/mining\/pools(?:\/[^/]+)?$/,
  ].some((pattern) => pattern.test(pathname));
}

async function serveStatic(pathname, res, spaFallback = true) {
  if (isApiPath(pathname)) return false;
  const requested = pathname;
  const relative = path.posix.normalize(requested).replace(/^\/+/, '');
  let filePath = path.join(staticRoot, relative);
  if (filePath !== staticRoot && !filePath.startsWith(`${staticRoot}${path.sep}`)) return false;
  try {
    const body = await fs.readFile(filePath);
    res.writeHead(200, { 'content-type': contentTypes[path.extname(filePath)] || 'application/octet-stream', 'cache-control': 'no-store' });
    res.end(body);
    return true;
  } catch (error) {
    if (error?.code !== 'ENOENT' && error?.code !== 'EISDIR') throw error;
  }
  filePath = path.join(staticRoot, 'en-US', relative);
  try {
    const body = await fs.readFile(filePath);
    res.writeHead(200, { 'content-type': contentTypes[path.extname(filePath)] || 'application/octet-stream', 'cache-control': 'no-store' });
    res.end(body);
    return true;
  } catch (error) {
    if (error?.code !== 'ENOENT' && error?.code !== 'EISDIR') throw error;
  }
  if (!spaFallback) return false;

  // Localized builds place an index under en-US, while the default production
  // build emits it at the static root. Either layout must serve deep links.
  for (const indexPath of [
    path.join(staticRoot, 'en-US', 'index.html'),
    path.join(staticRoot, 'index.html'),
  ]) {
    try {
      const body = await fs.readFile(indexPath);
      res.writeHead(200, { 'content-type': contentTypes['.html'], 'cache-control': 'no-store' });
      res.end(body);
      return true;
    } catch (error) {
      if (error?.code !== 'ENOENT' && error?.code !== 'EISDIR') throw error;
    }
  }
  return false;
}

const server = http.createServer(async (req, res) => {
  try {
    const requestUrl = new URL(req.url, `http://${req.headers.host}`);
    const requestPath = requestUrl.pathname;
    if (requestPath === '/healthz') return respond(res, 200, { ok: true, provider: activeProvider });
    if (isApiPath(requestPath) && !isSupportedApiPath(requestPath)) {
      return respond(res, 404, { error: 'Unsupported Ethereum explorer endpoint', path: requestPath });
    }
    if (requestPath === '/resources/config.js' || requestPath === '/resources/customize.js') {
      if (await serveStatic(requestPath, res, false)) return;
      return respondJavaScript(res, requestPath.endsWith('/config.js') ? 'window.__env = window.__env || {};\n' : '');
    }
    if (await serveStatic(requestPath, res)) return;
    const data = await snapshot();
    if (requestPath === '/api/v1/init-data') return respond(res, 200, data);
    if (requestPath === '/api/v1/blocks') return respond(res, 200, data.blocks);
    const blocksMatch = requestPath.match(/^\/api\/v1\/blocks\/(\d+)$/);
    if (blocksMatch) return respond(res, 200, await blocksEndingAt(Number(blocksMatch[1])));
    if (requestPath === '/api/v1/txs') return respond(res, 200, data.transactions);
    const blockMatch = requestPath.match(/^\/api\/v1\/block\/(0x[a-fA-F0-9]+)$/);
    if (blockMatch) return respond(res, 200, await blockById(blockMatch[1]));
    const blockSummaryMatch = requestPath.match(/^\/api\/v1\/block\/(0x[a-fA-F0-9]+)\/summary$/);
    if (blockSummaryMatch) return respond(res, 200, await blockTransactions(blockSummaryMatch[1]));
    const blockTransactionsMatch = requestPath.match(/^\/api\/block\/(0x[a-fA-F0-9]+)\/txs\/(\d+)$/);
    if (blockTransactionsMatch) return respond(res, 200, await blockTransactions(blockTransactionsMatch[1], Number(blockTransactionsMatch[2])));
    const transactionMatch = requestPath.match(/^\/(?:api(?:\/v1)?)?\/tx\/(0x[a-fA-F0-9]+)$/);
    if (transactionMatch) return respond(res, 200, await transactionById(transactionMatch[1]));
    const addressTransactionsMatch = requestPath.match(/^\/api\/address\/(0x[a-fA-F0-9]{40})\/txs$/);
    if (addressTransactionsMatch) return respond(res, 200, await addressTransactions(addressTransactionsMatch[1]));
    const addressMatch = requestPath.match(/^\/api\/address\/(0x[a-fA-F0-9]{40})$/);
    if (addressMatch) return respond(res, 200, await addressById(addressMatch[1]));
    const statusMatch = requestPath.match(/^\/api\/tx\/(0x[a-fA-F0-9]+)\/status$/);
    if (statusMatch) return respond(res, 200, (await transactionById(statusMatch[1])).status);
    if (requestPath === '/api/v1/transaction-times') {
      return respond(res, 200, requestUrl.searchParams.getAll('txId[]').map((id) => data.transactions.find((tx) => tx.txid === id)?.time || Math.floor(Date.now() / 1000)));
    }
    if (requestPath === '/api/txs/outspends') {
      return respond(res, 200, requestUrl.searchParams.get('txids')?.split(',').filter(Boolean).map(() => [{ spent: false }]) || []);
    }
    if (requestPath === '/api/v1/historical-price') {
      return respond(res, 200, {
        prices: [{ time: 0, USD: data.conversions.USD, EUR: -1, GBP: -1, CAD: -1, CHF: -1, AUD: -1, JPY: -1 }],
        exchangeRates: { USDEUR: 0, USDGBP: 0, USDCAD: 0, USDCHF: 0, USDAUD: 0, USDJPY: 0 },
      });
    }
    if (/^\/api\/v1\/cpfp\/0x[a-fA-F0-9]+$/.test(requestPath)) {
      return respond(res, 200, { ancestors: [], descendants: [], bestDescendant: null });
    }
    if (/^\/api\/v1\/tx\/0x[a-fA-F0-9]+\/rbf$/.test(requestPath)) {
      return respond(res, 200, { replacements: null, replaces: [] });
    }
    if (/^\/api\/v1\/mining\/pools(?:\/[^/]+)?$/.test(requestPath)) {
      return respond(res, 200, []);
    }
    if (requestPath === '/api/v1/mempool') return respond(res, 200, data.mempoolInfo);
    if (requestPath === '/api/v1/statistics/2h') return respond(res, 200, [...mempoolSamples].reverse());
    if (requestPath === '/api/v1/fees/recommended') return respond(res, 200, data.fees);
    if (requestPath === '/api/v1/info') return respond(res, 200, { height: data.blocks.at(-1)?.height || 0, target_height: 0, synced: true, nettype: 'mainnet', average_block_time: 12_000 });
    return respond(res, 404, { error: 'Unsupported Ethereum explorer endpoint', path: requestPath });
  } catch (error) {
    return respond(res, 503, { error: 'Ethereum provider unavailable', detail: error instanceof Error ? error.message : String(error) });
  }
});

const wss = new WebSocketServer({ noServer: true });
wss.on('connection', async (socket) => {
  sockets.add(socket);
  socket.on('close', () => sockets.delete(socket));
  socket.on('message', async (message) => {
    try {
      const request = JSON.parse(String(message));
      if (request.action === 'ping') {
        socket.send(JSON.stringify({ pong: true }));
        return;
      }
      if (request.action === 'init') {
        socket.send(JSON.stringify(await snapshot()));
        return;
      }
      if (typeof request['track-tx'] === 'string' && request['track-tx'] !== 'stop') {
        const data = await snapshot();
        const transaction = data.projectedTransactions.find((item) => item.txid === request['track-tx']);
        // Ethereum's pending pool has no Bitcoin-style package position. A
        // pending transaction is instead estimated for the next validator slot.
        socket.send(JSON.stringify({
          txPosition: {
            txid: request['track-tx'],
            position: { block: 0, vsize: transaction?.vsize || 0 },
            cpfp: null,
            accelerationPositions: [],
          },
        }));
        return;
      }
      if (Number.isInteger(request['track-mempool-block']) && request['track-mempool-block'] >= 0) {
        const data = await snapshot();
        socket.send(JSON.stringify({
          'projected-block-transactions': {
            index: request['track-mempool-block'],
            sequence: Date.now(),
            blockTransactions: data.projectedTransactions.map(compressTransaction),
          },
        }));
      }
    } catch {
      // A malformed subscription must not disrupt the dashboard stream.
    }
  });
  try { socket.send(JSON.stringify(await snapshot())); } catch { socket.close(); }
});
server.on('upgrade', (req, socket, head) => {
  if (new URL(req.url, `http://${req.headers.host}`).pathname !== '/api/v1/ws') return socket.destroy();
  wss.handleUpgrade(req, socket, head, (client) => wss.emit('connection', client, req));
});
setInterval(async () => {
  if (!sockets.size) return;
  try {
    const encoded = JSON.stringify(await snapshot(true));
    for (const socket of sockets) if (socket.readyState === socket.OPEN) socket.send(encoded);
  } catch { /* Retain the last good provider response. */ }
}, 12_000).unref();

server.listen(port, host, () => console.log(`ETH adapter listening on http://${host}:${port}`));
