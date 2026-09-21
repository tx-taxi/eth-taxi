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
const providers = (process.env.ETH_PROVIDER_URLS || 'https://eth.blockscout.com')
  .split(',')
  .map((provider) => provider.trim().replace(/\/$/, ''))
  .filter(Boolean);
const rpcProviders = (process.env.ETH_RPC_URLS || 'https://ethereum-rpc.publicnode.com,https://rpc.mevblocker.io,https://cloudflare-eth.com')
  .split(',')
  .map((provider) => provider.trim().replace(/\/$/, ''))
  .filter(Boolean);
const sockets = new Set();
const mempoolBlockSubscriptions = new Map();
const transactionSubscriptions = new Map();
const transactionStreamSignatures = new Map();
const addressSubscriptions = new Map();
const addressTransactionSnapshots = new Map();
let activeProvider = providers[0];
let activeRpcProvider = rpcProviders[0];
let cachedSnapshot;
let cachedAt = 0;
let mempoolSamples = [];
let lastBroadcastSignature = '';
let lastBroadcastAt = 0;
let pollInFlight = false;
const providerCooldowns = new Map();

const POLL_INTERVAL_MS = Math.max(3_000, Number(process.env.ETH_POLL_INTERVAL_MS || 6_000));
const HEARTBEAT_INTERVAL_MS = 30_000;
const EXPLORER_RATE_LIMIT_COOLDOWN_MS = 15 * 60_000;
const ERC20_TRANSFER_TOPIC = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';

// These mirror the frontend's BigInt filter flags. Keep them below 2^53 so
// they retain their exact value when serialized through the JSON adapter.
const ETHEREUM_TRANSACTION_FLAGS = {
  transfer: 2 ** 48,
  contractCall: 2 ** 49,
  tokenTransfer: 2 ** 50,
};

const TOKEN_PALETTES = {
  DAI: ['#c99420', '#f5c85b', '#fff0c1'],
  LINK: ['#285bcf', '#5d8cff', '#b9cbff'],
  USDC: ['#2775ca', '#68a6e8', '#c8e5ff'],
  USDT: ['#168c6a', '#46c6a0', '#b7f2df'],
  WBTC: ['#d77c21', '#f6ab51', '#ffe0ae'],
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

function decimalString(value, fallback = '0') {
  try {
    const parsed = BigInt(value ?? fallback);
    return parsed >= 0n ? parsed.toString() : fallback;
  } catch {
    return fallback;
  }
}

function nullableString(value) {
  return value === undefined || value === null || value === '' ? null : String(value);
}

function safeIconUrl(value) {
  if (typeof value !== 'string') return null;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' ? url.href : null;
  } catch {
    return null;
  }
}

function paletteFromToken(token, fallbackAddress = '') {
  const symbol = String(token?.symbol || '').trim().toUpperCase();
  if (TOKEN_PALETTES[symbol]) return TOKEN_PALETTES[symbol];

  // Blockscout does not expose a token brand color. Seed a stable palette from
  // public token metadata so the same asset always receives the same ribbons.
  const seed = String(token?.address_hash || token?.address || fallbackAddress || token?.name || symbol || 'token');
  let hash = 2166136261;
  for (let index = 0; index < seed.length; index++) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  const hue = Math.abs(hash) % 360;
  return [
    `hsl(${hue} 66% 42%)`,
    `hsl(${(hue + 28) % 360} 82% 62%)`,
    `hsl(${(hue + 48) % 360} 88% 78%)`,
  ];
}

function tagNames(entity) {
  const tags = [
    ...(Array.isArray(entity?.metadata?.tags) ? entity.metadata.tags : []),
    ...(Array.isArray(entity?.public_tags) ? entity.public_tags : []),
  ];
  return Array.from(new Set(tags
    .map((tag) => typeof tag === 'string' ? tag : tag?.name)
    .filter((tag) => typeof tag === 'string' && tag.length > 0)))
    .slice(0, 4);
}

function mapEthereumToken(token, fallbackAddress = '') {
  if (!token) return null;
  return {
    address: token.address_hash || token.address || fallbackAddress,
    name: nullableString(token.name),
    symbol: nullableString(token.symbol),
    type: nullableString(token.type) || 'Token',
    decimals: nullableString(token.decimals),
    iconUrl: safeIconUrl(token.icon_url),
    totalSupply: nullableString(token.total_supply),
    circulatingSupply: nullableString(token.circulating_supply),
    holdersCount: nullableString(token.holders_count),
    exchangeRate: nullableString(token.exchange_rate),
    marketCap: nullableString(token.circulating_market_cap || token.market_cap),
    volume24h: nullableString(token.volume_24h),
    reputation: nullableString(token.reputation),
    palette: paletteFromToken(token, fallbackAddress),
  };
}

function mapEthereumIdentity(entity, fallbackAddress = '') {
  const tags = tagNames(entity);
  const nameTag = (entity?.metadata?.tags || []).find((tag) => tag?.tagType === 'name')?.name;
  const token = mapEthereumToken(entity?.token, entity?.hash || entity?.address_hash || fallbackAddress);
  return {
    address: entity?.hash || entity?.address_hash || entity?.address || fallbackAddress,
    name: nullableString(entity?.name || nameTag || token?.name),
    ensName: nullableString(entity?.ens_domain_name),
    iconUrl: token?.iconUrl || null,
    isContract: Boolean(entity?.is_contract),
    isVerified: Boolean(entity?.is_verified),
    isScam: Boolean(entity?.is_scam),
    reputation: nullableString(entity?.reputation),
    proxyType: nullableString(entity?.proxy_type),
    implementationAddress: nullableString(entity?.implementations?.[0]?.address_hash),
    tags,
  };
}

