export interface EthereumDocCategory {
  type: 'category';
  title: string;
}

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

export const ethereumGuideData: EthereumDocItem[] = [
  { type: 'category', title: 'Ethereum basics' },
  {
    type: 'entry',
    fragment: 'how-ethereum-transactions-work',
    title: 'How do Ethereum transactions work?',
    category: 'Basics',
    description: '<p>An Ethereum transaction is a signed instruction sent from an account. It can transfer ETH, call a smart contract, deploy a contract, or trigger token transfers.</p><p>Every transaction has a nonce, a gas limit, fee settings, and an input payload. Once a validator includes it in a block, the transaction receives confirmations as later blocks are added.</p>',
  },
  {
    type: 'entry',
    fragment: 'what-is-gas',
    title: 'What are gas and gwei?',
    category: 'Fees',
    description: '<p>Gas measures the computational work performed by a transaction. The gas fee is based on the gas used and the effective gas price.</p><p>Gas prices are commonly shown in gwei. One gwei is 0.000000001 ETH. This explorer shows ETH amounts for value and total fees, and gwei for gas prices.</p>',
  },
  {
    type: 'entry',
    fragment: 'base-and-priority-fees',
    title: 'What are base fees and priority fees?',
    category: 'Fees',
    description: '<p>Each block has a base fee that is burned. A transaction can also include a priority fee for the validator. Type 2 transactions specify a maximum fee and a maximum priority fee; the effective price paid depends on the block base fee and those limits.</p>',
  },
  {
    type: 'entry',
    fragment: 'pending-transactions',
    title: 'Why is a transaction pending?',
    category: 'Transactions',
    description: '<p>A transaction can remain pending when its fee settings are too low for current demand, an earlier transaction from the same account is still pending, or the data source has not observed it yet.</p><p>Ethereum transactions are ordered by account nonce. A later nonce cannot confirm before a missing earlier nonce. Check the transaction in the wallet or service that submitted it before replacing or cancelling it.</p>',
  },
  {
    type: 'entry',
    fragment: 'transaction-status',
    title: 'What do success, failure, and confirmations mean?',
    category: 'Transactions',
    description: '<p>A successful transaction completed execution. A failed transaction was included in a block but reverted during execution; it can still consume gas. Confirmations count the blocks added after inclusion and increase over time.</p>',
  },
  { type: 'category', title: 'Using the explorer' },
  {
    type: 'entry',
    fragment: 'searching',
    title: 'What can I search for?',
    category: 'Explorer',
    description: '<p>Search by transaction hash, 40-character Ethereum address, block number, or block hash. Token contract addresses open a token view when metadata is available.</p>',
  },
  {
    type: 'entry',
    fragment: 'pending-visualization',
    title: 'How is the pending transaction view estimated?',
    category: 'Explorer',
    description: '<p>The pending view is a live sample from the connected Ethereum provider. It groups observed transactions by activity type and estimates the next validator slot from that sample.</p><p>Ethereum has no single global pending pool, so another provider may observe a different set or ordering. The view is an estimate, not a guarantee of inclusion.</p>',
  },
  {
    type: 'entry',
    fragment: 'data-availability',
    title: 'Why can account or token history be incomplete?',
    category: 'Explorer',
    description: '<p>Block and transaction data can be read from Ethereum RPC. Complete account and token histories require an indexed data source. When the indexer is unavailable, the explorer keeps RPC-backed balances, contract metadata, and recent data visible, and labels history that is limited.</p>',
  },
  {
    type: 'entry',
    fragment: 'support-disclaimer',
    title: 'Can this explorer recover funds or reverse a transaction?',
    category: 'Support',
    description: '<p>No. This explorer displays public Ethereum network data and cannot reverse transactions, recover funds, or access a wallet. Contact the wallet, exchange, or application that submitted the transaction for account-specific support.</p>',
  },
];

