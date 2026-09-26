'use strict';

const TRANSFER = '0xa9059cbb';
const TRANSFER_FROM = '0x23b872dd';
const SAFE_NFT_TRANSFER_FROM = '0x42842e0e';
const SAFE_NFT_TRANSFER_FROM_DATA = '0xb88d4fde';
const SAFE_MULTI_TRANSFER_FROM = '0xf242432a';
const TRANSFER_SINGLE_TOPIC = '0xc3d58168c5ae7397731d063d5bbf3d657854427343f4c083240f7aacaa2d0f62';
const TRANSFER_BATCH_TOPIC = '0x4a39dc06d4c0dbc64b70af90fd698a233a518aa5d07e595d983b8c0526c8f7fb';

function word(input, index) {
  const start = 10 + index * 64;
  const value = input.slice(start, start + 64);
  return /^[\da-f]{64}$/i.test(value) ? value : null;
}

function addressWord(input, index) {
  const value = word(input, index);
  return value && /^0{24}[\da-f]{40}$/i.test(value) ? `0x${value.slice(24)}` : null;
}

function amountWord(input, index) {
  const value = word(input, index);
  return value ? BigInt(`0x${value}`).toString() : null;
}

// Calldata describes an attempted direct transfer, not an executed transfer.
function decodeTokenTransferIntent(input, sender, contract, tokenType) {
  if (!/^0x[\da-f]{40}$/i.test(contract || '') || !/^0x[\da-f]{40}$/i.test(sender || '')
    || typeof input !== 'string' || !/^0x[\da-f]*$/i.test(input)) return null;
  const selector = input.slice(0, 10).toLowerCase();
  const type = String(tokenType || '').toUpperCase();
  let from;
  let to;
  let value;
  let tokenId = null;

  if (type === 'ERC-20' && selector === TRANSFER) {
    from = sender;
    to = addressWord(input, 0);
    value = amountWord(input, 1);
  } else if (type === 'ERC-20' && selector === TRANSFER_FROM) {
    from = addressWord(input, 0);
    to = addressWord(input, 1);
    value = amountWord(input, 2);
  } else if (type === 'ERC-721' && [TRANSFER_FROM, SAFE_NFT_TRANSFER_FROM, SAFE_NFT_TRANSFER_FROM_DATA].includes(selector)) {
    from = addressWord(input, 0);
    to = addressWord(input, 1);
    tokenId = amountWord(input, 2);
    value = tokenId === null ? null : '1';
  } else if (type === 'ERC-1155' && selector === SAFE_MULTI_TRANSFER_FROM) {
    from = addressWord(input, 0);
    to = addressWord(input, 1);
    tokenId = amountWord(input, 2);
    value = amountWord(input, 3);
  }

  return from && to && value !== null ? { from, to, value, tokenId } : null;
}

function isDirectTokenTransferCall(input, contract) {
  if (!/^0x[\da-f]{40}$/i.test(contract || '') || typeof input !== 'string' || !/^0x[\da-f]*$/i.test(input)) return false;
  const selector = input.slice(0, 10).toLowerCase();
  return selector === TRANSFER && Boolean(addressWord(input, 0) && amountWord(input, 1) !== null)
    || [TRANSFER_FROM, SAFE_NFT_TRANSFER_FROM, SAFE_NFT_TRANSFER_FROM_DATA].includes(selector)
      && Boolean(addressWord(input, 0) && addressWord(input, 1) && amountWord(input, 2) !== null)
    || selector === SAFE_MULTI_TRANSFER_FROM
      && Boolean(addressWord(input, 0) && addressWord(input, 1) && amountWord(input, 2) !== null && amountWord(input, 3) !== null);
}

function tokenTransferAmount(transfer) {
  const type = transfer?.token_type || transfer?.token?.type;
  const tokenId = transfer?.token_id ?? transfer?.total?.token_id;
  const value = type === 'ERC-721' ? '1' : transfer?.total?.value ?? transfer?.value;
  return {tokenId: tokenId == null ? null : String(tokenId), value: value == null ? null : String(value)};
}

function decodeErc1155Log(log) {
  const topic = String(log?.topics?.[0] || '').toLowerCase();
  if (![TRANSFER_SINGLE_TOPIC, TRANSFER_BATCH_TOPIC].includes(topic) || log?.topics?.length < 4
    || typeof log.data !== 'string' || !/^0x[\da-f]*$/i.test(log.data)) return [];
  const from = `0x${log.topics[2].slice(-40)}`;
  const to = `0x${log.topics[3].slice(-40)}`;
  if (!/^0x[\da-f]{40}$/i.test(from) || !/^0x[\da-f]{40}$/i.test(to)) return [];
  const data = log.data.slice(2);
  const read = (offset) => {
    const value = data.slice(offset * 2, (offset + 32) * 2);
    return /^[\da-f]{64}$/i.test(value) ? BigInt(`0x${value}`) : null;
  };
  if (topic === TRANSFER_SINGLE_TOPIC) {
    const id = read(0);
    const value = read(32);
    return id === null || value === null ? [] : [{from, to, tokenId: id.toString(), value: value.toString()}];
  }
  const idsOffset = read(0);
  const valuesOffset = read(32);
  if (idsOffset === null || valuesOffset === null || idsOffset > 10_000n || valuesOffset > 10_000n) return [];
  const idsLength = read(Number(idsOffset));
  const valuesLength = read(Number(valuesOffset));
  if (idsLength === null || idsLength !== valuesLength || idsLength > 256n) return [];
  const transfers = [];
  for (let index = 0; index < Number(idsLength); index++) {
    const id = read(Number(idsOffset) + 32 * (index + 1));
    const value = read(Number(valuesOffset) + 32 * (index + 1));
    if (id === null || value === null) return [];
    transfers.push({from, to, tokenId: id.toString(), value: value.toString()});
  }
  return transfers;
}

module.exports = {
  ERC1155_TRANSFER_TOPICS: [TRANSFER_SINGLE_TOPIC, TRANSFER_BATCH_TOPIC],
  decodeErc1155Log,
  decodeTokenTransferIntent,
  isDirectTokenTransferCall,
  tokenTransferAmount,
};