function mapEthereumTokenTransfer(transfer) {
  const token = mapEthereumToken(transfer?.token, transfer?.token?.address_hash || '');
  return {
    transactionHash: nullableString(transfer?.transaction_hash) || '',
    logIndex: nullableString(transfer?.log_index),
    blockNumber: nullableString(transfer?.block_number),
    timestamp: nullableString(transfer?.timestamp),
    from: mapEthereumIdentity(transfer?.from),
    to: transfer?.to ? mapEthereumIdentity(transfer.to) : null,
    token: token || {
      address: '',
      name: null,
      symbol: null,
      type: 'Token',
      decimals: null,
      iconUrl: null,
      totalSupply: null,
      circulatingSupply: null,
      holdersCount: null,
      exchangeRate: null,
      marketCap: null,
      volume24h: null,
      reputation: null,
      palette: paletteFromToken(null, transfer?.token?.address_hash || ''),
    },
    tokenId: nullableString(transfer?.token_id),
    value: decimalString(transfer?.total?.value ?? transfer?.value),
    type: nullableString(transfer?.type) || 'token_transfer',
    method: nullableString(transfer?.method),
  };
}

function mapEthereumTokenBalance(balance) {
  const token = mapEthereumToken(balance?.token, balance?.token?.address_hash || '');
  if (!token?.address) return null;
  return {
    token,
    value: decimalString(balance?.value),
  };
}

function mapDecodedInput(input) {
  if (!input || typeof input !== 'object') return null;
  return {
    methodCall: nullableString(input.method_call),
    methodId: nullableString(input.method_id),
    parameters: (Array.isArray(input.parameters) ? input.parameters : []).map((parameter) => ({
      name: nullableString(parameter?.name) || '',
      type: nullableString(parameter?.type) || '',
      value: parameter?.value,
    })),
  };
}

function mapEthereumTransactionMetadata(tx, blockHash) {
  return {
    hash: tx.hash || '',
    status: nullableString(tx.status) || 'unknown',
    result: nullableString(tx.result),
    blockNumber: nullableString(tx.block_number),
    blockHash: nullableString(blockHash || tx.block_hash),
    blockTimestamp: nullableString(tx.timestamp),
    confirmations: nullableString(tx.confirmations),
    transactionIndex: nullableString(tx.position),
    from: mapEthereumIdentity(tx.from),
    to: tx.to ? mapEthereumIdentity(tx.to) : null,
    createdContract: tx.created_contract ? mapEthereumIdentity(tx.created_contract) : null,
    valueWei: decimalString(tx.value),
    feeWei: tx.fee?.value === undefined ? null : decimalString(tx.fee.value),
    gasLimit: decimalString(tx.gas_limit),
    gasUsed: tx.gas_used === undefined ? null : decimalString(tx.gas_used),
    gasPriceWei: tx.gas_price === undefined ? null : decimalString(tx.gas_price),
    maxFeePerGasWei: tx.max_fee_per_gas === undefined ? null : decimalString(tx.max_fee_per_gas),
    maxPriorityFeePerGasWei: tx.max_priority_fee_per_gas === undefined ? null : decimalString(tx.max_priority_fee_per_gas),
    baseFeePerGasWei: tx.base_fee_per_gas === undefined ? null : decimalString(tx.base_fee_per_gas),
    burntFeeWei: tx.transaction_burnt_fee === undefined ? null : decimalString(tx.transaction_burnt_fee),
    priorityFeeWei: tx.priority_fee === undefined ? null : decimalString(tx.priority_fee),
    nonce: decimalString(tx.nonce),
    type: nullableString(tx.type),
    method: nullableString(tx.method),
    input: nullableString(tx.raw_input) || '0x',
    decodedInput: mapDecodedInput(tx.decoded_input),
    tokenTransfers: (Array.isArray(tx.token_transfers) ? tx.token_transfers : []).map(mapEthereumTokenTransfer),
    tokenTransfersOverflow: Boolean(tx.token_transfers_overflow),
    revertReason: nullableString(tx.revert_reason),
    hasError: Boolean(tx.has_error || tx.has_error_in_internal_transactions || tx.status === 'error' || tx.result === 'error'),
  };
}

function mapEthereumAddressMetadata(details, counters, address, tokenBalances = []) {
  return {
    identity: mapEthereumIdentity(details, address),
    token: mapEthereumToken(details?.token, address),
    balanceWei: decimalString(details?.coin_balance),
    exchangeRate: nullableString(details?.exchange_rate),
    creatorAddress: nullableString(details?.creator_address_hash),
    creationTransactionHash: nullableString(details?.creation_tx_hash),
    counters: {
      transactions: nullableString(counters?.transactions_count),
      tokenTransfers: nullableString(counters?.token_transfers_count),
      internalTransactions: nullableString(counters?.internal_transactions_count),
      gasUsed: nullableString(counters?.gas_usage_count),
    },
    tokenBalances: tokenBalances.map(mapEthereumTokenBalance).filter(Boolean).slice(0, 12),
    historyUnavailable: false,
  };
}

function ethereumAddressResponse(address, ethereum, transactionCount = 0) {
  const balance = wei(ethereum.balanceWei);
  return {
    // Marks this non-UTXO compatibility view so the frontend suppresses BTC-only rows.
    electrum: true,
    address,
    chain_stats: { funded_txo_count: 0, funded_txo_sum: balance, spent_txo_count: 0, spent_txo_sum: 0, tx_count: transactionCount },
    mempool_stats: { funded_txo_count: 0, funded_txo_sum: 0, spent_txo_count: 0, spent_txo_sum: 0, tx_count: 0 },
    ethereum,
  };
}

