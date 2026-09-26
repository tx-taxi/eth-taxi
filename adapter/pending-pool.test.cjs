'use strict';

const {test} = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const {WebSocketServer} = require('ws');
const {createPendingPool} = require('./pending-pool.cjs');

async function waitFor(check, timeout = 4_000) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    if (check()) return;
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
  throw new Error('Timed out waiting for pending-pool state');
}

test('pending pool recovers from a failed bootstrap and a delayed new-head block', async () => {
  const hash = `0x${'a'.repeat(64)}`;
  let bootstrapCalls = 0;
  let blockCalls = 0;
  const server = http.createServer(async (req, res) => {
    let body = '';
    for await (const chunk of req) body += chunk;
    const {id, method} = JSON.parse(body);
    let result;
    if (method === 'txpool_content') result = ++bootstrapCalls === 1
      ? {jsonrpc: '2.0', id, error: {message: 'temporary outage'}}
      : {jsonrpc: '2.0', id, result: {pending: {}}};
    else if (method === 'eth_getBlockByHash') result = {jsonrpc: '2.0', id,
      result: ++blockCalls === 1 ? null : {transactions: [hash]}};
    else result = {jsonrpc: '2.0', id, result: null};
    res.writeHead(200, {'content-type': 'application/json'});
    res.end(JSON.stringify(result));
  });
  const wss = new WebSocketServer({server});
  wss.on('connection', (socket) => socket.on('message', (data) => {
    const {id} = JSON.parse(String(data));
    socket.send(JSON.stringify({jsonrpc: '2.0', id, result: id === 1 ? 'pending' : 'heads'}));
  }));
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));

  try {
    const pool = createPendingPool(`http://127.0.0.1:${server.address().port}`);
    pool.start();
    await waitFor(() => pool.snapshot() !== null);
    assert.equal(bootstrapCalls, 2);
    const socket = [...wss.clients][0];
    const pending = {jsonrpc: '2.0', method: 'eth_subscription', params: {subscription: 'pending', result: {hash}}};
    socket.send(JSON.stringify(pending));
    await waitFor(() => pool.snapshot()?.transactions.length === 1);

    socket.send(JSON.stringify({jsonrpc: '2.0', method: 'eth_subscription', params: {
      subscription: 'heads', result: {hash: `0x${'b'.repeat(64)}`},
    }}));
    await waitFor(() => blockCalls >= 2 && pool.snapshot()?.transactions.length === 0);
    socket.send(JSON.stringify(pending));
    await new Promise((resolve) => setTimeout(resolve, 50));
    assert.equal(pool.snapshot()?.transactions.length, 0);
  } finally {
    for (const socket of wss.clients) socket.terminate();
    await new Promise((resolve) => wss.close(resolve));
    await new Promise((resolve) => server.close(resolve));
  }
});
