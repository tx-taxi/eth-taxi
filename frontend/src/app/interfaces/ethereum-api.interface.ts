export interface EthereumIdentity {
  address: string;
  name?: string | null;
  ensName?: string | null;
  iconUrl?: string | null;
  isContract: boolean;
  isVerified: boolean;
  isScam: boolean;
  reputation?: string | null;
  proxyType?: string | null;
  implementationAddress?: string | null;
  tags: string[];
}

export interface EthereumToken {
  address: string;
  name?: string | null;
  symbol?: string | null;
  type: string;
  decimals?: string | null;
  iconUrl?: string | null;
  totalSupply?: string | null;
  circulatingSupply?: string | null;
  holdersCount?: string | null;
  exchangeRate?: string | null;
  marketCap?: string | null;
  volume24h?: string | null;
  reputation?: string | null;
  palette?: string[];
  historyUnavailable?: boolean;
  recentOnly?: boolean;
}

export interface EthereumTokenTransfer {
  transactionHash: string;
  logIndex?: string | null;
  blockNumber?: string | null;
  timestamp?: string | null;
  from: EthereumIdentity;
  to?: EthereumIdentity | null;
  token: EthereumToken;
  tokenId?: string | null;
  value: string;
  type: string;
  method?: string | null;
}

export interface EthereumDecodedParameter {
  name: string;
  type: string;
  value: unknown;
}

export interface EthereumDecodedInput {
  methodCall?: string | null;
  methodId?: string | null;
  parameters: EthereumDecodedParameter[];
}

export interface EthereumTransactionMetadata {
  hash: string;
  status: string;
  result?: string | null;
  blockNumber?: string | null;
  blockHash?: string | null;
  blockTimestamp?: string | null;
  confirmations?: string | null;
  transactionIndex?: string | null;
  from: EthereumIdentity;
  to?: EthereumIdentity | null;
  createdContract?: EthereumIdentity | null;
  valueWei: string;
  feeWei?: string | null;
  maximumFeeWei?: string | null;
  executionFeeWei?: string | null;
  blobFeeWei?: string | null;
  maximumBlobFeeWei?: string | null;
  blobGasUsed?: string | null;
  blobGasPriceWei?: string | null;
  maxFeePerBlobGasWei?: string | null;
  gasLimit: string;
  gasUsed?: string | null;
  gasPriceWei?: string | null;
  maxFeePerGasWei?: string | null;
  maxPriorityFeePerGasWei?: string | null;
  baseFeePerGasWei?: string | null;
  burntFeeWei?: string | null;
  priorityFeeWei?: string | null;
  nonce: string;
  type?: string | null;
  method?: string | null;
  input: string;
  decodedInput?: EthereumDecodedInput | null;
  tokenTransfers: EthereumTokenTransfer[];
  tokenTransfersOverflow: boolean;
  revertReason?: string | null;
  hasError: boolean;
}

export interface EthereumAddressCounters {
  transactions?: string;
  tokenTransfers?: string;
  internalTransactions?: string;
  gasUsed?: string;
}

export interface EthereumTokenBalance {
  token: EthereumToken;
  value: string;
}

export interface EthereumAddressMetadata {
  identity: EthereumIdentity;
  token?: EthereumToken | null;
  balanceWei: string;
  exchangeRate?: string | null;
  creatorAddress?: string | null;
  creationTransactionHash?: string | null;
  counters: EthereumAddressCounters;
  tokenBalances: EthereumTokenBalance[];
  historyUnavailable?: boolean;
}

export type EthereumPaginationValue = string | number | boolean;
export type EthereumPaginationParams = Record<string, EthereumPaginationValue>;

export interface EthereumPaginatedTransferResponse {
  items: EthereumTokenTransfer[];
  nextPageParams?: EthereumPaginationParams | null;
  historyUnavailable?: boolean;
  recentOnly?: boolean;
}
