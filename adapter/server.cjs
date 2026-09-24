#!/usr/bin/env node
'use strict';

const fs = require('node:fs/promises');
const fsSync = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { URL } = require('node:url');
const parse5 = require('parse5');
const sharp = require('sharp');
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
const transactionStreamRequests = new WeakSet();
const addressSubscriptions = new Map();
const addressTransactionSnapshots = new Map();
const addressMetadataCache = new Map();
const addressHistoryCache = new Map();
const addressHistoryCursorCache = new Map();
const rpcBlockFeeCache = new Map();
const tokenMetadataCache = new Map();
const ogImageCache = new Map();
const ogImagePending = new Map();
const ogFallbackCards = new Map();
let ogBrandLogoDataUri;
let ogActiveLoads = 0;
let activeProvider = providers[0];
let activeRpcProvider = rpcProviders[0];
let cachedSnapshot;
let cachedAt = 0;
let mempoolSamples = [];
let lastBroadcastSignature = '';
let lastBroadcastAt = 0;
let pollInFlight = false;
let transactionPollInFlight = false;
const providerCooldowns = new Map();

const POLL_INTERVAL_MS = Math.max(3_000, Number(process.env.ETH_POLL_INTERVAL_MS || 6_000));
const HEARTBEAT_INTERVAL_MS = 30_000;
const EXPLORER_RATE_LIMIT_COOLDOWN_MS = 15_000;
const EXPLORER_MAX_RATE_LIMIT_COOLDOWN_MS = 60_000;
const ADDRESS_METADATA_CACHE_MS = 15_000;
const ADDRESS_HISTORY_CACHE_MS = 5_000;
const ADDRESS_CACHE_LIMIT = 256;
const ERC20_TRANSFER_TOPIC = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';
const BLOB_GAS_PER_BLOB = 131_072n;
const RPC_TOKEN_TRANSFER_BLOCK_SPAN = 2;
const RPC_TOKEN_TRANSFER_LIMIT = 100;
const BLOCK_PAGE_SIZE = 15;
const TOKEN_METADATA_CACHE_MS = 15 * 60_000;
const OG_CACHE_LIMIT = 128;
const OG_MAX_ACTIVE_LOADS = 8;
const OG_REQUEST_TIMEOUT_MS = 8_000;
const OG_IMAGE_WIDTH = 1200;
const OG_IMAGE_HEIGHT = 630;
const OG_ORIGIN = 'https://eth.tx.taxi';
const OG_CARD_VERSION = '3';
const TRANSACTION_TOKEN_METADATA_LIMIT = 12;
const ETH_PRICE_API_URL = (process.env.ETH_PRICE_API_URL || 'https://api.coingecko.com/api/v3').replace(/\/$/, '');
const ETH_COINBASE_API_URL = (process.env.ETH_COINBASE_API_URL || 'https://api.exchange.coinbase.com').replace(/\/$/, '');
const ETH_PRICE_HISTORY_DAYS = Math.max(1, Number(process.env.ETH_PRICE_HISTORY_DAYS || 365));
const ETH_PRICE_HISTORY_CACHE_MS = Math.max(60_000, Number(process.env.ETH_PRICE_HISTORY_CACHE_MS || 60 * 60_000));
const ETH_PRICE_POINT_CACHE_MS = Math.max(60_000, Number(process.env.ETH_PRICE_POINT_CACHE_MS || 12 * 60 * 60_000));
const ETH_FIAT_CURRENCIES = ['USD', 'EUR', 'GBP', 'CAD', 'CHF', 'AUD', 'JPY'];
const ethereumPriceCache = new Map();

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

function emptyEthereumPrice(time = Math.floor(Date.now() / 1000)) {
  return Object.fromEntries([
    ['time', time],
    ...ETH_FIAT_CURRENCIES.map((currency) => [currency, -1]),
  ]);
}

function emptyEthereumExchangeRates() {
  return {
    USDEUR: 0,
    USDGBP: 0,
    USDCAD: 0,
    USDCHF: 0,
    USDAUD: 0,
    USDJPY: 0,
  };
}

function normalizeEthereumFiatCurrency(currency) {
  const normalized = String(currency || 'USD').toUpperCase();
  return ETH_FIAT_CURRENCIES.includes(normalized) ? normalized : 'USD';
}

function exchangeRatesFromEthereumPrice(price) {
  if (!price || price.USD <= 0) return emptyEthereumExchangeRates();
  return {
    USDEUR: price.EUR > 0 ? price.EUR / price.USD : 0,
    USDGBP: price.GBP > 0 ? price.GBP / price.USD : 0,
    USDCAD: price.CAD > 0 ? price.CAD / price.USD : 0,
    USDCHF: price.CHF > 0 ? price.CHF / price.USD : 0,
    USDAUD: price.AUD > 0 ? price.AUD / price.USD : 0,
    USDJPY: price.JPY > 0 ? price.JPY / price.USD : 0,
  };
}

function cachedEthereumPrice(key, ttl, load) {
  const cached = ethereumPriceCache.get(key);
  if (cached?.value && cached.expiresAt > Date.now()) return Promise.resolve(cached.value);
  if (cached?.request) return cached.request;

  const request = Promise.resolve()
    .then(load)
    .then((value) => {
      ethereumPriceCache.set(key, { value, expiresAt: Date.now() + ttl, request: null });
      while (ethereumPriceCache.size > 512) ethereumPriceCache.delete(ethereumPriceCache.keys().next().value);
      return value;
    })
    .catch((error) => {
      ethereumPriceCache.delete(key);
      throw error;
    });

  ethereumPriceCache.set(key, { value: cached?.value, expiresAt: cached?.expiresAt || 0, request });
  return request;
}

async function ethereumPriceJson(url) {
  const response = await fetch(url, {
    headers: { accept: 'application/json', 'user-agent': 'eth-taxi/0.1' },
    signal: AbortSignal.timeout(8_000),
  });
  if (!response.ok) throw new Error(`Ethereum price source returned ${response.status}`);
  return response.json();
}

async function ethereumUsdCandles(granularity, from, to) {
  const query = new URLSearchParams({
    granularity: String(granularity),
    start: new Date(from * 1000).toISOString(),
    end: new Date(to * 1000).toISOString(),
  });
  const candles = await ethereumPriceJson(`${ETH_COINBASE_API_URL}/products/ETH-USD/candles?${query}`);
  if (!Array.isArray(candles)) throw new Error('Ethereum USD price source returned no candles');
  return candles;
}

async function ethereumUsdHistoricalPrice(timestamp) {
  const hour = Math.floor(timestamp / 3600) * 3600;
  const candles = await ethereumUsdCandles(3600, hour - 3600, hour + 7200);
  let closest;
  for (const candle of candles) {
    const time = number(candle?.[0], -1);
    const value = number(candle?.[4], -1);
    if (time < 0 || value <= 0) continue;
    if (!closest || Math.abs(time - timestamp) < Math.abs(closest.time - timestamp)) {
      closest = { time, value };
    }
  }
  if (!closest) throw new Error('Ethereum USD price source returned no usable candle');
  const price = emptyEthereumPrice(closest.time);
  price.USD = closest.value;
  return price;
}

async function ethereumUsdPriceHistory() {
  const now = Math.floor(Date.now() / 1000);
  const from = Math.max(0, now - ETH_PRICE_HISTORY_DAYS * 24 * 60 * 60);
  const ranges = [];
  for (let end = now; end > from;) {
    const start = Math.max(from, end - 299 * 24 * 60 * 60);
    ranges.push([start, end]);
    end = start - 1;
  }
  const candles = (await Promise.all(ranges.map(([start, end]) => ethereumUsdCandles(86400, start, end)))).flat();
  const prices = new Map();
  for (const candle of candles) {
    const time = number(candle?.[0], -1);
    const value = number(candle?.[4], -1);
    if (time < 0 || value <= 0) continue;
    const price = emptyEthereumPrice(time);
    price.USD = value;
    prices.set(time, price);
  }
  return [...prices.values()].sort((left, right) => right.time - left.time);
}

