'use strict';

const {test} = require('node:test');
const assert = require('node:assert/strict');
const {projectPendingBlocks} = require('./project-pending-blocks.cjs');

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