async function rpcAddressMetadata(address) {
  const [balance, code] = await Promise.all([
    rpcJson('eth_getBalance', [address, 'latest'], { requireResult: true }),
    rpcJson('eth_getCode', [address, 'latest'], { requireResult: true }),
  ]);
  return {
    identity: mapEthereumIdentity({ hash: address, is_contract: code !== '0x' }, address),
    token: null,
    balanceWei: hexDecimalString(balance),
    exchangeRate: null,
    creatorAddress: null,
    creationTransactionHash: null,
    // A JSON-RPC endpoint has no address-history index. Avoid presenting an
    // account nonce as a total transaction count or an empty list as history.
    counters: {},
    tokenBalances: [],
    historyUnavailable: true,
  };
}

function gweiToWei(value) {
  return Math.round(number(value) * 1_000_000_000);
}

function timestamp(value) {
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? Math.floor(parsed / 1000) : Math.floor(Date.now() / 1000);
}

function hexBigInt(value, fallback = 0n) {
  try {
    if (typeof value !== 'string' || !/^0x[\da-f]+$/i.test(value)) return fallback;
    return BigInt(value);
  } catch {
    return fallback;
  }
}

function hexDecimalString(value, fallback = '0') {
  return hexBigInt(value, BigInt(fallback)).toString();
}

function hexNumber(value, fallback = 0) {
  const parsed = Number(hexBigInt(value));
  return Number.isFinite(parsed) ? parsed : fallback;
}

function rpcTimestamp(block) {
  const seconds = hexNumber(block?.timestamp);
  return seconds ? new Date(seconds * 1_000).toISOString() : undefined;
}

function rpcIdentity(address) {
  return address ? { hash: address } : null;
}

function rpcTopicAddress(topic) {
  return typeof topic === 'string' && /^0x[\da-f]{64}$/i.test(topic)
    ? `0x${topic.slice(-40)}`
    : '';
}

function rpcTokenTransfers(receipt, blockTimestamp) {
  if (!receipt || !Array.isArray(receipt.logs)) return [];
  return receipt.logs
    .filter((log) => String(log?.topics?.[0] || '').toLowerCase() === ERC20_TRANSFER_TOPIC && log.topics.length >= 3)
    .map((log) => {
      const isNft = log.topics.length >= 4;
      return {
        transaction_hash: receipt.transactionHash,
        log_index: hexDecimalString(log.logIndex),
        block_number: hexDecimalString(receipt.blockNumber),
        timestamp: blockTimestamp,
        from: rpcIdentity(rpcTopicAddress(log.topics[1])),
        to: rpcIdentity(rpcTopicAddress(log.topics[2])),
        token: { address_hash: log.address },
        token_id: isNft ? hexDecimalString(log.topics[3]) : null,
        total: { value: isNft ? '1' : hexDecimalString(log.data) },
        type: isNft ? 'ERC-721' : 'ERC-20',
      };
    });
}

function mapRpcTransaction(tx, receipt, block, tipHeight = 0, pending = false) {
  const rawInput = tx.input || tx.data || '0x';
  const value = hexBigInt(tx.value);
  const gasLimit = hexBigInt(tx.gas);
  const gasUsed = receipt ? hexBigInt(receipt.gasUsed) : null;
  const gasPrice = receipt?.effectiveGasPrice || tx.gasPrice || tx.maxFeePerGas || '0x0';
  const effectiveGasPrice = hexBigInt(gasPrice);
  const baseFee = hexBigInt(block?.baseFeePerGas);
  const fee = gasUsed === null ? null : gasUsed * effectiveGasPrice;
  const burntFee = gasUsed === null ? null : gasUsed * baseFee;
  const priorityFee = fee === null ? null : fee > (burntFee || 0n) ? fee - (burntFee || 0n) : 0n;
  const tokenTransfers = rpcTokenTransfers(receipt, rpcTimestamp(block));
  const transactionTypes = [];
  if (value > 0n && rawInput === '0x') transactionTypes.push('coin_transfer');
  if (rawInput !== '0x') transactionTypes.push('contract_call');
  if (tokenTransfers.length) transactionTypes.push('token_transfer');
  if (!transactionTypes.length && tx.to) transactionTypes.push('coin_transfer');

  const confirmed = !pending && Boolean(tx.blockNumber);
  const blockNumber = confirmed ? hexNumber(tx.blockNumber) : 0;
  return {
    hash: tx.hash,
    status: receipt ? (hexBigInt(receipt.status) === 1n ? 'ok' : 'error') : (confirmed ? 'ok' : 'pending'),
    result: receipt ? (hexBigInt(receipt.status) === 1n ? 'success' : 'error') : null,
    block_number: confirmed ? String(blockNumber) : null,
    block_hash: confirmed ? tx.blockHash : null,
    timestamp: rpcTimestamp(block),
    confirmations: confirmed && tipHeight >= blockNumber ? String(tipHeight - blockNumber + 1) : null,
    position: confirmed ? hexDecimalString(tx.transactionIndex) : null,
    from: rpcIdentity(tx.from),
    to: rpcIdentity(tx.to),
    created_contract: receipt?.contractAddress ? rpcIdentity(receipt.contractAddress) : null,
    value: value.toString(),
    fee: fee === null ? { value: (gasLimit * effectiveGasPrice).toString() } : { value: fee.toString() },
    gas_limit: gasLimit.toString(),
    gas_used: gasUsed === null ? undefined : gasUsed.toString(),
    gas_price: effectiveGasPrice.toString(),
    max_fee_per_gas: tx.maxFeePerGas ? hexDecimalString(tx.maxFeePerGas) : undefined,
    max_priority_fee_per_gas: tx.maxPriorityFeePerGas ? hexDecimalString(tx.maxPriorityFeePerGas) : undefined,
    base_fee_per_gas: block?.baseFeePerGas ? baseFee.toString() : undefined,
    transaction_burnt_fee: burntFee === null ? undefined : burntFee.toString(),
    priority_fee: priorityFee === null ? undefined : priorityFee.toString(),
    nonce: hexDecimalString(tx.nonce),
    type: hexDecimalString(tx.type),
    method: rawInput.length >= 10 ? rawInput.slice(0, 10) : null,
    raw_input: rawInput,
    token_transfers: tokenTransfers,
    transaction_types: transactionTypes,
    has_error: receipt ? hexBigInt(receipt.status) !== 1n : false,
  };
}