async function ethereumHistoricalPrice(timestamp, requestedCurrency) {
  const currency = normalizeEthereumFiatCurrency(requestedCurrency);
  const bucket = Math.floor(timestamp / 3600);
  return cachedEthereumPrice(`point:${currency}:${bucket}`, ETH_PRICE_POINT_CACHE_MS, async () => {
    if (currency === 'USD') {
      try {
        return await ethereumUsdHistoricalPrice(timestamp);
      } catch {
        // Use the broader market source below if the exchange endpoint is unavailable.
      }
    }
    const from = Math.max(0, timestamp - 36 * 60 * 60);
    const to = timestamp + 36 * 60 * 60;
    const url = `${ETH_PRICE_API_URL}/coins/ethereum/market_chart/range?vs_currency=${currency.toLowerCase()}&from=${from}&to=${to}`;
    const response = await ethereumPriceJson(url);
    const points = Array.isArray(response?.prices) ? response.prices : [];
    let closest;
    for (const point of points) {
      const pointTime = Math.floor(number(point?.[0]) / 1000);
      const value = number(point?.[1], -1);
      if (!Number.isFinite(pointTime) || value <= 0) continue;
      if (!closest || Math.abs(pointTime - timestamp) < Math.abs(closest.time - timestamp)) {
        closest = { time: pointTime, value };
      }
    }
    if (!closest) throw new Error('Ethereum price source returned no usable historical price');
    const price = emptyEthereumPrice(closest.time);
    price[currency] = closest.value;
    return price;
  });
}

async function ethereumPriceHistory(requestedCurrency) {
  const currency = normalizeEthereumFiatCurrency(requestedCurrency);
  return cachedEthereumPrice(`history:${currency}`, ETH_PRICE_HISTORY_CACHE_MS, async () => {
    if (currency === 'USD') {
      try {
        return await ethereumUsdPriceHistory();
      } catch {
        // Use the broader market source below if the exchange endpoint is unavailable.
      }
    }
    const now = Math.floor(Date.now() / 1000);
    const from = Math.max(0, now - ETH_PRICE_HISTORY_DAYS * 24 * 60 * 60);
    const url = `${ETH_PRICE_API_URL}/coins/ethereum/market_chart/range?vs_currency=${currency.toLowerCase()}&from=${from}&to=${now}`;
    const response = await ethereumPriceJson(url);
    const points = Array.isArray(response?.prices) ? response.prices : [];
    return points
      .map((point) => {
        const price = emptyEthereumPrice(Math.floor(number(point?.[0]) / 1000));
        price[currency] = number(point?.[1], -1);
        return price;
      })
      .filter((price) => Number.isFinite(price.time) && price[currency] > 0)
      .sort((left, right) => right.time - left.time);
  });
}

