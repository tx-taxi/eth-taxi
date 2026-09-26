'use strict';

const {test} = require('node:test');
const assert = require('node:assert/strict');
const {pendingExecutionRate, projectPendingBlocks} = require('./project-pending-blocks.cjs');

test('pending EIP-1559 projection uses the effective price instead of the submitted cap', () => {
  const baseFee = 50_000_000;
  const fallback = 100_000_000;
  const transaction = {max_fee_per_gas: '100000000000', max_priority_fee_per_gas: '1000000000'};
  const rate = pendingExecutionRate(transaction, baseFee, fallback);
  const [block] = projectPendingBlocks([{gas: 21_000, fee: 21_000 * rate, rate}], 60_000_000, fallback);

  assert.equal(rate, 1_050_000_000);
  assert.equal(block.totalFees, 22_050_000_000_000);
  assert.equal(pendingExecutionRate({gas_price: '2000000000'}, baseFee, fallback), 2_000_000_000);
});

test('pending transactions occupy separate tiles until a tile exceeds the gas limit', () => {
  const transactions = [
    {gas: 30, fee: 3, rate: 3},
    {gas: 30, fee: 2, rate: 2},
    {gas: 30, fee: 1, rate: 1},
  ];
  const blocks = projectPendingBlocks(transactions, 60, 0);

  assert.equal(blocks.length, 2);
  assert.deepEqual(blocks.map((block) => [block.nTx, block.blockSize, block.totalFees]), [[2, 60, 5], [1, 30, 1]]);
  assert.ok(blocks.every((block) => block.blockSize <= 60));
});
