export interface EthereumDocCategory { type: 'category'; title: string; }

export interface EthereumDocEntry {
  type: 'entry';
  fragment: string;
  title: string;
  category: string;
  description: string;
  method?: 'GET';
  path?: string;
  request?: string;
  response?: string;
}

export type EthereumDocItem = EthereumDocCategory | EthereumDocEntry;

const protocolLinks = '<p class="mt-3">Protocol background: <a href="https://ethereum.org/developers/docs/transactions/" target="_blank" rel="noopener">transactions</a>, <a href="https://ethereum.org/developers/docs/gas/" target="_blank" rel="noopener">gas and fees</a>, and <a href="https://ethereum.org/developers/docs/accounts/" target="_blank" rel="noopener">accounts</a>.</p>';

export const ethereumGuideData: EthereumDocItem[] = [
  { type: 'category', title: 'Ethereum basics' },
  {
    type: 'entry', fragment: 'how-ethereum-transactions-work', title: 'How do Ethereum transactions work?', category: 'Basics',
    description: `<p>An Ethereum transaction is a signed instruction from an externally owned account. It can transfer ETH, call a smart contract, create a contract, or carry data with no ETH value. The sender nonce orders that account’s transactions, so a later nonce cannot be included while an earlier nonce remains unresolved.</p><p>The explorer separates transferred ETH from the fee. A contract call can move tokens or change state even when its ETH value is zero.</p>${protocolLinks}`,
  },
  {
    type: 'entry', fragment: 'accounts-and-contracts', title: 'What is the difference between an account and a contract?', category: 'Basics',
    description: '<p>Addresses identify externally owned accounts and contract accounts. A private key controls an externally owned account and starts transactions; a contract contains code and runs when called. Contract status, names, labels, and verification details are provider metadata and can be unavailable.</p><p>An explorer cannot establish address ownership.</p>',
  },
  {
    type: 'entry', fragment: 'blocks-confirmations-finality', title: 'What do blocks, confirmations, and finality mean?', category: 'Basics',
    description: '<p>Ethereum mainnet uses proof of stake. A transaction is confirmed after inclusion in an execution block. Its confirmations are observed execution-layer block depth as later blocks build on that block.</p><p>Confirmation depth is useful context, not a consensus-finality proof. This explorer does not expose beacon-chain finality checkpoints or a finalization API, so do not treat any chosen confirmation count as protocol finality.</p>',
  },
  { type: 'category', title: 'Gas and fees' },
  {
    type: 'entry', fragment: 'what-is-gas', title: 'What are gas, wei, and gwei?', category: 'Fees',
    description: '<p>Gas measures EVM computational work. Wei is the smallest ETH unit: 1 ETH is 10<sup>18</sup> wei. Gas prices are commonly shown in gwei: 1 gwei is 10<sup>9</sup> wei, or 0.000000001 ETH.</p><p><code>gasLimit</code> is the maximum gas authorized; <code>gasUsed</code> is the work an included transaction consumed. The execution fee is gas used times the effective gas price. Blob fee fields appear separately when present.</p>',
  },
  {
    type: 'entry', fragment: 'base-and-priority-fees', title: 'How do base fee, priority fee, and max fee work?', category: 'Fees',
    description: '<p>For EIP-1559 transactions, <code>maxFeePerGas</code> caps the price authorized and <code>maxPriorityFeePerGas</code> caps the tip. The effective price is governed by the block base fee plus the applicable priority fee, subject to those limits. The base-fee portion is burned; the priority fee is the validator incentive.</p><p>The maximum fee is a ceiling, not necessarily the amount paid. Legacy transactions expose a gas-price field instead.</p>',
  },
  {
    type: 'entry', fragment: 'fee-estimates', title: 'How should I use gas-price recommendations?', category: 'Fees',
    description: '<p>Slow, average, and fast values are provider-backed observations, returned in wei by the REST API. They are not a quote or inclusion promise. A wallet can choose settings based on urgency, nonce dependencies, and the latest base fee.</p><p>For an included transaction, use effective gas price and gas used to understand what it paid. For a pending transaction, only maximum fee exposure may be known.</p>',
  },
  { type: 'category', title: 'Transaction status' },
  {
    type: 'entry', fragment: 'execution-status-and-confirmations', title: 'Why can a confirmed transaction be failed?', category: 'Transactions',
    description: '<p>Inclusion and execution are separate facts. A transaction can be confirmed in a block and still revert or report an error because EVM execution failed; it can still consume gas. A successful result means recorded execution completed, not that a contract interaction had the business outcome a user expected.</p><p>Read <code>status.confirmed</code>, Ethereum <code>status</code>/<code>result</code>, the error flag, and any available revert reason together.</p>',
  },
  {
    type: 'entry', fragment: 'why-pending', title: 'Why is a transaction pending or missing?', category: 'Transactions',
    description: '<p>A pending transaction may be underpriced, blocked by a lower sender nonce, not yet visible to the provider, replaced with the same nonce, or dropped by the submitting wallet or node. The pending view alone cannot determine which occurred.</p><p>Ethereum has no single global mempool. Providers can observe different transactions and ordering. Check the wallet or service that submitted it before replacing or cancelling a transaction.</p>',
  },
  {
    type: 'entry', fragment: 'pending-sample', title: 'What does the pending activity view represent?', category: 'Transactions',
    description: '<p>The pending display is a bounded sample from the connected provider. It estimates the next validator slot from observed transactions and gas data. It is not a complete network mempool, an auction book, or a deterministic multi-block projection.</p><p>Absence from the sample does not mean a transaction is invalid; visibility does not guarantee next-block inclusion.</p>',
  },
  {
    type: 'entry', fragment: 'transaction-fields', title: 'Which transaction fields are Ethereum-specific?', category: 'Transactions',
    description: '<p>Ethereum metadata includes sender and recipient identities, nonce, type, input data, decoded method details when available, gas fields, fee breakdown, confirmation depth, execution result, created-contract information, and token-transfer records. Precision-sensitive amounts are decimal strings: use arbitrary-precision integers.</p><p>Input decoding, labels, transfer lists, and revert reasons depend on upstream data. Their absence does not prove a transaction had no contract interaction or logs.</p>',
  },
  { type: 'category', title: 'Accounts, contracts, and tokens' },
  {
    type: 'entry', fragment: 'address-page', title: 'What does an address page show?', category: 'Accounts',
    description: '<p>An account summary exposes current ETH balance, account or contract identity, selected token balances, and counters when indexed data is available. Ethereum-specific fields live under the <code>ethereum</code> property. Balances reflect the provider’s latest state and may not include a pending transaction effect.</p>',
  },
  {
    type: 'entry', fragment: 'history-availability', title: 'Why is account or token history incomplete?', category: 'Accounts',
    description: '<p>JSON-RPC can provide state such as balances and contract code, but complete address and token history needs an indexer. During fallback, the explorer serves RPC-backed account details and marks history with <code>historyUnavailable</code>.</p><p>A token-transfer fallback is marked <code>recentOnly</code>. It is a bounded scan of recent standard transfer logs and must not be used as complete historical accounting.</p>',
  },
  {
    type: 'entry', fragment: 'tokens-and-contracts', title: 'How are token and contract details derived?', category: 'Tokens',
    description: '<p>A token page is keyed by contract address. Indexed metadata can include name, symbol, decimals, supply, holders, and transfers. When it is unavailable, the adapter can call standard ERC-20 methods for basic fields. A returned name or symbol is untrusted metadata, not a legitimacy check.</p><p>This explorer does not provide general execution traces, internal-transaction history, allowance APIs, or portfolio/accounting APIs.</p>',
  },
  {
    type: 'entry', fragment: 'searching', title: 'What can I search for?', category: 'Explorer',
    description: '<p>Search supports transaction hashes, 0x-prefixed 40-hex-character addresses, decimal block numbers, and block hashes. A token contract address can open a token view when metadata is available. Exact hashes and addresses give the most reliable result.</p>',
  },
  {
    type: 'entry', fragment: 'support-disclaimer', title: 'Can this explorer recover funds or reverse a transaction?', category: 'Support',
    description: '<p>No. eth.tx.taxi displays public Ethereum data. It cannot access wallets, undo a transaction, retrieve a private key, or recover funds. Contact the wallet, exchange, bridge, or application that submitted the transaction for account-specific support.</p>',
  },
];

