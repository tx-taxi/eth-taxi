# Ethereum native SEO/GEO candidate — 2026-10-03

Candidate baseline: isolated clone `/tmp/tx-taxi-native-seo-complete-20261003/eth` from `/tmp/tx-taxi-seo-native-20261003/eth`, HEAD `f7fe63af3` before this change. Baseline root discovery listed only the homepage. This report concerns the local candidate, not observed production deployment. No push, deployment, browser, image viewing, screenshot capture or provider requests occurred in this pass.

## Included canonical pages

| URL path | Actual source and supported behavior |
| --- | --- |
| `/` | Dashboard and `src/index.mempool.html`; Ethereum block, transaction and gas overview. |
| `/blocks/1` | `master-page.module.ts`, `components/blocks-list`; recent Ethereum block list; adapter `blocksEndingAt` and `/api/v1/blocks/:height`. Positive numeric `/blocks/:page` keeps self-canonical, page-specific metadata; only the first page enters the finite sitemap. |
| `/txs` | `master-page.module.ts`, `components/recent-transactions-list`; recent Ethereum transactions; adapter `/api/v1/txs`. |
| `/production` | `graphs/graphs.routing.module.ts` and adapted `components/mining-dashboard`; Ethereum block production, gas market, fees and observed activity, backed by current adapter blocks/gas statistics. The component name is inherited, its Ethereum content is real. |
| `/mempool-block/0` | `graphs/graphs.routing.module.ts`, `components/mempool-block`, adapter `project-pending-blocks.cjs`; first gas-capacity tile of the provider-observed pending sample. Additional indices depend on current sample size and frontend clamps absent indices; they remain ordinary noindex SPA routes, outside this finite stable inventory. This is not a complete global mempool or an inclusion guarantee. |
| `/about` | Actual `components/about/about.component.html` and original SCSS: Ethereum sources, open-source lineage and contact details. |
| `/privacy-policy` | Actual adapted Ethereum `components/privacy-policy` template, SCSS and description. |
| `/terms-of-service` | Actual adapted Ethereum `components/terms-of-service` template and description. |
| `/docs/faq` | Actual `docs/api-docs/ethereum-docs-data.ts`: 15 existing guide questions and answers. FAQPage uses those actual questions and answers. |
| `/docs/api/rest` | Same actual data module: 18 REST reference entries, existing endpoint paths, examples, limits and fragments. |
| `/docs/api/websocket` | Same actual data module: 7 WebSocket reference entries, actual `wss://eth.tx.taxi/api/v1/ws`, requests, responses and limits. |

The original docs module routes only the three documentation pages. Its individual sections are fragment IDs, not invented routes. Every existing doc fragment is retained in HTML and Markdown. Docs source styles are compiled and scoped to the server content; every server article has the original `.expanded` state. The original mobile stylesheet explicitly makes `.expanded .endpoint-content` visible. The existing native footer and shared introduction are reused, including their design styles and links. There is no user-agent distinction. The browser replaces the initial content with its normal Angular page after boot.

The homepage and four live collection pages have an honest heading, their existing component description and documentation links in initial HTML. Live rows remain the existing browser component's responsibility; no static block, gas or transaction result is invented.

## Aliases and discovery

`/docs`, `/docs/api`, `/docs/api/electrs`, `/api`, `/api/faq`, `/api/api`, `/api/api/rest`, `/api/api/websocket`, `/blocks` and `/mining` permanently redirect to the supported canonical page. Trailing slashes on exact static pages also redirect. The XML sitemap is at root `/sitemap.xml`, covers all eleven canonical pages and is advertised by `/robots.txt`.

`/llms.txt` is a text/plain inventory of the actual pages, their Markdown representations, documented REST paths, WebSocket endpoint and source-derived limitations. `/llm.txt` permanently redirects to it. `/llms-full.txt` concatenates the same page Markdown. Each HTML page advertises `rel=describedby` to `/llms.txt` and `rel=alternate type=text/markdown` to its representation. Root uses `/index.md`; other included pages append `.md`. Markdown responses carry an HTTP `Link` canonical to the HTML page. Markdown and `/llms-full.txt` send `X-Robots-Tag: noindex, follow` to avoid duplicate search result pages while remaining accessible. These auxiliary documents are excluded from the HTML sitemap.

## Excluded or parameterized routes

