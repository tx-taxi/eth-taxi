'use strict';

const {test} = require('node:test');
const assert = require('node:assert/strict');
const {ERC1155_TRANSFER_TOPICS, decodeErc1155Log, decodeTokenTransferIntent, isDirectTokenTransferCall, tokenTransferAmount} = require('./token-transfer-intent.cjs');

const sender = '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
const recipient = '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
const token = '0xdAC17F958D2ee523a2206206994597C13D831ec7';
const addressWord = (address) => address.slice(2).toLowerCase().padStart(64, '0');
const amountWord = (amount) => BigInt(amount).toString(16).padStart(64, '0');

test('pending direct ERC-20 call decodes its proposed transfer without treating it as a receipt', () => {
  const input = `0xa9059cbb${addressWord(recipient)}${amountWord(18_207_239)}`;
  assert.equal(isDirectTokenTransferCall(input, token), true);
  assert.deepEqual(decodeTokenTransferIntent(input, sender, token, 'ERC-20'), {
    from: sender,
    to: recipient,
    value: '18207239',
    tokenId: null,
  });
  assert.equal(isDirectTokenTransferCall('0xa9059cbb', token), false);
  assert.equal(decodeTokenTransferIntent(input, sender, token, 'ERC-721'), null);
});

test('ERC-721 and ERC-1155 Blockscout totals retain nested token IDs and amounts', () => {
  assert.deepEqual(tokenTransferAmount({token: {type: 'ERC-721'}, total: {token_id: '5122'}}), {
    tokenId: '5122', value: '1',
  });
  assert.deepEqual(tokenTransferAmount({token: {type: 'ERC-1155'}, total: {token_id: '42', value: '7'}}), {
    tokenId: '42', value: '7',
  });
  assert.deepEqual(tokenTransferAmount({token: {type: 'ERC-20'}, total: {value: '18207239'}}), {
    tokenId: null, value: '18207239',
  });
});

test('ERC-1155 receipt logs preserve each batch item and its amount', () => {
  const topics = (signature) => [signature, `0x${addressWord(sender)}`, `0x${addressWord(sender)}`, `0x${addressWord(recipient)}`];
  const single = decodeErc1155Log({
    topics: topics(ERC1155_TRANSFER_TOPICS[0]),
    data: `0x${amountWord(42)}${amountWord(7)}`,
  });
  assert.deepEqual(single, [{from: sender, to: recipient, tokenId: '42', value: '7'}]);

  const batch = decodeErc1155Log({
    topics: topics(ERC1155_TRANSFER_TOPICS[1]),
    data: `0x${amountWord(64)}${amountWord(160)}${amountWord(2)}${amountWord(42)}${amountWord(43)}${amountWord(2)}${amountWord(7)}${amountWord(0)}`,
  });
  assert.deepEqual(batch, [
    {from: sender, to: recipient, tokenId: '42', value: '7'},
    {from: sender, to: recipient, tokenId: '43', value: '0'},
  ]);
});
