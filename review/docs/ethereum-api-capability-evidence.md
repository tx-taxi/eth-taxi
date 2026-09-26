# Ethereum documentation capability evidence

Checked 2026-09-26 against the deployed explorer and the adapter at this revision.

## Deployed read checks

One paced request to each endpoint returned the following.

| Route | Result | Observed response |
| --- | --- | --- |
| `GET https://eth.tx.taxi/healthz` | `200` | `{"ok":true,"provider":"https://eth.blockscout.com"}` |
| `GET https://eth.tx.taxi/api/v1/info` | `200` | `{"height":26063200,"target_height":0,"synced":true,"nettype":"mainnet","average_block_time":12000}` |

## Adapter route and capability evidence

`adapter/server.cjs` allowlists and serves these documented routes: dashboard snapshot, pending summary, gas recommendations, network status, recent/block-height/block/transaction endpoints, account endpoints, and native Ethereum account/token/transaction metadata. The route allowlist begins at line 2061; HTTP dispatch begins at line 2147.

The transaction metadata shape is defined in `frontend/src/app/interfaces/ethereum-api.interface.ts`; amounts and quantities are strings. The adapter's RPC fallback intentionally reports `historyUnavailable` for account history and `recentOnly` for bounded token-transfer log scans (adapter lines 599-627 and 1627-1640). No documented endpoint offers generic traces, internal-transaction history, raw transaction bytes, arbitrary gas estimation, or transaction broadcasting.

WebSocket `/api/v1/ws` sends an initial `snapshot()`, accepts `action: init` and `action: ping`, and accepts one `track-tx`, one `track-address`, and `track-mempool-block` subscription. Its implementation is at adapter lines 2221-2330. The pending projection explicitly supports only index zero as an observed next-slot estimate; it is not a deterministic, complete Ethereum mempool projection.

## Protocol sources used for wording

- [ethereum.org: transactions](https://ethereum.org/developers/docs/transactions/)
- [ethereum.org: gas and fees](https://ethereum.org/developers/docs/gas/)
- [ethereum.org: accounts](https://ethereum.org/developers/docs/accounts/)
- [ethereum.org: proof of stake](https://ethereum.org/developers/docs/consensus-mechanisms/pos/)

The guide therefore distinguishes execution inclusion/confirmation depth from consensus finality, and describes EIP-1559 base fee, priority fee, and maximum fee without presenting fee estimates as promises.