export const ethereumRestData: EthereumDocItem[] = [
  { type: 'category', title: 'Network' },
  {
    type: 'entry', fragment: 'get-init-data', title: 'Explorer snapshot', category: 'Network', method: 'GET', path: '/api/v1/init-data',
    description: '<p>Returns the current explorer snapshot, including recent blocks, sampled pending transactions, gas estimates, and pending-pool metrics.</p>',
  },
  {
    type: 'entry', fragment: 'get-network-info', title: 'Network status', category: 'Network', method: 'GET', path: '/api/v1/info',
    description: '<p>Returns the current chain height, synchronization state, network name, and target block interval used by the explorer.</p>',
  },
  {
    type: 'entry', fragment: 'get-gas-estimates', title: 'Recommended gas prices', category: 'Fees', method: 'GET', path: '/api/v1/fees/recommended',
    description: '<p>Returns current slow, average, and fast gas-price estimates as integer wei values. Divide by 1,000,000,000 to convert a value to gwei.</p>',
  },
  { type: 'category', title: 'Blocks' },
  {
    type: 'entry', fragment: 'get-recent-blocks', title: 'Recent blocks', category: 'Blocks', method: 'GET', path: '/api/v1/blocks',
    description: '<p>Returns the most recent Ethereum blocks normalized for the explorer interface.</p>',
  },
  {
    type: 'entry', fragment: 'get-blocks-at-height', title: 'Blocks ending at height', category: 'Blocks', method: 'GET', path: '/api/v1/blocks/:height',
    description: '<p>Returns the available recent block window ending at the requested decimal block height.</p>',
  },
  {
    type: 'entry', fragment: 'get-block', title: 'Block by hash', category: 'Blocks', method: 'GET', path: '/api/v1/block/:hash',
    description: '<p>Returns normalized details for an Ethereum block hash.</p>',
  },
  {
    type: 'entry', fragment: 'get-block-transactions', title: 'Block transactions', category: 'Blocks', method: 'GET', path: '/api/block/:hash/txs/:start',
    description: '<p>Returns transactions in a block, starting at the zero-based offset supplied by <code>:start</code>.</p>',
  },
  { type: 'category', title: 'Transactions' },
  {
    type: 'entry', fragment: 'get-transaction', title: 'Transaction by hash', category: 'Transactions', method: 'GET', path: '/api/tx/:hash',
    description: '<p>Returns normalized transaction details plus Ethereum execution metadata, token transfers when available, and confirmation status.</p>',
  },
  {
    type: 'entry', fragment: 'get-transaction-status', title: 'Transaction status', category: 'Transactions', method: 'GET', path: '/api/tx/:hash/status',
    description: '<p>Returns whether a transaction is confirmed and, when confirmed, its block height and block hash.</p>',
  },
  {
    type: 'entry', fragment: 'get-ethereum-transaction', title: 'Ethereum transaction metadata', category: 'Transactions', method: 'GET', path: '/api/v1/ethereum/transaction/:hash',
    description: '<p>Returns Ethereum-specific execution metadata for a transaction, including gas fields, method data, contract interaction details, and token transfers when available.</p>',
  },
  { type: 'category', title: 'Accounts and tokens' },
  {
    type: 'entry', fragment: 'get-address', title: 'Account summary', category: 'Accounts', method: 'GET', path: '/api/address/:address',
    description: '<p>Returns an Ethereum account balance and normalized account summary. Contract status and complete history depend on provider capabilities.</p>',
  },
  {
    type: 'entry', fragment: 'get-address-transactions', title: 'Account transactions', category: 'Accounts', method: 'GET', path: '/api/address/:address/txs',
    description: '<p>Returns indexed transactions for an Ethereum address. The response can be empty when only RPC fallback data is available.</p>',
  },
  {
    type: 'entry', fragment: 'get-address-metadata', title: 'Ethereum account metadata', category: 'Accounts', method: 'GET', path: '/api/v1/ethereum/address/:address',
    description: '<p>Returns account type, contract metadata, counters, token holdings, and a history-availability indicator.</p>',
  },
  {
    type: 'entry', fragment: 'get-token', title: 'Token metadata', category: 'Tokens', method: 'GET', path: '/api/v1/ethereum/token/:address',
    description: '<p>Returns token metadata for a contract address. Standard ERC-20 fields can fall back to direct contract calls when indexed metadata is unavailable.</p>',
  },
  {
    type: 'entry', fragment: 'get-token-transfers', title: 'Token transfers', category: 'Tokens', method: 'GET', path: '/api/v1/ethereum/token/:address/transfers',
    description: '<p>Returns indexed token transfers. During indexer fallback, the response is explicitly marked as recent-only and may contain only transfers from the latest blocks.</p>',
  },
];

export const ethereumWebsocketData: EthereumDocItem[] = [
  { type: 'category', title: 'Connection' },
  {
    type: 'entry', fragment: 'websocket-connect', title: 'Connect and receive live snapshots', category: 'Connection',
    description: '<p>Connect to <code>/api/v1/ws</code>. The server immediately sends an explorer snapshot and sends updated snapshots when the chain tip or sampled pending data changes.</p>',
    request: `const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
const socket = new WebSocket(\`${'${protocol}'}//${'${location.host}'}/api/v1/ws\`);

socket.addEventListener('message', (event) => {
  console.log(JSON.parse(event.data));
});`,
  },
  {
    type: 'entry', fragment: 'websocket-init', title: 'Request a fresh snapshot', category: 'Actions',
    description: '<p>Sends the current blocks, pending sample, gas estimates, and explorer state immediately.</p>',
    request: '{ "action": "init" }',
  },
  {
    type: 'entry', fragment: 'websocket-ping', title: 'Keepalive ping', category: 'Actions',
    description: '<p>Checks that the connection is responsive.</p>',
    request: '{ "action": "ping" }', response: '{ "pong": true }',
  },
  {
    type: 'entry', fragment: 'websocket-track-transaction', title: 'Track a transaction', category: 'Subscriptions',
    description: '<p>Subscribes to changes for one transaction hash. Updates use the <code>tx</code> event shape. Send <code>stop</code> to clear transaction tracking.</p>',
    request: '{ "track-tx": "0xTRANSACTION_HASH" }\n\n{ "track-tx": "stop" }',
  },
  {
    type: 'entry', fragment: 'websocket-track-address', title: 'Track an account', category: 'Subscriptions',
    description: '<p>Subscribes to newly observed or confirmed transactions for one Ethereum address. A new address replaces the previous account subscription.</p>',
    request: '{ "track-address": "0x40_CHARACTER_ADDRESS" }\n\n{ "track-address": "stop" }',
  },
  {
    type: 'entry', fragment: 'websocket-track-pending', title: 'Track the pending sample', category: 'Subscriptions',
    description: '<p>Index <code>0</code> subscribes to the current next-slot estimate. Ethereum does not provide deterministic multi-block package projections. Send <code>-1</code> to stop.</p>',
    request: '{ "track-mempool-block": 0 }\n\n{ "track-mempool-block": -1 }',
  },
];