export const ethereumRestData: EthereumDocItem[] = [
  { type: 'category', title: 'Using the API' },
  {
    type: 'entry', fragment: 'rest-overview', title: 'Conventions and limits', category: 'Overview',
    description: '<p>Documented routes are public <code>GET</code> endpoints and return JSON unless noted. Hash and address parameters are 0x-prefixed hexadecimal values. Amounts and quantities that require precision are decimal strings; do not parse them with JavaScript <code>Number</code>.</p><p>This is a read API. It does not broadcast transactions, estimate gas for arbitrary call data, provide execution traces, serve raw transaction bytes, or promise complete account history while indexer fallback is active.</p>',
  },
  { type: 'category', title: 'Network and pending sample' },
  {
    type: 'entry', fragment: 'get-init-data', title: 'Explorer snapshot', category: 'Network', method: 'GET', path: '/api/v1/init-data',
    description: '<p>Returns recent blocks, a bounded pending sample, gas recommendations, pending-sample metrics, and current explorer state. It is the dashboard payload; compatibility field names use Ethereum gas semantics.</p>',
    response: '{ "blocks": [], "transactions": [], "projectedTransactions": [], "fees": { "fastestFee": 0 }, "mempoolInfo": { "size": 0 } }',
  },
  {
    type: 'entry', fragment: 'get-network-info', title: 'Network status', category: 'Network', method: 'GET', path: '/api/v1/info',
    description: '<p>Returns observed execution-layer height, synchronization state, network name, and target block interval in milliseconds. It does not report beacon-chain finality.</p>',
    response: '{ "height": 0, "target_height": 0, "synced": true, "nettype": "mainnet", "average_block_time": 12000 }',
  },
  {
    type: 'entry', fragment: 'get-gas-estimates', title: 'Recommended gas prices', category: 'Fees', method: 'GET', path: '/api/v1/fees/recommended',
    description: '<p>Returns fast, average, and slow compatibility estimates as integer wei values. Divide by 1,000,000,000 for gwei. Values are current observations, not guaranteed inclusion prices.</p>',
    response: '{ "fastestFee": 0, "halfHourFee": 0, "hourFee": 0, "economyFee": 0, "minimumFee": 0 }',
  },
  {
    type: 'entry', fragment: 'get-pending-summary', title: 'Pending sample summary', category: 'Network', method: 'GET', path: '/api/v1/mempool',
    description: '<p>Returns metrics for the observed pending sample, including count, sampled gas, and fee total. Despite the compatibility route name, this is not a complete Ethereum mempool or node txpool dump.</p>',
  },
  { type: 'category', title: 'Blocks' },
  { type: 'entry', fragment: 'get-recent-blocks', title: 'Recent blocks', category: 'Blocks', method: 'GET', path: '/api/v1/blocks', description: '<p>Returns the current recent-block window normalized for the explorer.</p>' },
  { type: 'entry', fragment: 'get-blocks-at-height', title: 'Blocks ending at a height', category: 'Blocks', method: 'GET', path: '/api/v1/blocks/:height', description: '<p>Returns the available recent-block window ending at decimal execution-block height <code>:height</code>.</p>' },
  { type: 'entry', fragment: 'get-block-height', title: 'Block hash at a height', category: 'Blocks', method: 'GET', path: '/api/block-height/:height', description: '<p>Returns the 0x-prefixed block hash as plain text for a decimal block height.</p>' },
  { type: 'entry', fragment: 'get-block', title: 'Block by hash', category: 'Blocks', method: 'GET', path: '/api/v1/block/:hash', description: '<p>Returns normalized details for an Ethereum block hash. It is execution-layer data; validator and consensus-finality details are outside this API.</p>' },
  { type: 'entry', fragment: 'get-block-transactions', title: 'Block transactions', category: 'Blocks', method: 'GET', path: '/api/block/:hash/txs/:start', description: '<p>Returns up to 25 normalized transactions from a block, at zero-based offset <code>:start</code>. It uses indexed data where available and RPC block transactions otherwise.</p>' },
  { type: 'category', title: 'Transactions' },
  { type: 'entry', fragment: 'get-transaction', title: 'Transaction by hash', category: 'Transactions', method: 'GET', path: '/api/tx/:hash', description: '<p>Returns the normalized explorer transaction with <code>status.confirmed</code> and an <code>ethereum</code> metadata object.</p>' },
  {
    type: 'entry', fragment: 'get-transaction-status', title: 'Transaction inclusion status', category: 'Transactions', method: 'GET', path: '/api/tx/:hash/status',
    description: '<p>Returns inclusion status and, when confirmed, execution block height, hash, and time where available. It does not say whether contract execution succeeded; use transaction metadata for that distinction.</p>',
    response: '{ "confirmed": true, "block_height": 0, "block_hash": "0x…", "block_time": 0 }',
  },
  {
    type: 'entry', fragment: 'get-ethereum-transaction', title: 'Ethereum transaction metadata', category: 'Transactions', method: 'GET', path: '/api/v1/ethereum/transaction/:hash',
    description: '<p>Returns execution status and result, confirmations, sender/recipient or created contract, wei value, gas and fee fields, nonce, input and decoded method when available, token transfers, and error or revert metadata when supplied. This is not a trace endpoint.</p>',
  },
  { type: 'category', title: 'Accounts and tokens' },
  { type: 'entry', fragment: 'get-address', title: 'Account summary', category: 'Accounts', method: 'GET', path: '/api/address/:address', description: '<p>Returns a normalized address summary. Ethereum balance, identity, counters, token balances, and history capability live under <code>ethereum</code>. Fallback can set <code>ethereum.historyUnavailable</code>.</p>' },
  { type: 'entry', fragment: 'get-address-transactions', title: 'Account transactions', category: 'Accounts', method: 'GET', path: '/api/address/:address/txs', description: '<p>Returns indexed transactions for an address. Add <code>?after_txid=0x…</code> to continue after a returned transaction. RPC fallback returns an empty list rather than claiming an empty on-chain history.</p>' },
  { type: 'entry', fragment: 'get-address-metadata', title: 'Ethereum account metadata', category: 'Accounts', method: 'GET', path: '/api/v1/ethereum/address/:address', description: '<p>Returns account or contract identity, current ETH balance in wei, available creation metadata, counters, selected token balances, and <code>historyUnavailable</code>.</p>' },
  { type: 'entry', fragment: 'get-token', title: 'Token metadata', category: 'Tokens', method: 'GET', path: '/api/v1/ethereum/token/:address', description: '<p>Returns metadata for a token contract. Indexer metadata is preferred; basic ERC-20 fields can fall back to direct contract calls. Treat absent fields as unavailable and names or symbols as untrusted.</p>' },
  { type: 'entry', fragment: 'get-token-transfers', title: 'Token transfers', category: 'Tokens', method: 'GET', path: '/api/v1/ethereum/token/:address/transfers', description: '<p>Returns transfers and pagination metadata. Indexed requests accept numeric <code>block_number</code>, <code>index</code>, and <code>items_count</code>. A fallback sets <code>historyUnavailable: true</code> and <code>recentOnly: true</code>: it is a bounded recent standard-transfer-log scan, not full history.</p>' },
];