| Route family | Provenance and decision |
| --- | --- |
| `/tx/:id`, `/block/:id`, `/address/:id`, `/token/:id` | Real registered Ethereum entity routes, backed by the adapter. Valid IDs retain direct-link handling, self-canonical metadata and the real product-reference screenshot. Arbitrary IDs are not enumerated in this finite static sitemap. |
| `/blocks/:page` beyond page 1 | Supported positive numeric pagination with page-specific canonical and title; excluded from finite sitemap because the sequence is unbounded. |
| `/mempool-block/:id` beyond 0 | Actual pending-tile selection varies with observed sample size; retained SPA direct links with noindex outside the stable inventory. |
| `/tools/calculator` | Registered inherited calculator source explicitly uses BTC, sats, 21-million supply and 1e8 conversion; not an Ethereum calculator. Excluded/noindex. |
| `/graphs/*`, `/mining/pool/:slug`, `/mining/blocks`, `/blocks/stale` | Source graph routing, network annotations and components still request Bitcoin/Liquid mining, subsidy, hashrate, difficulty, stale-block or Lightning datasets; those adapters are unsupported. Excluded/noindex. The separately adapted `/production` is included. |
| `/trademark-policy` | Inherited template describes membership of the Bitcoin community and upstream mempool trademark policy; not advertised by the native footer. Excluded/noindex rather than promoted as an Ethereum policy. |
| `/rbf`, `/tx/push`, `/pushtx`, `/tx/test`, `/wallet/:wallet`, `/stratum`, acceleration paths | Inherited Bitcoin replacement, wallet, broadcast/test, Stratum or accelerator product routes. Ethereum product capability is not established; excluded/noindex. |
| Lightning, Liquid, signet/regtest/testnet and official-only monitoring/nodes/faucet/treasuries products | `StateService` defaults disable these or route additions require the official upstream product. Excluded/noindex. |
| `/market`, stable validator/blob/token-list pages | No such supported stable page is registered in the inspected routing source. No route or metadata claim added. Token entity pages are real as above. |
| `/clock`, `/view`, `/widget`, `/preview`, search/utility paths, locale prefixes, unrecognized routes | Existing SPA direct-link behavior remains; not new canonical static pages. Non-entity/non-inventory fallbacks return `X-Robots-Tag: noindex, follow`. API behavior and physical asset serving remain intact. |

## Metadata and hydration gaps closed

The prior SPA fallback emitted homepage metadata and an empty application root for informational deep links. Static pages now have readable existing content, unique title/description, exact canonical, matching OG/Twitter, and page schema appropriate to actual content. Server canonical links have `id=canonical`, required by the existing client service. The service keeps stable Ethereum base metadata instead of capturing the first document's guide/about title and description. On later navigation it updates canonical and OG URL and removes the prior page's schema/Markdown alternate, preventing stale route claims. A direct request to the new route supplies that route's full server metadata again.

All social metadata paths—including existing entity pages, client navigation and source index—use the approved real full-page native Ethereum transaction capture. Schema includes the same ImageObject. Exact source manifest metadata and local byte/hash verification are in `screenshot-provenance.json`; no image was loaded into conversation context. The image is a historical product reference captured 2026-09-28, not a claim to depict the current document or entity. Existing `/og/*` image rendering endpoints remain available but metadata does not link their generated cards.

The user's final native search copy correction is also included: Automatic Routing's host subtext reads “Or go straight to `tx.taxi/[your search]`”. It retains the existing subdued host size/color; only the example uses the monospace code font. Wrapper-scoped normal whitespace and anywhere wrapping keep the longer hint inside its existing grid column. No routing behavior changed.

## Verification and limits

`check.cjs` invokes the real adapter request callback against the actual localized Angular build with no server listener. It blocks providers and background polling and validates emitted HTTP, head, schema, existing source doc text, fragments, aliases, Markdown and client service navigation. `check-xml.py` independently parses emitted XML with ElementTree and validates root scope and exact inventory. Results are recorded in `check-results.json` and `xml-check.json`; full local responses remain in the ignored `responses/` directory for inspection. This is a behavioral crawl, not a snapshot or a change-detector test.

Normal `SKIP_SYNC=1 npm run build` encountered the pre-existing restricted-environment `spawnSync /bin/sh EPERM` in `generate-themes.js`'s `npx sass` subprocess. Compiling the same themes through the locked Sass JavaScript API, generating config and running the real localized Angular production compiler directly succeeded. The exact bounded theme helper is `compile-themes.cjs`; compiler summary is in `build-summary.json`. Existing component size/translation warnings remain. Targeted ESLint of changed files and standalone checks exits zero; inherited TypeScript warnings are retained. `git diff --check` passes.

All build helpers have explicit frontend direct dependencies at the already locked `parse5 8.0.0` and `sass 1.90.0`; no version drift was introduced. The actual handler crawl uses the adapter's existing locked `parse5 6.0.1`, `sharp 0.34.5` and `ws 8.21.3` through a read-only dependency symlink, excluded from the commit. ETH Dockerfile uses the Node adapter directly; legacy nginx configuration is not this deployment's request path. Static physical files still precede SPA handling, including non-regex assets such as `3rdpartylicenses.txt`.

Verified here: local build, emitted pages/discovery/Markdown, metadata identity, source content/fragments, canonical/navigation behavior and screenshot bytes/provenance. Unresolved here: production response state after a future parent-owned deployment, live provider health and visual browser rendering. No production baseline is inferred from the candidate.