async function ethereumHistoricalPriceResponse(searchParams) {
  const currency = normalizeEthereumFiatCurrency(searchParams.get('currency'));
  const timestamp = number(searchParams.get('timestamp'), 0);
  try {
    const prices = timestamp > 0
      ? [await ethereumHistoricalPrice(timestamp, currency)]
      : await ethereumPriceHistory(currency);
    const latest = prices[0];
    return {
      prices,
      exchangeRates: exchangeRatesFromEthereumPrice(latest),
    };
  } catch {
    // Returning no point makes the shared amount component use its live price
    // instead of rendering a misleading zero during a price-source outage.
    return { prices: [], exchangeRates: emptyEthereumExchangeRates() };
  }
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

function nullableDecimalString(value) {
  return value === undefined || value === null ? null : decimalString(value);
}

function multiplyDecimalStrings(left, right) {
  if (left === null || right === null) return null;
  try {
    return (BigInt(left) * BigInt(right)).toString();
  } catch {
    return null;
  }
}

function sumDecimalStrings(...values) {
  let total = 0n;
  let hasValue = false;
  for (const value of values) {
    if (value === null || value === undefined) continue;
    try {
      total += BigInt(value);
      hasValue = true;
    } catch {
      // Ignore malformed optional provider fields rather than corrupting the
      // execution fee we do know.
    }
  }
  return hasValue ? total.toString() : null;
}

function transactionFeeParts(tx) {
  const pending = tx?.block_number === undefined || tx?.block_number === null;
  const feeType = nullableString(tx?.fee?.type) || (pending ? 'maximum' : 'actual');
  const executionFeeWei = nullableDecimalString(tx?.fee?.value);
  const blobGasUsed = nullableDecimalString(tx?.blob_gas_used);
  const blobGasPriceWei = nullableDecimalString(tx?.blob_gas_price);
  const maxFeePerBlobGasWei = nullableDecimalString(tx?.max_fee_per_blob_gas);
  const blobFeeWei = multiplyDecimalStrings(blobGasUsed, blobGasPriceWei);
  const versionedHashes = tx?.blob_versioned_hashes || tx?.blobVersionedHashes;
  const blobGasLimit = blobGasUsed || (Array.isArray(versionedHashes) && versionedHashes.length
    ? (BigInt(versionedHashes.length) * BLOB_GAS_PER_BLOB).toString()
    : null);
  const maximumBlobFeeWei = feeType === 'maximum'
    ? multiplyDecimalStrings(blobGasLimit, maxFeePerBlobGasWei)
    : null;
  return {
    feeType,
    executionFeeWei,
    blobGasUsed,
    blobGasPriceWei,
    maxFeePerBlobGasWei,
    blobFeeWei,
    maximumBlobFeeWei,
    totalFeeWei: sumDecimalStrings(executionFeeWei, feeType === 'actual' ? blobFeeWei : maximumBlobFeeWei),
  };
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

function mapRevertReason(reason) {
  if (typeof reason === 'string') return nullableString(reason);
  if (!reason || typeof reason !== 'object') return null;
  for (const field of ['message', 'reason', 'error', 'method_call']) {
    if (typeof reason[field] === 'string' && reason[field].trim()) return reason[field].trim();
  }
  return null;
}

function mapEthereumTransactionMetadata(tx, blockHash) {
  const fee = transactionFeeParts(tx);
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
    feeWei: fee.feeType === 'actual' ? fee.totalFeeWei : null,
    maximumFeeWei: fee.feeType === 'maximum' ? fee.totalFeeWei : null,
    executionFeeWei: fee.executionFeeWei,
    blobFeeWei: fee.blobFeeWei,
    maximumBlobFeeWei: fee.maximumBlobFeeWei,
    blobGasUsed: fee.blobGasUsed,
    blobGasPriceWei: fee.blobGasPriceWei,
    maxFeePerBlobGasWei: fee.maxFeePerBlobGasWei,
    gasLimit: decimalString(tx.gas_limit),
    gasUsed: nullableDecimalString(tx.gas_used),
    gasPriceWei: nullableDecimalString(tx.gas_price),
    maxFeePerGasWei: nullableDecimalString(tx.max_fee_per_gas),
    maxPriorityFeePerGasWei: nullableDecimalString(tx.max_priority_fee_per_gas),
    baseFeePerGasWei: nullableDecimalString(tx.base_fee_per_gas),
    burntFeeWei: nullableDecimalString(tx.transaction_burnt_fee),
    priorityFeeWei: nullableDecimalString(tx.priority_fee),
    nonce: decimalString(tx.nonce),
    type: nullableString(tx.type),
    method: nullableString(tx.method),
    input: nullableString(tx.raw_input) || '0x',
    decodedInput: mapDecodedInput(tx.decoded_input),
    tokenTransfers: (Array.isArray(tx.token_transfers) ? tx.token_transfers : []).map(mapEthereumTokenTransfer),
    tokenTransfersOverflow: Boolean(tx.token_transfers_overflow),
    revertReason: mapRevertReason(tx.revert_reason),
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

function decodeRpcAbiString(value) {
  if (typeof value !== 'string' || !/^0x[\da-f]*$/i.test(value) || value.length <= 2) return null;
  const payload = value.slice(2);
  const word = (offset) => payload.slice(offset * 2, (offset + 32) * 2);
  const dynamicOffset = Number(hexBigInt(`0x${word(0)}`));
  if (Number.isSafeInteger(dynamicOffset) && dynamicOffset >= 0 && word(dynamicOffset).length === 64) {
    const length = Number(hexBigInt(`0x${word(dynamicOffset)}`));
    const content = payload.slice((dynamicOffset + 32) * 2, (dynamicOffset + 32 + length) * 2);
    if (content.length === length * 2) {
      const decoded = Buffer.from(content, 'hex').toString('utf8').replace(/\0/g, '').trim();
      if (decoded) return decoded;
    }
  }
  return Buffer.from(word(0), 'hex').toString('utf8').replace(/\0/g, '').trim() || null;
}

async function rpcTokenMetadata(address) {
  const call = (data) => rpcJson('eth_call', [{ to: address, data }, 'latest'], { requireResult: true });
  const [nameResult, symbolResult, decimalsResult, totalSupplyResult] = await Promise.all([
    call('0x06fdde03').catch(() => null),
    call('0x95d89b41').catch(() => null),
    call('0x313ce567').catch(() => null),
    call('0x18160ddd').catch(() => null),
  ]);
  return mapEthereumToken({
    address_hash: address,
    name: decodeRpcAbiString(nameResult),
    symbol: decodeRpcAbiString(symbolResult),
    type: 'ERC-20',
    decimals: decimalsResult ? hexDecimalString(decimalsResult) : null,
    total_supply: totalSupplyResult ? hexDecimalString(totalSupplyResult) : null,
  }, address);
}

function mapRpcTokenTransfer(log, token) {
  const isNft = log?.topics?.length >= 4;
  return {
    transactionHash: log?.transactionHash || '',
    logIndex: hexDecimalString(log?.logIndex),
    blockNumber: hexDecimalString(log?.blockNumber),
    timestamp: null,
    from: mapEthereumIdentity(rpcIdentity(rpcTopicAddress(log?.topics?.[1]))),
    to: mapEthereumIdentity(rpcIdentity(rpcTopicAddress(log?.topics?.[2]))),
    token,
    tokenId: isNft ? hexDecimalString(log.topics[3]) : null,
    value: isNft ? '1' : hexDecimalString(log?.data),
    type: isNft ? 'ERC-721' : 'ERC-20',
    method: null,
  };
}

async function rpcRecentTokenTransfers(address, searchParams) {
  const [token, tipHex] = await Promise.all([
    rpcTokenMetadata(address),
    rpcJson('eth_blockNumber', [], { requireResult: true }),
  ]);
  const tip = hexNumber(tipHex);
  const from = Math.max(0, tip - RPC_TOKEN_TRANSFER_BLOCK_SPAN + 1);
  const logs = await rpcJson('eth_getLogs', [{
    address,
    fromBlock: `0x${from.toString(16)}`,
    toBlock: 'latest',
    topics: [ERC20_TRANSFER_TOPIC],
  }], { requireResult: true });
  const requestedCount = number(searchParams.get('items_count'), RPC_TOKEN_TRANSFER_LIMIT);
  const limit = Math.min(Math.max(requestedCount, 1), RPC_TOKEN_TRANSFER_LIMIT);
  return {
    items: (Array.isArray(logs) ? logs : []).slice(-limit).reverse().map((log) => mapRpcTokenTransfer(log, token)),
    nextPageParams: null,
    historyUnavailable: true,
    recentOnly: true,
  };
}

function mapRpcTransaction(tx, receipt, block, tipHeight = 0, pending = false) {
  const rawInput = tx.input || tx.data || '0x';
  const value = hexBigInt(tx.value);
  const gasLimit = hexBigInt(tx.gas);
  const confirmed = !pending && Boolean(tx.blockNumber);
  const gasUsed = receipt ? hexBigInt(receipt.gasUsed) : null;
  const gasPrice = receipt?.effectiveGasPrice || (!confirmed ? tx.maxFeePerGas || tx.gasPrice : tx.gasPrice || tx.maxFeePerGas) || '0x0';
  const effectiveGasPrice = hexBigInt(gasPrice);
  const maximumGasPrice = hexBigInt(tx.maxFeePerGas || tx.gasPrice || '0x0');
  const baseFee = hexBigInt(block?.baseFeePerGas);
  const blobGasUsed = receipt?.blobGasUsed === undefined || receipt?.blobGasUsed === null ? null : hexBigInt(receipt.blobGasUsed);
  const blobGasPrice = receipt?.blobGasPrice === undefined || receipt?.blobGasPrice === null ? null : hexBigInt(receipt.blobGasPrice);
  const maxFeePerBlobGas = tx.maxFeePerBlobGas === undefined || tx.maxFeePerBlobGas === null ? null : hexBigInt(tx.maxFeePerBlobGas);
  const blobFee = blobGasUsed === null || blobGasPrice === null ? null : blobGasUsed * blobGasPrice;
  const blobGasLimit = Array.isArray(tx.blobVersionedHashes) ? BigInt(tx.blobVersionedHashes.length) * BLOB_GAS_PER_BLOB : 0n;
  const maximumBlobFee = maxFeePerBlobGas === null ? 0n : blobGasLimit * maxFeePerBlobGas;
  const executionFee = gasUsed === null ? null : gasUsed * effectiveGasPrice;
  const fee = executionFee === null ? null : executionFee + (blobFee || 0n);
  const maximumFee = gasLimit * maximumGasPrice + maximumBlobFee;
  const burntFee = gasUsed === null ? null : gasUsed * baseFee;
  const priorityFee = executionFee === null ? null : executionFee > (burntFee || 0n) ? executionFee - (burntFee || 0n) : 0n;
  const tokenTransfers = rpcTokenTransfers(receipt, rpcTimestamp(block));
  const transactionTypes = [];
  if (value > 0n && rawInput === '0x') transactionTypes.push('coin_transfer');
  if (rawInput !== '0x') transactionTypes.push('contract_call');
  if (tokenTransfers.length) transactionTypes.push('token_transfer');
  if (!transactionTypes.length && tx.to) transactionTypes.push('coin_transfer');

  const blockNumber = confirmed ? hexNumber(tx.blockNumber) : 0;
  return {
    hash: tx.hash,
    status: receipt ? (hexBigInt(receipt.status) === 1n ? 'ok' : 'error') : (confirmed ? 'unknown' : 'pending'),
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
    fee: fee === null ? { type: 'maximum', value: maximumFee.toString() } : { type: 'actual', value: fee.toString() },
    gas_limit: gasLimit.toString(),
    gas_used: gasUsed === null ? undefined : gasUsed.toString(),
    gas_price: effectiveGasPrice.toString(),
    max_fee_per_gas: tx.maxFeePerGas ? hexDecimalString(tx.maxFeePerGas) : undefined,
    max_priority_fee_per_gas: tx.maxPriorityFeePerGas ? hexDecimalString(tx.maxPriorityFeePerGas) : undefined,
    base_fee_per_gas: block?.baseFeePerGas ? baseFee.toString() : undefined,
    transaction_burnt_fee: burntFee === null ? undefined : burntFee.toString(),
    priority_fee: priorityFee === null ? undefined : priorityFee.toString(),
    blob_gas_used: blobGasUsed === null ? undefined : blobGasUsed.toString(),
    blob_gas_price: blobGasPrice === null ? undefined : blobGasPrice.toString(),
    max_fee_per_blob_gas: maxFeePerBlobGas === null ? undefined : maxFeePerBlobGas.toString(),
    blob_versioned_hashes: tx.blobVersionedHashes,
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
      return payload?.result;
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError || new Error(`No Ethereum RPC providers configured for ${method}`);
}

function explorerRateLimitCooldown(response) {
  const retryAfter = response.headers.get('retry-after');
  const seconds = Number(retryAfter);
  if (Number.isFinite(seconds) && seconds > 0) {
    return Math.min(EXPLORER_MAX_RATE_LIMIT_COOLDOWN_MS, Math.max(EXPLORER_RATE_LIMIT_COOLDOWN_MS, seconds * 1_000));
  }

  const retryAt = retryAfter ? Date.parse(retryAfter) : NaN;
  if (Number.isFinite(retryAt)) {
    return Math.min(EXPLORER_MAX_RATE_LIMIT_COOLDOWN_MS, Math.max(EXPLORER_RATE_LIMIT_COOLDOWN_MS, retryAt - Date.now()));
  }
  return EXPLORER_RATE_LIMIT_COOLDOWN_MS;
}

async function providerJson(requestPath, { bypassCooldown = false } = {}) {
  let lastError;
  for (const provider of providers) {
    const cooldownUntil = providerCooldowns.get(provider) || 0;
    if (!bypassCooldown && cooldownUntil > Date.now()) {
      lastError = new Error(`${provider} is rate limited until ${new Date(cooldownUntil).toISOString()}`);
      continue;
    }
    try {
      const response = await fetch(new URL(requestPath.replace(/^\//, ''), `${provider}/`), {
        headers: { accept: 'application/json', 'user-agent': 'eth-taxi/0.1' },
        signal: AbortSignal.timeout(12_000),
      });
      if (!response.ok) {
        if (response.status === 429) providerCooldowns.set(provider, Date.now() + explorerRateLimitCooldown(response));
        throw new Error(`${provider}${requestPath} returned ${response.status}`);
      }
      activeProvider = provider;
      providerCooldowns.delete(provider);
      return response.json();
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError || new Error('No Ethereum providers configured');
}

function setAddressCacheEntry(cache, key, entry) {
  cache.delete(key);
  cache.set(key, entry);
  while (cache.size > ADDRESS_CACHE_LIMIT) cache.delete(cache.keys().next().value);
}

function cachedAddressResponse(cache, address, ttl, load) {
  const key = address.toLowerCase();
  const cached = cache.get(key);
  if (cached?.value !== undefined && cached.expiresAt > Date.now()) return Promise.resolve(cached.value);
  if (cached?.request) return cached.request;

  const request = Promise.resolve()
    .then(load)
    .then((value) => {
      setAddressCacheEntry(cache, key, { value, expiresAt: Date.now() + ttl, request: null });
      return value;
    })
    .catch((error) => {
      // An indexer hiccup must not turn a previously indexed account into an
      // empty account page. Its next request will refresh this stale value.
      if (cached?.value !== undefined) {
        setAddressCacheEntry(cache, key, { ...cached, request: null });
        return cached.value;
      }
      cache.delete(key);
      throw error;
    });

  setAddressCacheEntry(cache, key, { ...cached, request });
  return request;
}

function blockscoutPagePath(pathname, pageParams) {
  if (!pageParams || typeof pageParams !== 'object') return pathname;
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(pageParams)) {
    if (value !== undefined && value !== null && value !== '') query.set(key, String(value));
  }
  return query.size ? `${pathname}?${query}` : pathname;
}

function addressHistoryCursorKey(address, txid) {
  return `${address.toLowerCase()}:${txid.toLowerCase()}`;
}

function rememberAddressHistoryCursor(address, txid, cursor) {
  if (!txid || !cursor || typeof cursor !== 'object') return;
  setAddressCacheEntry(addressHistoryCursorCache, addressHistoryCursorKey(address, txid), { value: cursor, expiresAt: Date.now() + 10 * 60_000 });
}

function addressHistoryCursorFromTransaction(transaction) {
  if (!transaction?.hash) return null;
  return {
    index: transaction.position,
    value: transaction.value,
    hash: transaction.hash,
    block_number: transaction.block_number,
    fee: transaction.fee?.value,
    items_count: 50,
  };
}

async function rpcTransactionById(id) {
  const transaction = await rpcJson('eth_getTransactionByHash', [id], { requireResult: true });
  const [receipt, block, tip] = await Promise.all([
    rpcJson('eth_getTransactionReceipt', [id]).catch(() => null),
    transaction.blockHash ? rpcJson('eth_getBlockByHash', [transaction.blockHash, false]).catch(() => null) : Promise.resolve(null),
    transaction.blockNumber ? rpcJson('eth_blockNumber').catch(() => null) : Promise.resolve(null),
  ]);
  const fallback = mapRpcTransaction(transaction, receipt, block, hexNumber(tip));
  return hydrateTransactionTokenMetadata(mapTransactionDetail(fallback, transaction.blockHash));
}

function mapBlock(block) {
  const baseFee = wei(block.base_fee_per_gas);
  const blobFees = multiplyDecimalStrings(nullableDecimalString(block.blob_gas_used), nullableDecimalString(block.blob_gas_price));
  const totalFees = wei(sumDecimalStrings(nullableDecimalString(block.transaction_fees), blobFees));
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

function mapRpcBlock(block, feeMetrics = null) {
  const baseFeeWei = hexBigInt(block?.baseFeePerGas);
  const gasUsedWei = hexBigInt(block?.gasUsed);
  const burntFeeWei = gasUsedWei * baseFeeWei;
  const totalFeesWei = feeMetrics?.totalFees ?? burntFeeWei;
  const validatorRewardWei = feeMetrics?.validatorReward ?? 0n;
  const baseFee = Number(baseFeeWei);
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
      reward: wei(validatorRewardWei.toString()),
      totalFees: wei(totalFeesWei.toString()),
      medianFee: baseFee,
      minFee: baseFee,
      maxFee: baseFee,
      feeRange: [baseFee, baseFee, baseFee, baseFee, baseFee, baseFee, baseFee],
      pool: { id: 0, name: block?.miner || 'Unknown validator', slug: 'ethereum-validator' },
    },
  };
}

async function rpcBlockFeeMetrics(block) {
  const blockHash = block?.hash;
  if (!blockHash) return { totalFees: 0n, validatorReward: 0n };
  const cached = rpcBlockFeeCache.get(blockHash);
  if (cached) return cached;

  const burntExecutionFee = hexBigInt(block.gasUsed) * hexBigInt(block.baseFeePerGas);
  let metrics = { totalFees: burntExecutionFee, validatorReward: 0n };
  try {
    const receipts = await rpcJson('eth_getBlockReceipts', [blockHash], { requireResult: true });
    const totalFees = receipts.reduce((sum, receipt) => {
      const executionFee = hexBigInt(receipt?.gasUsed) * hexBigInt(receipt?.effectiveGasPrice);
      const blobFee = hexBigInt(receipt?.blobGasUsed) * hexBigInt(receipt?.blobGasPrice);
      return sum + executionFee + blobFee;
    }, 0n);
    const burntFees = receipts.reduce((sum, receipt) => {
      const executionFee = hexBigInt(receipt?.gasUsed) * hexBigInt(block.baseFeePerGas);
      const blobFee = hexBigInt(receipt?.blobGasUsed) * hexBigInt(receipt?.blobGasPrice);
      return sum + executionFee + blobFee;
    }, 0n);
    metrics = {
      totalFees,
      validatorReward: totalFees > burntFees ? totalFees - burntFees : 0n,
    };
  } catch {
    // A few public RPC providers do not expose block receipts. The burned base
    // fee is still a truthful non-zero lower bound until a richer source wins.
  }

  rpcBlockFeeCache.set(blockHash, metrics);
  if (rpcBlockFeeCache.size > 48) rpcBlockFeeCache.delete(rpcBlockFeeCache.keys().next().value);
  return metrics;
}

function mapTransaction(tx) {
  const gas = number(tx.gas_used || tx.gas_limit);
  const rate = wei(tx.gas_price || tx.max_fee_per_gas);
  const fee = transactionFeeParts(tx);
  const types = new Set(tx.transaction_types || []);
  let flags = 0;
  if (types.has('coin_transfer')) flags += ETHEREUM_TRANSACTION_FLAGS.transfer;
  if (types.has('contract_call')) flags += ETHEREUM_TRANSACTION_FLAGS.contractCall;
  if (types.has('token_transfer') || (tx.token_transfers?.length ?? 0) > 0) flags += ETHEREUM_TRANSACTION_FLAGS.tokenTransfer;
  return {
    txid: tx.hash,
    fee: wei(fee.totalFeeWei),
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
  if (!signatures || transactionStreamRequests.has(socket)) return;
  transactionStreamRequests.add(socket);

  try {
    // Live inclusion and execution data come from RPC; indexers can lag the tip.
    const transaction = await rpcTransactionById(txid).catch(async () => {
      const indexed = await transactionById(txid);
      // A lagging fallback must not undo a receipt-confirmed inclusion.
      if (!indexed.status?.confirmed && signatures.get(txid)?.startsWith(`${txid}|confirmed|`)) {
        throw new Error('Indexer has not caught up with confirmed transaction');
      }
      return indexed;
    });
    if (!transactionSubscriptions.get(socket)?.has(txid)) return;
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
  } finally {
    transactionStreamRequests.delete(socket);
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
  const heights = Array.from({ length: BLOCK_PAGE_SIZE }, (_, index) => height - index).filter((value) => value >= 0);
  return Promise.all(heights.map(async (blockHeight) => {
    try {
      return mapBlock(await providerJson(`/api/v2/blocks/${blockHeight}`));
    } catch {
        return mapRpcBlock(await rpcJson('eth_getBlockByNumber', [`0x${blockHeight.toString(16)}`, false], { requireResult: true }));
    }
  }));
}

async function latestBlocks() {
  try {
    const response = await providerJson('/api/v2/blocks');
    const blocks = response.items.slice(0, BLOCK_PAGE_SIZE).map(mapBlock);
    if (blocks.length === BLOCK_PAGE_SIZE && blocks.every((block, index) => block.height === blocks[0].height - index)) return blocks;
  } catch { /* Load the complete page from individual blocks below. */ }
  return blocksEndingAt(hexNumber(await rpcJson('eth_blockNumber', [], { requireResult: true })));
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
    return mapRpcBlock(block, await rpcBlockFeeMetrics(block));
  }
}

async function transactionById(id) {
  try {
    const transaction = await providerJson(`/api/v2/transactions/${encodeURIComponent(id)}`, { bypassCooldown: true });
    let blockHash;
    if (transaction.block_number) {
      try { blockHash = (await providerJson(`/api/v2/blocks/${transaction.block_number}`, { bypassCooldown: true })).hash; } catch { /* Detail remains useful without a block hash. */ }
    }
    return hydrateTransactionTokenMetadata(mapTransactionDetail(transaction, blockHash));
  } catch (explorerError) {
    try {
      return await rpcTransactionById(id);
    } catch (rpcError) {
      throw new Error(`Indexer unavailable (${explorerError.message}); RPC fallback unavailable (${rpcError.message})`);
    }
  }
}

async function addressById(address) {
  const ethereum = await ethereumAddressMetadata(address);
  return ethereumAddressResponse(address, ethereum, number(ethereum.counters.transactions));
}

async function indexedAddressTransactions(address, afterTxid = '') {
  let cursor = null;
  if (afterTxid) {
    const cached = addressHistoryCursorCache.get(addressHistoryCursorKey(address, afterTxid));
    cursor = cached?.expiresAt > Date.now() ? cached.value : null;
    if (!cursor && cached) addressHistoryCursorCache.delete(addressHistoryCursorKey(address, afterTxid));
    if (!cursor) {
      const transaction = await providerJson(`/api/v2/transactions/${encodeURIComponent(afterTxid)}`, { bypassCooldown: true });
      cursor = addressHistoryCursorFromTransaction(transaction);
    }
    if (!cursor) return [];
  }

  const response = await providerJson(
    blockscoutPagePath(`/api/v2/addresses/${encodeURIComponent(address)}/transactions`, cursor),
    { bypassCooldown: true },
  );
  const items = response.items || [];
  const last = items.at(-1);
  if (last && response.next_page_params) {
    rememberAddressHistoryCursor(address, last.hash, response.next_page_params);
  }
  return items.map((transaction) => mapTransactionDetail(transaction, transaction.block_hash));
}

async function addressTransactions(address, afterTxid = '') {
  try {
    if (afterTxid) return await indexedAddressTransactions(address, afterTxid);
    return await cachedAddressResponse(addressHistoryCache, address, ADDRESS_HISTORY_CACHE_MS, async () => {
      return indexedAddressTransactions(address);
    });
  } catch {
    // Standard JSON-RPC exposes balances and contract code but not an address
    // history index. The frontend receives `historyUnavailable` from the
    // companion address response and can state that distinction plainly.
    return [];
  }
}

async function blockTransactions(blockId, start = 0) {
  try {
    const offset = Math.max(0, Math.min(Number(start) || 0, 10_000));
    const pageSize = 25;
    let pageParams = null;
    let consumed = 0;
    const transactions = [];

    while (transactions.length < pageSize) {
      const response = await providerJson(
        blockscoutPagePath(`/api/v2/blocks/${encodeURIComponent(blockId)}/transactions`, pageParams),
      );
      const items = response.items || [];
      if (!items.length) break;

      const pageStart = Math.max(0, offset - consumed);
      if (pageStart < items.length) {
        transactions.push(...items.slice(pageStart, pageStart + pageSize - transactions.length));
      }
      consumed += items.length;
      if (!response.next_page_params || consumed > offset + pageSize) break;
      pageParams = response.next_page_params;
    }

    return transactions.map((transaction) => mapTransactionDetail(transaction, transaction.block_hash || blockId));
  } catch {
    const isHash = /^0x[a-f\d]{64}$/i.test(blockId);
    const block = await rpcJson(
      isHash ? 'eth_getBlockByHash' : 'eth_getBlockByNumber',
      isHash ? [blockId, true] : [`0x${Number(blockId).toString(16)}`, true],
      { requireResult: true },
    );
    const tip = await rpcJson('eth_blockNumber').catch(() => null);
    const receipts = await rpcJson('eth_getBlockReceipts', [block.hash], { requireResult: true }).catch(() => []);
    const receiptsByHash = new Map((receipts || []).map((receipt) => [receipt.transactionHash?.toLowerCase(), receipt]));
    return (block.transactions || [])
      .slice(start, start + 25)
      .map((transaction) => mapTransactionDetail(
        mapRpcTransaction(transaction, receiptsByHash.get(transaction.hash?.toLowerCase()) || null, block, hexNumber(tip)),
        block.hash,
      ));
  }
}

async function ethereumAddressMetadata(address) {
  try {
    return await cachedAddressResponse(addressMetadataCache, address, ADDRESS_METADATA_CACHE_MS, async () => {
      const [details, counters, tokens] = await Promise.all([
        providerJson(`/api/v2/addresses/${encodeURIComponent(address)}`, { bypassCooldown: true }),
        providerJson(`/api/v2/addresses/${encodeURIComponent(address)}/counters`, { bypassCooldown: true }).catch(() => ({})),
        providerJson(`/api/v2/addresses/${encodeURIComponent(address)}/tokens`, { bypassCooldown: true }).catch(() => ({ items: [] })),
      ]);
      return mapEthereumAddressMetadata(details, counters, address, tokens.items || []);
    });
  } catch {
    return rpcAddressMetadata(address);
  }
}

async function ethereumToken(address) {
  try {
    const token = await providerJson(`/api/v2/tokens/${encodeURIComponent(address)}`);
    return mapEthereumToken(token, address);
  } catch {
    return rpcTokenMetadata(address);
  }
}

function tokenNeedsMetadata(token) {
  return !token?.name || !token?.symbol || token?.decimals === null || token?.decimals === undefined;
}

function mergeEthereumTokenMetadata(token, metadata) {
  if (!metadata) return token;
  return {
    ...token,
    name: token.name || metadata.name,
    symbol: token.symbol || metadata.symbol,
    type: token.type && token.type !== 'Token' ? token.type : metadata.type || token.type,
    decimals: token.decimals ?? metadata.decimals,
    iconUrl: token.iconUrl || metadata.iconUrl,
    totalSupply: token.totalSupply || metadata.totalSupply,
    circulatingSupply: token.circulatingSupply || metadata.circulatingSupply,
    holdersCount: token.holdersCount || metadata.holdersCount,
    exchangeRate: token.exchangeRate || metadata.exchangeRate,
    marketCap: token.marketCap || metadata.marketCap,
    volume24h: token.volume24h || metadata.volume24h,
    reputation: token.reputation || metadata.reputation,
    palette: metadata.palette?.length ? metadata.palette : token.palette,
  };
}

async function cachedEthereumTokenMetadata(address) {
  const normalizedAddress = String(address || '').toLowerCase();
  if (!/^0x[\da-f]{40}$/.test(normalizedAddress)) return null;

  const cached = tokenMetadataCache.get(normalizedAddress);
  if (cached?.expiresAt > Date.now()) return cached.value;

  const value = ethereumToken(normalizedAddress).catch(() => null);
  tokenMetadataCache.set(normalizedAddress, {
    expiresAt: Date.now() + TOKEN_METADATA_CACHE_MS,
    value,
  });

  const metadata = await value;
  if (!metadata) tokenMetadataCache.delete(normalizedAddress);
  return metadata;
}

function tokenTransferKey(transfer) {
  const logIndex = transfer?.logIndex;
  if (logIndex !== undefined && logIndex !== null && logIndex !== '') return `log:${logIndex}`;
  return [
    transfer?.token?.address?.toLowerCase() || '',
    transfer?.from?.address?.toLowerCase() || '',
    transfer?.to?.address?.toLowerCase() || '',
    transfer?.value || '',
    transfer?.tokenId || '',
  ].join(':');
}

async function hydrateOverflowedTokenTransfers(transaction) {
  if (!transaction?.ethereum?.tokenTransfersOverflow || !transaction.txid) return transaction;

  try {
    const receipt = await rpcJson('eth_getTransactionReceipt', [transaction.txid], { requireResult: true });
    const receiptTransfers = rpcTokenTransfers(receipt, transaction.ethereum.blockTimestamp)
      .map(mapEthereumTokenTransfer);
    if (!receiptTransfers.length) return transaction;

    const indexedTransfers = transaction.ethereum.tokenTransfers || [];
    const indexedByKey = new Map(indexedTransfers.map((transfer) => [tokenTransferKey(transfer), transfer]));
    const receiptKeys = new Set();
    const mergedTransfers = receiptTransfers.map((transfer) => {
      const key = tokenTransferKey(transfer);
      receiptKeys.add(key);
      return indexedByKey.get(key) || transfer;
    });

    // Keep indexer-specific transfer records too (for example ERC-1155 events),
    // while ensuring standard Transfer logs cannot disappear on an overflowed
    // indexer response.
    mergedTransfers.push(...indexedTransfers.filter((transfer) => !receiptKeys.has(tokenTransferKey(transfer))));
    transaction.ethereum.tokenTransfers = mergedTransfers;
  } catch {
    // The indexer result remains useful if a public RPC omits receipts.
  }
  return transaction;
}

async function hydrateTransactionTokenMetadata(transaction) {
  await hydrateOverflowedTokenTransfers(transaction);
  const transfers = transaction?.ethereum?.tokenTransfers || [];
  const addresses = new Set();
  for (const transfer of transfers) {
    const address = transfer?.token?.address;
    if (tokenNeedsMetadata(transfer?.token) && /^0x[\da-f]{40}$/i.test(address)) {
      addresses.add(address.toLowerCase());
    }
  }
  const unresolvedAddresses = Array.from(addresses).slice(0, TRANSACTION_TOKEN_METADATA_LIMIT);

  if (!unresolvedAddresses.length) return transaction;

  const metadata = await Promise.all(unresolvedAddresses.map(async (address) => [
    address,
    await cachedEthereumTokenMetadata(address),
  ]));
  const metadataByAddress = new Map(metadata);

  transaction.ethereum.tokenTransfers = transfers.map((transfer) => {
    const address = transfer?.token?.address?.toLowerCase();
    return address && metadataByAddress.has(address)
      ? { ...transfer, token: mergeEthereumTokenMetadata(transfer.token, metadataByAddress.get(address)) }
      : transfer;
  });
  return transaction;
}

async function ethereumTokenTransfers(address, searchParams) {
  try {
    const query = new URLSearchParams();
    for (const key of ['block_number', 'index', 'items_count']) {
      const value = searchParams.get(key);
      if (value && /^[0-9]+$/.test(value)) query.set(key, value);
    }
    const response = await providerJson(`/api/v2/tokens/${encodeURIComponent(address)}/transfers${query.size ? `?${query}` : ''}`);
    return {
      items: (response.items || []).map(mapEthereumTokenTransfer),
      nextPageParams: response.next_page_params || null,
      historyUnavailable: false,
      recentOnly: false,
    };
  } catch {
    return rpcRecentTokenTransfers(address, searchParams);
  }
}

async function blockscoutSnapshot() {
  const [blocks, transactions, pending, stats] = await Promise.all([
    providerJson('/api/v2/blocks'),
    providerJson('/api/v2/main-page/transactions'),
    providerJson('/api/v2/transactions?filter=pending'),
    providerJson('/api/v2/stats'),
  ]);
  const mappedBlocks = blocks.items.slice(0, 6).map(mapBlock).reverse();
  const pendingItems = pending.items || [];
  const pendingTransactions = pendingItems.map(mapTransaction);
  const gasPrices = stats.gas_prices || {};
  const slow = number(gasPrices.slow);
  const average = number(gasPrices.average);
  const fast = number(gasPrices.fast);
  const gasUsed = pendingItems.reduce((sum, item) => sum + number(item.gas_limit || item.gas_used), 0);
  const gasFees = pendingItems.reduce((sum, item) => sum + wei(transactionFeeParts(item).totalFeeWei), 0);
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
  const feeMetrics = await Promise.all(blocks.map((block) => rpcBlockFeeMetrics(block)));
  const mappedBlocks = blocks.map((block, index) => mapRpcBlock(block, feeMetrics[index])).reverse();
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
  const gasFees = pendingItems.reduce((sum, item) => sum + wei(transactionFeeParts(item).totalFeeWei), 0);
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

function respondText(res, status, value) {
  res.writeHead(status, { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store' });
  res.end(value);
}

function respondJavaScript(res, source) {
  res.writeHead(200, { 'content-type': 'application/javascript; charset=utf-8', 'cache-control': 'no-store' });
  res.end(source);
}

function ogEscape(value) {
  return String(value ?? '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;',
  })[character]);
}

function ogShort(value, limit = 38) {
  const text = String(value ?? '');
  return text.length > limit ? `${text.slice(0, Math.ceil((limit - 1) / 2))}…${text.slice(-Math.floor((limit - 1) / 2))}` : text;
}

function ogAtomic(value, decimals, unit, precision = 6) {
  if (value === null || value === undefined || !/^\d+$/.test(String(value))) return null;
  const atomic = BigInt(value);
  const divisor = 10n ** BigInt(decimals);
  const whole = atomic / divisor;
  const fraction = (atomic % divisor).toString().padStart(decimals, '0').slice(0, precision).replace(/0+$/, '');
  return `${whole.toLocaleString('en-US')}${fraction ? `.${fraction}` : ''} ${unit}`;
}

function ogCount(value) {
  const count = Number(value);
  return Number.isSafeInteger(count) && count >= 0 ? count.toLocaleString('en-US') : null;
}

function ogEntity(kind, id, data) {
  if (kind === 'tx') {
    const tx = data.ethereum;
    const state = tx.hasError ? 'Failed' : data.status?.confirmed ? 'Confirmed' : 'Pending';
    return {
      heading: 'Transaction', subtitle: id, description: `Ethereum transaction ${id}. ${state}.`,
      rows: [
        ['Status', state], ['Value', ogAtomic(tx.valueWei, 18, 'ETH')],
        ['From', tx.from?.address], ['To', tx.to?.address || tx.createdContract?.address],
        ['Block', tx.blockNumber ? ogCount(tx.blockNumber) : null],
        ['Gas used', tx.gasUsed ? ogCount(tx.gasUsed) : null],
        ['Fee', ogAtomic(tx.feeWei, 18, 'ETH')],
        ['Method', tx.method && tx.method !== '0x' ? tx.method : null],
      ],
    };
  }
  if (kind === 'block') return {
    heading: `Block ${ogCount(data.height) || id}`, subtitle: data.id || id,
    description: `Ethereum block ${ogCount(data.height) || id}.`,
    rows: [
      ['Transactions', ogCount(data.tx_count)], ['Gas used', ogCount(data.weight)],
      ['Timestamp', data.timestamp ? new Date(data.timestamp * 1000).toISOString().replace('T', ' ').slice(0, 19) + ' UTC' : null],
      ['Block producer', data.extras?.pool?.name],
      ['Parent', data.previousblockhash],
    ],
  };
  if (kind === 'address') return {
    heading: data.identity?.name || 'Address', subtitle: id,
    description: `Ethereum ${data.identity?.isContract ? 'contract' : 'address'} ${id}.`,
    rows: [
      ['Type', data.identity?.isContract ? 'Contract' : 'Account'],
      ['Balance', ogAtomic(data.balanceWei, 18, 'ETH')],
      ['ENS', data.identity?.ensName],
      ['Token balances', data.tokenBalances?.length ? `${data.tokenBalances.length} shown` : null],
    ],
  };
  return {
    heading: data.name || data.symbol || 'Token', subtitle: id,
    description: `Ethereum token ${data.name || data.symbol || id}.`,
    rows: [
      ['Symbol', data.symbol], ['Standard', data.type],
      ['Decimals', data.decimals !== null && data.decimals !== undefined ? ogCount(data.decimals) : null],
      ['Holders', data.holdersCount ? ogCount(data.holdersCount) : null],
      ['Contract', data.address || id],
    ],
  };
}

function ogEntityMetadata(kind, id, entity) {
  const pathname = `/${kind === 'tx' ? 'tx' : kind}/${encodeURIComponent(id)}`;
  const title = `${entity.heading} | eth.tx.taxi`;
  const url = `${OG_ORIGIN}${pathname}`;
  const image = `${OG_ORIGIN}/og/${kind}/${encodeURIComponent(id)}.png?v=${OG_CARD_VERSION}`;
  const tags = [
    ['name', 'description', entity.description],
    ['property', 'og:type', 'website'], ['property', 'og:site_name', 'eth.tx.taxi'],
    ['property', 'og:locale', 'en_US'],
    ['property', 'og:title', title], ['property', 'og:description', entity.description],
    ['property', 'og:url', url], ['property', 'og:image', image],
    ['property', 'og:image:type', 'image/png'], ['property', 'og:image:width', String(OG_IMAGE_WIDTH)],
    ['property', 'og:image:height', String(OG_IMAGE_HEIGHT)], ['property', 'og:image:alt', `eth.tx.taxi ${entity.heading}`],
    ['name', 'twitter:card', 'summary_large_image'], ['name', 'twitter:title', title],
    ['name', 'twitter:description', entity.description], ['name', 'twitter:image', image],
    ['name', 'twitter:image:alt', `eth.tx.taxi ${entity.heading}`], ['name', 'twitter:domain', 'eth.tx.taxi'],
  ];
  return {
    title, description: entity.description, url, image,
    html: `<title>${ogEscape(title)}</title><link rel="canonical" href="${ogEscape(url)}">` +
      tags.map(([attribute, name, content]) => `<meta ${attribute}="${name}" content="${ogEscape(content)}">`).join(''),
  };
}

function ogEntityIdIsValid(kind, id) {
  if (kind === 'block') return /^(?:0x[\da-f]{64}|[1-9]\d{0,9})$/i.test(id);
  if (kind === 'tx') return /^0x[\da-f]{64}$/i.test(id);
  return /^0x[\da-f]{40}$/i.test(id);
}

function ogEntityRoute(pathname) {
  const match = pathname.match(/^\/(tx|block|address|token)\/([^/]+)$/);
  if (!match) return null;
  const [, kind, id] = match;
  return ogEntityIdIsValid(kind, id) ? { kind, id } : null;
}

function ogRouteEntity(kind, id) {
  const label = { tx: 'Transaction', block: 'Block', address: 'Address', token: 'Token' }[kind];
  const heading = kind === 'block' && /^\d+$/.test(id) ? `Block ${id}` : `${label} ${ogShort(id, 20)}`;
  const description = {
    tx: `Ethereum transaction ${id}.`,
    block: `Ethereum block ${id}.`,
    address: `Ethereum address ${id}.`,
    token: `Ethereum token contract ${id}.`,
  }[kind];
  return { heading, subtitle: id, description, rows: [] };
}

function ogInjectDocument(html, metadata) {
  const document = parse5.parse(html, { sourceCodeLocationInfo: true });
  const root = document.childNodes.find((node) => node.tagName === 'html');
  const head = root?.childNodes.find((node) => node.tagName === 'head');
  if (!head?.sourceCodeLocation?.endTag) throw new Error('SPA index has no head element');
  const attribute = (node, name) => node.attrs?.find((item) => item.name === name)?.value?.toLowerCase();
  const locations = head.childNodes.filter((node) => {
    if (node.tagName === 'title') return true;
    if (node.tagName === 'link') return attribute(node, 'rel')?.split(/\s+/).includes('canonical');
    if (node.tagName !== 'meta') return false;
    return attribute(node, 'name') === 'description' || attribute(node, 'name')?.startsWith('twitter:') || attribute(node, 'property')?.startsWith('og:');
  }).map((node) => node.sourceCodeLocation).filter(Boolean).sort((a, b) => a.startOffset - b.startOffset);
  const insertAt = head.sourceCodeLocation.endTag.startOffset;
  let cursor = 0;
  let output = '';
  for (const location of locations) {
    output += html.slice(cursor, location.startOffset);
    cursor = location.endOffset;
  }
  return output + html.slice(cursor, insertAt) + `\n  ${metadata.html}\n` + html.slice(insertAt);
}

function ogBrandLogo() {
  if (ogBrandLogoDataUri !== undefined) return ogBrandLogoDataUri;
  try {
    const asset = fsSync.readFileSync(path.join(staticRoot, 'resources', 'branding', 'eth-dark-full.svg'));
    ogBrandLogoDataUri = `data:image/svg+xml;base64,${asset.toString('base64')}`;
  } catch {
    ogBrandLogoDataUri = null;
  }
  return ogBrandLogoDataUri;
}

function ogImageSvg(entity, metadata, unavailable = false) {
  const brandLogo = ogBrandLogo();
  const brandLogoMarkup = brandLogo
    ? `<image href="${brandLogo}" x="64" y="20" width="224" height="75" preserveAspectRatio="xMinYMid meet"/>`
    : '';
  const eyebrowX = brandLogo ? 314 : 64;
  const rows = (unavailable ? [] : entity.rows.filter(([, value]) => value !== null && value !== undefined && value !== '')).slice(0, 8);
  const rowMarkup = rows.map(([label, value], index) => {
    const column = index % 2;
    const x = 64 + column * 544;
    const y = 318 + Math.floor(index / 2) * 67;
    return `<rect x="${x}" y="${y - 28}" width="518" height="56" fill="${Math.floor(index / 2) % 2 ? '#202537' : '#181c2a'}"/>` +
      `<text x="${x + 14}" y="${y - 5}" fill="#9ca5c5" font-size="17">${ogEscape(label)}</text>` +
      `<text x="${x + 14}" y="${y + 19}" fill="#f2f4ff" font-size="20" font-weight="600">${ogEscape(ogShort(value, 32))}</text>`;
  }).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${OG_IMAGE_WIDTH}" height="${OG_IMAGE_HEIGHT}" viewBox="0 0 ${OG_IMAGE_WIDTH} ${OG_IMAGE_HEIGHT}">
    <rect width="1200" height="630" fill="#11141f"/><rect width="1200" height="8" fill="#627eea"/>
    ${brandLogoMarkup}
    <text x="${eyebrowX}" y="68" fill="#9eafff" font-family="DejaVu Sans, sans-serif" font-size="22" font-weight="700">ETHEREUM / EXPLORER</text>
    <text x="950" y="68" fill="#f2f4ff" font-family="DejaVu Sans, sans-serif" font-size="26" font-weight="700">eth.tx.taxi</text>
    <path d="M64 108H1136" stroke="#343a51"/>
    <text x="64" y="190" fill="#f2f4ff" font-family="DejaVu Sans, sans-serif" font-size="52" font-weight="700">${ogEscape(ogShort(entity.heading, 32))}</text>
    <text x="64" y="242" fill="#a8b9ff" font-family="DejaVu Sans Mono, monospace" font-size="24">${ogEscape(ogShort(entity.subtitle, 70))}</text>
    ${unavailable ? '<text x="64" y="344" fill="#cbd2eb" font-family="DejaVu Sans, sans-serif" font-size="28">Details temporarily unavailable</text>' : `<g font-family="DejaVu Sans, sans-serif">${rowMarkup}</g>`}
    <path d="M64 574H1136" stroke="#343a51"/>
    <text x="64" y="604" fill="#919bb9" font-family="DejaVu Sans, sans-serif" font-size="17">Ethereum mainnet</text>
    <text x="1136" y="604" text-anchor="end" fill="#919bb9" font-family="DejaVu Sans, sans-serif" font-size="17">${ogEscape(metadata.url)}</text>
  </svg>`;
}

async function ogLoad(kind, id) {
  if (kind === 'tx') return transactionById(id);
  if (kind === 'block') return blockById(id);
  if (kind === 'address') return ethereumAddressMetadata(id);
  return ethereumToken(id);
}

function ogCachePut(key, result, ttl) {
  ogImageCache.delete(key);
  ogImageCache.set(key, { result, expiresAt: Date.now() + ttl });
  while (ogImageCache.size > OG_CACHE_LIMIT) ogImageCache.delete(ogImageCache.keys().next().value);
}

async function ogRender(kind, id) {
  const data = await ogLoad(kind, id);
  if (kind === 'token' && !data?.name && !data?.symbol) throw new Error('Token metadata unavailable');
  if (kind === 'tx' && !data?.ethereum) throw new Error('Transaction metadata unavailable');
  const entity = ogEntity(kind, id, data);
  const metadata = ogEntityMetadata(kind, id, entity);
  const body = await sharp(Buffer.from(ogImageSvg(entity, metadata))).png().toBuffer();
  return { body, ttl: kind === 'tx' && !data.status?.confirmed ? 30_000 : 300_000 };
}

function ogFallback(kind) {
  if (!ogFallbackCards.has(kind)) {
    const entity = { heading: { tx: 'Transaction', block: 'Block', address: 'Address', token: 'Token' }[kind],
      subtitle: 'Live details unavailable', rows: [] };
    ogFallbackCards.set(kind, sharp(Buffer.from(ogImageSvg(entity, { url: OG_ORIGIN }, true))).png().toBuffer()
      .then((body) => ({ body })));
  }
  return ogFallbackCards.get(kind);
}

async function serveOgImage(req, res, kind, id) {
  const key = `${kind}:${id.toLowerCase()}`;
  const cached = ogImageCache.get(key);
  if (cached && cached.expiresAt > Date.now()) {
    res.writeHead(200, { 'content-type': 'image/png', 'cache-control': `public, max-age=${Math.floor((cached.expiresAt - Date.now()) / 1000)}` });
    return res.end(req.method === 'HEAD' ? undefined : cached.result.body);
  }
  if (cached) ogImageCache.delete(key);
  let pending = ogImagePending.get(key);
  if (!pending) {
    if (ogActiveLoads >= OG_MAX_ACTIVE_LOADS) {
      const fallback = await ogFallback(kind);
      res.writeHead(200, { 'content-type': 'image/png', 'cache-control': 'no-store' });
      return res.end(req.method === 'HEAD' ? undefined : fallback.body);
    }
    ogActiveLoads++;
    pending = ogRender(kind, id).then((result) => { ogCachePut(key, result, result.ttl); return result; });
    ogImagePending.set(key, pending);
    pending.finally(() => { ogActiveLoads--; ogImagePending.delete(key); }).catch(() => {});
  }
  let timer;
  let result;
  try {
    result = await Promise.race([pending, new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error('OG data request timed out')), OG_REQUEST_TIMEOUT_MS);
    })]);
  } catch {
    result = await ogFallback(kind);
  } finally {
    clearTimeout(timer);
  }
  res.writeHead(200, { 'content-type': 'image/png', 'cache-control': result.ttl ? `public, max-age=${Math.floor(result.ttl / 1000)}` : 'no-store' });
  res.end(req.method === 'HEAD' ? undefined : result.body);
}

function ogImageRoute(pathname) {
  const match = pathname.match(/^\/og\/(tx|block|address|token)\/([^/]+)\.png$/);
  if (!match) return null;
  const [, kind, id] = match;
  return ogEntityIdIsValid(kind, id) ? { kind, id } : null;
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
    /^\/api\/block-height\/\d+$/,
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
  const entityRoute = ogEntityRoute(pathname);
  const entityMetadata = entityRoute
    ? ogEntityMetadata(entityRoute.kind, entityRoute.id, ogRouteEntity(entityRoute.kind, entityRoute.id))
    : null;
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
      res.end(entityMetadata ? ogInjectDocument(body.toString(), entityMetadata) : body);
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
    if (requestPath.startsWith('/og/')) {
      const image = ogImageRoute(requestPath);
      if (!image || !['GET', 'HEAD'].includes(req.method)) return respond(res, 404, { error: 'Not found' });
      return await serveOgImage(req, res, image.kind, image.id);
    }
    if (requestPath === '/healthz') return respond(res, 200, { ok: true, provider: activeProvider });
    if (requestPath.startsWith('/source/')) return respond(res, 404, { error: 'Not found' });
    if (isApiPath(requestPath) && !isSupportedApiPath(requestPath)) {
      return respond(res, 404, { error: 'Unsupported Ethereum explorer endpoint', path: requestPath });
    }
    if (requestPath === '/resources/config.js' || requestPath === '/resources/customize.js') {
      if (await serveStatic(requestPath, res, false)) return;
      return respondJavaScript(res, requestPath.endsWith('/config.js') ? 'window.__env = window.__env || {};\n' : '');
    }
    if (await serveStatic(requestPath, res)) return;
    if (ogEntityRoute(requestPath)) return respond(res, 503, { error: 'SPA index unavailable' });
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
    if (addressTransactionsMatch) return respond(res, 200, await addressTransactions(addressTransactionsMatch[1], requestUrl.searchParams.get('after_txid') || ''));
    const addressMatch = requestPath.match(/^\/api\/address\/(0x[a-fA-F0-9]{40})$/);
    if (addressMatch) return respond(res, 200, await addressById(addressMatch[1]));
    const statusMatch = requestPath.match(/^\/api\/tx\/(0x[a-fA-F0-9]+)\/status$/);
    if (statusMatch) return respond(res, 200, (await transactionById(statusMatch[1])).status);
    const blocksMatch = requestPath.match(/^\/api\/v1\/blocks\/(\d+)$/);
    if (blocksMatch) return respond(res, 200, await blocksEndingAt(Number(blocksMatch[1])));
    const blockHeightMatch = requestPath.match(/^\/api\/block-height\/(\d+)$/);
    if (blockHeightMatch) {
      const block = await blockById(blockHeightMatch[1]);
      return respondText(res, 200, block.id);
    }
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
      return respond(res, 200, await ethereumHistoricalPriceResponse(requestUrl.searchParams));
    }
    if (requestPath === '/api/v1/blocks') return respond(res, 200, await latestBlocks());
    const data = await snapshot();
    if (requestPath === '/api/v1/init-data') return respond(res, 200, data);
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
        const txid = request['track-tx'];
        if (!/^0x[a-fA-F0-9]{64}$/.test(txid)) return;
        trackedTransactions.clear();
        transactionStreamSignatures.get(socket)?.clear();
        trackedTransactions.add(txid);
        const data = await snapshot();
        const transaction = data.projectedTransactions.find((item) => item.txid === txid);
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
  if (!sockets.size || transactionPollInFlight) return;
  transactionPollInFlight = true;
  try {
    await Promise.allSettled([...sockets].flatMap((socket) =>
      [...(transactionSubscriptions.get(socket) || [])].map((txid) => streamTrackedTransaction(socket, txid))));
  } finally { transactionPollInFlight = false; }
}, POLL_INTERVAL_MS).unref();
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
