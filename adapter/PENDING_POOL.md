# Ethereum pending data

The dashboard uses PublicNode's free Ethereum RPC endpoint for a node-local view of executable pending transactions. At startup the adapter reads `txpool_content`, then follows full pending-transaction and new-block WebSocket subscriptions. It reconciles against `txpool_content` every five minutes and removes transactions seen in new blocks. Set `ETH_PENDING_POOL_RPC_URL` to another endpoint that supports these Geth methods if needed.

If the feed is unavailable, the adapter uses Blockscout's first pending-transactions page (or the RPC pending block when Blockscout itself fails). The API marks the source in `mempoolInfo.source`; Blockscout sets `pending_sample_truncated` when it has more pages. None of these sources represents a network-wide Ethereum mempool.

Projected tiles use transaction gas limits and observed fee caps. They are estimates; the fee amounts are ceilings, not final fees paid. The frontend combines tiles only after they exceed the available display slots.
The gas meter shows sampled gas limits against the combined capacity of those projected tiles.
