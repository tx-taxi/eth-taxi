<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="frontend/src/resources/branding/eth-dark-full.svg">
    <img src="frontend/src/resources/branding/eth-light-full.svg" width="360" alt="eth.tx.taxi banner logo">
  </picture>
</p>

<h1 align="center">Ethereum Explorer · eth.tx.taxi</h1>

<p align="center">
  A public Ethereum block explorer for following blocks, transactions, accounts, tokens, and live gas conditions.<br>
  <a href="https://eth.tx.taxi">Open eth.tx.taxi</a>
</p>

## Overview

[eth.tx.taxi](https://eth.tx.taxi) is an Ethereum explorer in the [tx.taxi](https://tx.taxi) network. It presents public chain data supplied by configured infrastructure; availability and completeness depend on those sources.

## Features

- Ethereum blocks, transactions, confirmations, pending activity, and gas information.
- Account and contract pages with ETH balances, indexed metadata when available, and token balances.
- Token pages and transfer activity, with clear fallback states when complete indexed history is unavailable.
- Explorer REST and WebSocket documentation in the application.

## Development

The frontend is an Angular application. Its local development server proxies explorer API requests to a compatible backend at `http://localhost:8999`. A working explorer also needs configured Ethereum chain services; use the existing [backend](./backend/), [Docker](./docker/), and [production](./production/) documentation for their prerequisites and configuration.

```bash
cd frontend
npm ci
npm run start
```

Open <http://localhost:4200>. `npm run start` generates the frontend configuration, synchronizes development assets, and starts the local Angular configuration. To verify a frontend production build, run `npm run build` from `frontend/`.

## Attribution and license

This repository adapts the [Mempool Open Source Project](https://github.com/mempool/mempool) for Ethereum in the tx.taxi network. The previous upstream root documentation is archived in [UPSTREAM_README.md](./UPSTREAM_README.md) to preserve source history and superseded setup guidance.

The code is distributed under the terms in [LICENSE](LICENSE) and [COPYING.md](COPYING.md), including the GNU Affero General Public License v3 text and applicable trademark notices.

Original tx.taxi modifications and documentation are credited to tx.taxi contributors (2026). Upstream copyright and license notices are preserved in [`LICENSE`](LICENSE) and [`COPYING.md`](COPYING.md).

The software license does not grant trademark rights to the tx.taxi name or logos. Independent deployments should use their own branding and must not imply they are operated or endorsed by tx.taxi.

## Links

- [Live explorer](https://eth.tx.taxi)
- [tx.taxi hub](https://tx.taxi)
- [Telegram channel](https://t.me/txtaxi)
