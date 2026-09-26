'use strict';

function pendingExecutionRate(tx, baseFeeWei, fallbackRate) {
  const maxFee = Number(tx.max_fee_per_gas);
  const priorityFee = Number(tx.max_priority_fee_per_gas);
  if (maxFee > 0 && tx.max_priority_fee_per_gas != null && Number.isFinite(priorityFee) && baseFeeWei > 0) {
    return Math.min(maxFee, baseFeeWei + priorityFee);
  }
  const legacyRate = Number(tx.gas_price || tx.max_fee_per_gas || fallbackRate);
  return Number.isFinite(legacyRate) && legacyRate > 0 ? legacyRate : fallbackRate;
}

// Each projected tile represents at most one Ethereum block's gas capacity.
// The frontend stacks only tiles that exceed its available display slots.
function projectPendingBlocks(transactions, gasLimit, fallbackRate) {
  if (!transactions.length) return [];

  const capacity = Math.max(1, Math.floor(gasLimit));
  const ordered = transactions
    .filter((tx) => Number.isFinite(tx.gas) && tx.gas >= 0 && tx.gas <= capacity)
    .sort((a, b) => b.rate - a.rate);
  const blocks = [];
  let current;

  for (const tx of ordered) {
    const gas = Math.max(0, Math.floor(tx.gas));
    if (!current || (current.gas > 0 && current.gas + gas > capacity)) {
      current = {gas: 0, nTx: 0, totalFees: 0, rates: [], txids: []};
      blocks.push(current);
    }
    current.gas += gas;
    current.nTx++;
    current.totalFees += tx.fee;
    current.rates.push(tx.rate > 0 ? tx.rate : fallbackRate);
    if (tx.txid) current.txids.push(tx.txid);
  }

  return blocks.map((block, index) => {
    const rates = block.rates.sort((a, b) => a - b);
    const quantile = (fraction) => rates[Math.floor((rates.length - 1) * fraction)];
    return {
      index,
      blockSize: block.gas,
      blockVSize: Math.ceil(block.gas / 4),
      nTx: block.nTx,
      medianFee: quantile(0.5),
      totalFees: block.totalFees,
      feeRange: [0, 1 / 6, 2 / 6, 3 / 6, 4 / 6, 5 / 6, 1].map(quantile),
      txids: block.txids,
    };
  });
}

module.exports = {pendingExecutionRate, projectPendingBlocks};