function orderedRpcProviders() {
  return [activeRpcProvider, ...rpcProviders.filter((provider) => provider !== activeRpcProvider)].filter(Boolean);
}

async function rpcJson(method, params = [], options = {}) {
  let lastError;
  for (const provider of orderedRpcProviders()) {
    try {
      const response = await fetch(provider, {
        method: 'POST',
        headers: { accept: 'application/json', 'content-type': 'application/json', 'user-agent': 'eth-taxi/0.1' },
        body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
        signal: AbortSignal.timeout(12_000),
      });
      if (!response.ok) throw new Error(`${provider} ${method} returned ${response.status}`);
      const payload = await response.json();
      if (payload?.error) throw new Error(`${provider} ${method} returned ${payload.error.message || payload.error.code}`);
      if (options.requireResult && (payload?.result === null || payload?.result === undefined)) {
        throw new Error(`${provider} ${method} returned no result`);
      }
      activeRpcProvider = provider;
      activeProvider = provider;
      return payload?.result;
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError || new Error(`No Ethereum RPC providers configured for ${method}`);
}

async function providerJson(requestPath) {
  let lastError;
  for (const provider of providers) {
    const cooldownUntil = providerCooldowns.get(provider) || 0;
    if (cooldownUntil > Date.now()) {
      lastError = new Error(`${provider} is rate limited until ${new Date(cooldownUntil).toISOString()}`);
      continue;
    }
    try {
      const response = await fetch(new URL(requestPath.replace(/^\//, ''), `${provider}/`), {
        headers: { accept: 'application/json', 'user-agent': 'eth-taxi/0.1' },
        signal: AbortSignal.timeout(12_000),
      });
      if (!response.ok) {
        if (response.status === 429) providerCooldowns.set(provider, Date.now() + EXPLORER_RATE_LIMIT_COOLDOWN_MS);
        throw new Error(`${provider}${requestPath} returned ${response.status}`);
      }
      activeProvider = provider;
      return response.json();
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError || new Error('No Ethereum providers configured');
}

async function rpcTransactionById(id) {
  const transaction = await rpcJson('eth_getTransactionByHash', [id], { requireResult: true });
  const [receipt, block, tip] = await Promise.all([
    rpcJson('eth_getTransactionReceipt', [id]).catch(() => null),
    transaction.blockHash ? rpcJson('eth_getBlockByHash', [transaction.blockHash, false]).catch(() => null) : Promise.resolve(null),
    transaction.blockNumber ? rpcJson('eth_blockNumber').catch(() => null) : Promise.resolve(null),
  ]);
  const fallback = mapRpcTransaction(transaction, receipt, block, hexNumber(tip));
  return mapTransactionDetail(fallback, transaction.blockHash);
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

function mapRpcBlock(block) {
  const baseFee = hexNumber(block?.baseFeePerGas);
  const transactionCount = Array.isArray(block?.transactions) ? block.transactions.length : 0;
  return {
    id: block?.hash || '',
    height: hexNumber(block?.number),
    version: 0,
    timestamp: hexNumber(block?.timestamp),
    bits: 0,
    nonce: hexNumber(block?.nonce),
    difficulty: hexNumber(block?.totalDifficulty || block?.difficulty),
    merkle_root: '',
    tx_count: transactionCount,
    size: hexNumber(block?.size),
    weight: hexNumber(block?.gasUsed),
    previousblockhash: block?.parentHash || '',
    extras: {
      reward: 0,
      totalFees: 0,
      medianFee: baseFee,
      minFee: baseFee,
      maxFee: baseFee,
      feeRange: [baseFee, baseFee, baseFee, baseFee, baseFee, baseFee, baseFee],
      pool: { id: 0, name: block?.miner || 'Unknown validator', slug: 'ethereum-validator' },
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
    ethereum: mapEthereumTransactionMetadata(tx, blockHash),
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
      scriptsig_asm: tx.method || (rawInput === '0x' ? 'Transfer' : 'Contract call'),
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

function sampleMempool(pendingItems, gasUsed, gasFees, market) {
  const sample = {
    // Retain the compatibility fields used by shared mempool components.
    added: Math.floor(Date.now() / 1000),
    count: pendingItems.length,
    vbytes_per_second: 0,
    total_fee: gasFees,
    mempool_byte_weight: gasUsed,
    vsizes: [],
    // Ethereum-native data powers the gas-market history graph. These values
    // describe the public pending sample, not a complete global txpool.
    base_fee_gwei: market.baseFeeGwei,
    network_utilization_percentage: market.networkUtilization,
    gas_price_slow_gwei: market.slow,
    gas_price_average_gwei: market.average,
    gas_price_fast_gwei: market.fast,
    pending_sample_count: pendingItems.length,
    pending_sample_gas: gasUsed,
    pending_sample_max_fee_wei: gasFees,
    pending_sample_truncated: market.pendingSampleTruncated,
  };
  const previous = mempoolSamples.at(-1);
  if (!previous || sample.added - previous.added >= 10) {
    mempoolSamples.push(sample);
    mempoolSamples = mempoolSamples.filter((item) => item.added >= sample.added - 7_200);
  }
  return mempoolSamples.at(-1);
}

function snapshotSignature(data) {
  const tip = data.blocks.at(-1)?.id || '';
  const pending = data.projectedTransactions
    .map((transaction) => `${transaction.txid}:${transaction.fee}:${transaction.vsize}:${transaction.flags}`)
    .join(',');
  return `${tip}|${data.mempoolInfo.size}|${data.mempoolInfo.usage}|${data.mempoolInfo.total_fee}|${pending}`;
}

function projectedBlockPayload(data, index) {
  return {
    'projected-block-transactions': {
      index,
      sequence: Date.now(),
      // Ethereum has no deterministic Bitcoin-style multi-block package
      // projection. The current pending sample is the next-slot estimate.
      blockTransactions: index === 0 ? data.projectedTransactions.map(compressTransaction) : [],
    },
  };
}

function sendProjectedBlock(socket, data, index) {
  if (socket.readyState !== socket.OPEN) return;
  socket.send(JSON.stringify(projectedBlockPayload(data, index)));
}

function sendSocket(socket, payload) {
  if (socket.readyState !== socket.OPEN) return false;
  try {
    socket.send(JSON.stringify(payload));
    return true;
  } catch {
    return false;
  }
}

function transactionStreamSignature(transaction) {
  const status = transaction?.status || {};
  const ethereum = transaction?.ethereum || {};
  const tokenTransfers = (ethereum.tokenTransfers || [])
    .map((transfer) => `${transfer.transactionHash}:${transfer.logIndex}:${transfer.value}:${transfer.token?.address}`)
    .join(',');
  return [
    transaction?.txid,
    status.confirmed ? 'confirmed' : 'pending',
    status.block_height || '',
    ethereum.confirmations || '',
    ethereum.status || '',
    ethereum.result || '',
    transaction?.fee || 0,
    transaction?.vsize || 0,
    transaction?.value || 0,
    tokenTransfers,
  ].join('|');
}

async function streamTrackedTransaction(socket, txid, force = false) {
  const signatures = transactionStreamSignatures.get(socket);
  if (!signatures) return;

  try {
    const transaction = await transactionById(txid);
    const signature = transactionStreamSignature(transaction);
    if (force || signatures.get(txid) !== signature) {
      signatures.set(txid, signature);
      // `tx` is the established mempool websocket event. Reusing it keeps the
      // transaction page's existing state and change-detection path intact.
      sendSocket(socket, { tx: transaction });
    }
  } catch {
    // Public explorers can lag a just-broadcast transaction. Keep the
    // subscription alive and try again on the next source update.
  }
}

function addressTransactionSignature(transaction) {
  const status = transaction?.status || {};
  const ethereum = transaction?.ethereum || {};
  return [
    transaction?.txid,
    status.confirmed ? 'confirmed' : 'pending',
    status.block_height || '',
    ethereum.confirmations || '',
    ethereum.status || '',
    ethereum.result || '',
  ].join('|');
}

async function primeAddressSubscription(socket, address) {
  const snapshots = addressTransactionSnapshots.get(socket);
  if (!snapshots) return;

  try {
    const transactions = await addressTransactions(address);
    snapshots.set(address, new Map(transactions.map((transaction) => [transaction.txid, addressTransactionSignature(transaction)])));
  } catch {
    // The address page already has its normal initial HTTP fetch. Failing to
    // prime a live subscription must not change that page into an error state.
  }
}

async function streamAddressSubscription(socket, address) {
  const snapshots = addressTransactionSnapshots.get(socket);
  if (!snapshots) return;

  try {
    const transactions = await addressTransactions(address);
    const previous = snapshots.get(address) || new Map();
    const next = new Map();

    for (const transaction of transactions) {
      const signature = addressTransactionSignature(transaction);
      const previousSignature = previous.get(transaction.txid);
      next.set(transaction.txid, signature);

      if (!previousSignature) {
        sendSocket(socket, transaction.status?.confirmed
          ? { 'block-transactions': [transaction] }
          : { 'address-transactions': [transaction] });
      } else if (previousSignature !== signature && transaction.status?.confirmed) {
        // A tracked pending transaction was included in a block. The inherited
        // address component already knows how to replace its pending status.
        sendSocket(socket, { 'block-transactions': [transaction] });
      }
    }

    // Do not synthesize removals from a paginated public-explorer response.
    // A newly seen transaction can push an older pending item off the page.
    snapshots.set(address, next);
  } catch {
    // Retain the last successful state and retry after the next source update.
  }
}

async function streamSubscriptions() {
  const streams = [];
  for (const socket of sockets) {
    for (const txid of transactionSubscriptions.get(socket) || []) {
      streams.push(streamTrackedTransaction(socket, txid));
    }
    for (const address of addressSubscriptions.get(socket) || []) {
      streams.push(streamAddressSubscription(socket, address));
    }
  }
  await Promise.allSettled(streams);
}

async function broadcastSnapshot(data) {
  const encoded = JSON.stringify(data);
  for (const socket of sockets) {
    if (socket.readyState !== socket.OPEN) continue;
    try {
      socket.send(encoded);
      for (const index of mempoolBlockSubscriptions.get(socket) || []) {
        sendProjectedBlock(socket, data, index);
      }
    } catch {
      // A socket can close between readyState and send; its close handler
      // removes the subscription state.
    }
  }
  await streamSubscriptions();
}

async function blocksEndingAt(height) {
  try {
    const heights = Array.from({ length: 6 }, (_, index) => height - index).filter((value) => value > 0);
    const blocks = await Promise.all(heights.map(async (blockHeight) => {
      try { return mapBlock(await providerJson(`/api/v2/blocks/${blockHeight}`)); } catch { return null; }
    }));
    const available = blocks.filter(Boolean);
    if (available.length) return available;
    throw new Error('No indexed blocks returned');
  } catch {
    const heights = Array.from({ length: 6 }, (_, index) => height - index).filter((value) => value > 0);
    const blocks = await Promise.all(heights.map(async (blockHeight) => {
      try {
        return mapRpcBlock(await rpcJson('eth_getBlockByNumber', [`0x${blockHeight.toString(16)}`, false], { requireResult: true }));
      } catch {
        return null;
      }
    }));
    return blocks.filter(Boolean);
  }
}

async function blockById(id) {
  try {
    return mapBlock(await providerJson(`/api/v2/blocks/${encodeURIComponent(id)}`));
  } catch {
    const isHash = /^0x[a-f\d]{64}$/i.test(id);
    const block = await rpcJson(
      isHash ? 'eth_getBlockByHash' : 'eth_getBlockByNumber',
      isHash ? [id, false] : [`0x${Number(id).toString(16)}`, false],
      { requireResult: true },
    );
    return mapRpcBlock(block);
  }
}

async function transactionById(id) {
  try {
    const transaction = await providerJson(`/api/v2/transactions/${encodeURIComponent(id)}`);
    let blockHash;
    if (transaction.block_number) {
      try { blockHash = (await providerJson(`/api/v2/blocks/${transaction.block_number}`)).hash; } catch { /* Detail remains useful without a block hash. */ }
    }
    return mapTransactionDetail(transaction, blockHash);
  } catch (explorerError) {
    try {
      return await rpcTransactionById(id);
    } catch (rpcError) {
      throw new Error(`Indexer unavailable (${explorerError.message}); RPC fallback unavailable (${rpcError.message})`);
    }
  }
}

async function addressById(address) {
  try {
    const [details, transactions, counters, tokens] = await Promise.all([
      providerJson(`/api/v2/addresses/${encodeURIComponent(address)}`),
      providerJson(`/api/v2/addresses/${encodeURIComponent(address)}/transactions`),
      providerJson(`/api/v2/addresses/${encodeURIComponent(address)}/counters`).catch(() => ({})),
      providerJson(`/api/v2/addresses/${encodeURIComponent(address)}/tokens`).catch(() => ({ items: [] })),
    ]);
    const ethereum = mapEthereumAddressMetadata(details, counters, address, tokens.items || []);
    return ethereumAddressResponse(details.hash || address, ethereum, number(counters.transactions_count, (transactions.items || []).length));
  } catch {
    return ethereumAddressResponse(address, await rpcAddressMetadata(address));
  }
}

async function addressTransactions(address) {
  try {
    const response = await providerJson(`/api/v2/addresses/${encodeURIComponent(address)}/transactions`);
    return (response.items || []).map((transaction) => mapTransactionDetail(transaction, transaction.block_hash));
  } catch {
    // Standard JSON-RPC exposes balances and contract code but not an address
    // history index. The frontend receives `historyUnavailable` from the
    // companion address response and can state that distinction plainly.
    return [];
  }
}

async function blockTransactions(blockId, start = 0) {
  try {
    const response = await providerJson(`/api/v2/blocks/${encodeURIComponent(blockId)}/transactions`);
    return (response.items || [])
      .slice(start, start + 25)
      .map((transaction) => mapTransactionDetail(transaction, blockId));
  } catch {
    const isHash = /^0x[a-f\d]{64}$/i.test(blockId);
    const block = await rpcJson(
      isHash ? 'eth_getBlockByHash' : 'eth_getBlockByNumber',
      isHash ? [blockId, true] : [`0x${Number(blockId).toString(16)}`, true],
      { requireResult: true },
    );
    const tip = await rpcJson('eth_blockNumber').catch(() => null);
    return (block.transactions || [])
      .slice(start, start + 25)
      .map((transaction) => mapTransactionDetail(mapRpcTransaction(transaction, null, block, hexNumber(tip)), block.hash));
  }
}

async function ethereumAddressMetadata(address) {
  try {
    const [details, counters, tokens] = await Promise.all([
      providerJson(`/api/v2/addresses/${encodeURIComponent(address)}`),
      providerJson(`/api/v2/addresses/${encodeURIComponent(address)}/counters`).catch(() => ({})),
      providerJson(`/api/v2/addresses/${encodeURIComponent(address)}/tokens`).catch(() => ({ items: [] })),
    ]);
    return mapEthereumAddressMetadata(details, counters, address, tokens.items || []);
  } catch {
    return rpcAddressMetadata(address);
  }
}

async function ethereumToken(address) {
  const token = await providerJson(`/api/v2/tokens/${encodeURIComponent(address)}`);
  return mapEthereumToken(token, address);
}

async function ethereumTokenTransfers(address, searchParams) {
  const query = new URLSearchParams();
  for (const key of ['block_number', 'index', 'items_count']) {
    const value = searchParams.get(key);
    if (value && /^[0-9]+$/.test(value)) query.set(key, value);
  }
  const response = await providerJson(`/api/v2/tokens/${encodeURIComponent(address)}/transfers${query.size ? `?${query}` : ''}`);
  return {
    items: (response.items || []).map(mapEthereumTokenTransfer),
    nextPageParams: response.next_page_params || null,
  };
}

async function blockscoutSnapshot() {
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
  const liveMempoolSample = sampleMempool(pendingItems, gasUsed, gasFees, {
    baseFeeGwei: gwei(blocks[0]?.base_fee_per_gas),
    networkUtilization: number(stats.network_utilization_percentage),
    slow,
    average,
    fast,
    pendingSampleTruncated: Boolean(pending.next_page_params),
  });
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

async function rpcSnapshot() {
  const tipHeightHex = await rpcJson('eth_blockNumber');
  const tipHeight = hexNumber(tipHeightHex);
  const blockNumbers = Array.from({ length: 6 }, (_, index) => tipHeight - index).filter((height) => height > 0);
  const [blocks, feeHistory, gasPrice, pendingBlock] = await Promise.all([
    Promise.all(blockNumbers.map((height) => rpcJson('eth_getBlockByNumber', [`0x${height.toString(16)}`, false], { requireResult: true }))),
    rpcJson('eth_feeHistory', ['0x5', 'latest', [10, 50, 90]]).catch(() => null),
    rpcJson('eth_gasPrice').catch(() => null),
    rpcJson('eth_getBlockByNumber', ['pending', true]).catch(() => null),
  ]);
  const mappedBlocks = blocks.map(mapRpcBlock).reverse();
  const pendingRaw = Array.isArray(pendingBlock?.transactions) ? pendingBlock.transactions.slice(0, 150) : [];
  const pendingItems = pendingRaw.map((transaction) => mapRpcTransaction(transaction, null, pendingBlock, tipHeight, true));
  const pendingTransactions = pendingItems.map(mapTransaction);
  const latestBlock = blocks[0];
  const latestRewards = Array.isArray(feeHistory?.reward) ? feeHistory.reward.at(-1) || [] : [];
  const baseFee = hexBigInt(feeHistory?.baseFeePerGas?.at(-1) || latestBlock?.baseFeePerGas);
  const fallbackGasPrice = hexBigInt(gasPrice);
  const marketPrice = (index) => {
    const reward = hexBigInt(latestRewards[index]);
    const total = baseFee + reward;
    return gwei((total > 0n ? total : fallbackGasPrice).toString());
  };
  const slow = marketPrice(0);
  const average = marketPrice(1);
  const fast = marketPrice(2);
  const gasUsed = pendingItems.reduce((sum, item) => sum + number(item.gas_limit || item.gas_used), 0);
  const gasFees = pendingItems.reduce((sum, item) => sum + wei(item.fee?.value), 0);
  const liveMempoolSample = sampleMempool(pendingItems, gasUsed, gasFees, {
    baseFeeGwei: gwei(baseFee.toString()),
    networkUtilization: number(feeHistory?.gasUsedRatio?.at(-1)) * 100,
    slow,
    average,
    fast,
    pendingSampleTruncated: pendingRaw.length === 150,
  });
  const tip = mappedBlocks.at(-1);
  cachedSnapshot = {
    backend: 'ethereum-rpc',
    backendInfo: { hostname: new URL(activeRpcProvider).hostname, version: 'eth-taxi-adapter', gitCommit: 'main', lightning: false },
    loadingIndicators: { mempool: 100 },
    blocks: mappedBlocks,
    'mempool-blocks': pendingTransactions.length ? [{ blockSize: gasUsed, blockVSize: Math.ceil(gasUsed / 4), nTx: pendingTransactions.length, medianFee: gweiToWei(average), totalFees: gasFees, feeRange: [slow, slow, average, average, fast, fast, fast].map(gweiToWei), index: 0 }] : [],
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
    conversions: { USD: -1 },
  };
  cachedAt = Date.now();
  return cachedSnapshot;
}

async function snapshot(force = false) {
  if (!force && cachedSnapshot && Date.now() - cachedAt < 4_000) return cachedSnapshot;
  try {
    return await blockscoutSnapshot();
  } catch {
    return rpcSnapshot();
  }
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
    /^\/api\/v1\/ethereum\/address\/0x[a-fA-F0-9]{40}$/,
    /^\/api\/v1\/ethereum\/token\/0x[a-fA-F0-9]{40}(?:\/transfers)?$/,
    /^\/api\/v1\/ethereum\/transaction\/0x[a-fA-F0-9]+$/,
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
    const ethereumAddressMatch = requestPath.match(/^\/api\/v1\/ethereum\/address\/(0x[a-fA-F0-9]{40})$/);
    if (ethereumAddressMatch) return respond(res, 200, await ethereumAddressMetadata(ethereumAddressMatch[1]));
    const ethereumTokenTransfersMatch = requestPath.match(/^\/api\/v1\/ethereum\/token\/(0x[a-fA-F0-9]{40})\/transfers$/);
    if (ethereumTokenTransfersMatch) return respond(res, 200, await ethereumTokenTransfers(ethereumTokenTransfersMatch[1], requestUrl.searchParams));
    const ethereumTokenMatch = requestPath.match(/^\/api\/v1\/ethereum\/token\/(0x[a-fA-F0-9]{40})$/);
    if (ethereumTokenMatch) return respond(res, 200, await ethereumToken(ethereumTokenMatch[1]));
    const ethereumTransactionMatch = requestPath.match(/^\/api\/v1\/ethereum\/transaction\/(0x[a-fA-F0-9]+)$/);
    if (ethereumTransactionMatch) return respond(res, 200, (await transactionById(ethereumTransactionMatch[1])).ethereum);
    const transactionMatch = requestPath.match(/^\/(?:api(?:\/v1)?)?\/tx\/(0x[a-fA-F0-9]+)$/);
    if (transactionMatch) return respond(res, 200, await transactionById(transactionMatch[1]));
    const addressTransactionsMatch = requestPath.match(/^\/api\/address\/(0x[a-fA-F0-9]{40})\/txs$/);
    if (addressTransactionsMatch) return respond(res, 200, await addressTransactions(addressTransactionsMatch[1]));
    const addressMatch = requestPath.match(/^\/api\/address\/(0x[a-fA-F0-9]{40})$/);
    if (addressMatch) return respond(res, 200, await addressById(addressMatch[1]));
    const statusMatch = requestPath.match(/^\/api\/tx\/(0x[a-fA-F0-9]+)\/status$/);
    if (statusMatch) return respond(res, 200, (await transactionById(statusMatch[1])).status);
    const blocksMatch = requestPath.match(/^\/api\/v1\/blocks\/(\d+)$/);
    if (blocksMatch) return respond(res, 200, await blocksEndingAt(Number(blocksMatch[1])));
    const blockMatch = requestPath.match(/^\/api\/v1\/block\/(0x[a-fA-F0-9]+)$/);
    if (blockMatch) return respond(res, 200, await blockById(blockMatch[1]));
    const blockSummaryMatch = requestPath.match(/^\/api\/v1\/block\/(0x[a-fA-F0-9]+)\/summary$/);
    if (blockSummaryMatch) return respond(res, 200, await blockTransactions(blockSummaryMatch[1]));
    const blockTransactionsMatch = requestPath.match(/^\/api\/block\/(0x[a-fA-F0-9]+)\/txs\/(\d+)$/);
    if (blockTransactionsMatch) return respond(res, 200, await blockTransactions(blockTransactionsMatch[1], Number(blockTransactionsMatch[2])));
    if (/^\/api\/v1\/cpfp\/0x[a-fA-F0-9]+$/.test(requestPath)) {
      return respond(res, 200, { ancestors: [], descendants: [], bestDescendant: null });
    }
    if (/^\/api\/v1\/tx\/0x[a-fA-F0-9]+\/rbf$/.test(requestPath)) {
      return respond(res, 200, { replacements: null, replaces: [] });
    }
    if (/^\/api\/v1\/mining\/pools(?:\/[^/]+)?$/.test(requestPath)) {
      return respond(res, 200, []);
    }
    if (requestPath === '/api/txs/outspends') {
      return respond(res, 200, requestUrl.searchParams.get('txids')?.split(',').filter(Boolean).map(() => [{ spent: false }]) || []);
    }
    if (requestPath === '/api/v1/historical-price') {
      return respond(res, 200, {
        prices: [{ time: 0, USD: -1, EUR: -1, GBP: -1, CAD: -1, CHF: -1, AUD: -1, JPY: -1 }],
        exchangeRates: { USDEUR: 0, USDGBP: 0, USDCAD: 0, USDCHF: 0, USDAUD: 0, USDJPY: 0 },
      });
    }
    const data = await snapshot();
    if (requestPath === '/api/v1/init-data') return respond(res, 200, data);
    if (requestPath === '/api/v1/blocks') return respond(res, 200, data.blocks);
    if (requestPath === '/api/v1/txs') return respond(res, 200, data.transactions);
    if (requestPath === '/api/v1/transaction-times') {
      return respond(res, 200, requestUrl.searchParams.getAll('txId[]').map((id) => data.transactions.find((tx) => tx.txid === id)?.time || Math.floor(Date.now() / 1000)));
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
  const trackedMempoolBlocks = new Set();
  const trackedTransactions = new Set();
  const trackedAddresses = new Set();
  mempoolBlockSubscriptions.set(socket, trackedMempoolBlocks);
  transactionSubscriptions.set(socket, trackedTransactions);
  transactionStreamSignatures.set(socket, new Map());
  addressSubscriptions.set(socket, trackedAddresses);
  addressTransactionSnapshots.set(socket, new Map());
  socket.on('close', () => {
    sockets.delete(socket);
    mempoolBlockSubscriptions.delete(socket);
    transactionSubscriptions.delete(socket);
    transactionStreamSignatures.delete(socket);
    addressSubscriptions.delete(socket);
    addressTransactionSnapshots.delete(socket);
  });
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
      if (request['track-tx'] === 'stop') {
        trackedTransactions.clear();
        transactionStreamSignatures.get(socket)?.clear();
        return;
      }
      if (typeof request['track-tx'] === 'string' && request['track-tx'] !== 'stop') {
        const data = await snapshot();
        const txid = request['track-tx'];
        const transaction = data.projectedTransactions.find((item) => item.txid === txid);
        trackedTransactions.add(txid);
        // Ethereum's pending pool has no Bitcoin-style package position. A
        // pending transaction is instead estimated for the next validator slot.
        socket.send(JSON.stringify({
          txPosition: {
            txid,
            position: { block: 0, vsize: transaction?.vsize || 0 },
            cpfp: null,
            accelerationPositions: [],
          },
        }));
        await streamTrackedTransaction(socket, txid, true);
        return;
      }
      if (request['track-address'] === 'stop') {
        trackedAddresses.clear();
        addressTransactionSnapshots.get(socket)?.clear();
        return;
      }
      if (typeof request['track-address'] === 'string' && /^0x[a-fA-F0-9]{40}$/.test(request['track-address'])) {
        const address = request['track-address'];
        // The shared client tracks one address view at a time. Replacing the
        // previous subscription prevents stale pages from consuming provider IO.
        trackedAddresses.clear();
        trackedAddresses.add(address);
        addressTransactionSnapshots.get(socket)?.clear();
        await primeAddressSubscription(socket, address);
        return;
      }
      if (Number.isInteger(request['track-mempool-block']) && request['track-mempool-block'] >= 0) {
        const data = await snapshot();
        const index = request['track-mempool-block'];
        trackedMempoolBlocks.add(index);
        sendProjectedBlock(socket, data, index);
        return;
      }
      if (request['track-mempool-block'] === -1) {
        trackedMempoolBlocks.clear();
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
  if (!sockets.size || pollInFlight) return;
  pollInFlight = true;
  try {
    const data = await snapshot(true);
    const signature = snapshotSignature(data);
    const now = Date.now();
    if (signature !== lastBroadcastSignature || now - lastBroadcastAt >= HEARTBEAT_INTERVAL_MS) {
      lastBroadcastSignature = signature;
      lastBroadcastAt = now;
      await broadcastSnapshot(data);
    }
  } catch { /* Retain the last good provider response. */ }
  finally { pollInFlight = false; }
}, POLL_INTERVAL_MS).unref();

server.listen(port, host, () => console.log(`ETH adapter listening on http://${host}:${port}`));