export const ethereumWebsocketData: EthereumDocItem[] = [
  { type: 'category', title: 'Connection' },
  {
    type: 'entry', fragment: 'websocket-connect', title: 'Connect and receive live snapshots', category: 'Connection',
    description: '<p>Connect to <code>/api/v1/ws</code>. The server sends an initial explorer snapshot and later snapshots as the observed tip or pending sample changes, with a periodic heartbeat. Snapshot fields follow <code>/api/v1/init-data</code>.</p><p>This is the adapter’s provider-backed view, not a raw execution-client subscription or a global-mempool stream.</p>',
    request: `const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
const socket = new WebSocket(\`\${protocol}//\${location.host}/api/v1/ws\`);
socket.addEventListener('message', ({ data }) => console.log(JSON.parse(data)));`,
  },
  { type: 'category', title: 'Actions' },
  { type: 'entry', fragment: 'websocket-init', title: 'Request a fresh snapshot', category: 'Actions', description: '<p>Sends the current explorer snapshot immediately, useful after reconnecting.</p>', request: '{ "action": "init" }' },
  { type: 'entry', fragment: 'websocket-ping', title: 'Keepalive ping', category: 'Actions', description: '<p>Checks that the connection is responsive.</p>', request: '{ "action": "ping" }', response: '{ "pong": true }' },
  { type: 'category', title: 'Subscriptions' },
  {
    type: 'entry', fragment: 'websocket-track-transaction', title: 'Track one transaction', category: 'Subscriptions',
    description: '<p>Tracks one 0x-prefixed 32-byte hash. The server first sends a compatibility <code>txPosition</code> estimate and then <code>{ "tx": … }</code> when normalized state changes. A new hash replaces the prior subscription. Next-slot position is an observed-sample estimate, not an inclusion guarantee.</p>',
    request: '{ "track-tx": "0xTRANSACTION_HASH" }\n\n{ "track-tx": "stop" }',
  },
  {
    type: 'entry', fragment: 'websocket-track-address', title: 'Track one account', category: 'Subscriptions',
    description: '<p>Tracks one address using available indexed history. Newly observed pending transactions arrive as <code>address-transactions</code>; newly confirmed or changed transactions arrive as <code>block-transactions</code>. A new address replaces the previous subscription. No events are synthesized when history indexing is unavailable.</p>',
    request: '{ "track-address": "0x40_CHARACTER_ADDRESS" }\n\n{ "track-address": "stop" }',
  },
  {
    type: 'entry', fragment: 'websocket-track-pending', title: 'Track the next-slot pending estimate', category: 'Subscriptions',
    description: '<p>Index <code>0</code> returns the observed pending-sample estimate as <code>projected-block-transactions</code>. Ethereum has no deterministic multi-block package projection, so higher indexes have no projected transactions. Send <code>-1</code> to clear the subscription.</p>',
    request: '{ "track-mempool-block": 0 }\n\n{ "track-mempool-block": -1 }',
  },
  {
    type: 'entry', fragment: 'websocket-reconnect', title: 'Reconnect safely', category: 'Connection',
    description: '<p>Reconnect with backoff after a close, send <code>{ "action": "init" }</code>, then recreate subscriptions. Malformed or unsupported subscription messages are ignored; validate client payloads and do not infer acceptance from silence.</p>',
  },
];
