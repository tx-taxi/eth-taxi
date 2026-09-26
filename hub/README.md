# Native router strip export

Source baseline: `dfe5b3813`, approved palette/promotion rollout in explorer-kit, subsequently checked by router integration against public native explorer bundles. This isolated worktree preserves the original component sources unchanged. No original worktree was edited and no deployments were performed.

`build.cjs` compiles actual BlockchainComponent, BlockchainBlocksComponent and MempoolBlocksComponent plus the actual fee, amount, pool, time, pipes and sparkle dependencies. It resolves templateUrl/styleUrls to their original files and emits constructor DI metadata needed by Angular JIT. The bundled Angular runtime is restricted to this module; no AppModule, dashboard, detail screens, backend or full explorer application is included. Component styles are registered inside each mount's ShadowRoot and native global styles/FontAwesome styles scoped to it. Presentation files are not reconstructed or approximated.

`entry.ts` supplies only host scrolling, viewport width, native destination routing/images, lifecycle and an injectable facade for native observables. Native allBlocks pending rendering and original native divider/amount/direction interactions remain. The empty-state label is outside native content. `facade.ts` defines the existing component service subset; units and block capacity are chain-specific. `feed.js` owns native websocket initialization, wire ordering, latest updates, deadlines and reconnect status.

Build after installing the existing frontend dependencies:

```sh
node hub/build.cjs /home/lukee/dev/tx-taxi-router-hub/public/assets/native-strips/eth
```

Export: `strip.js`, `strip.css`, `feed.js`, `provenance.json`. Provenance includes SHA-256 of original component TS/templates/styles, helper files and native global styles. Both sibling bundles currently include their own Angular runtime (about 1.5 MB uncompressed each); deduplicating this is a future package optimization, not a full-application embed.

Mount contract:

```js
const mounted = await mount(host, {destination:'https://eth.tx.taxi'});
const stop = startFeed({onSnapshot: data => mounted.update(data), onStatus, signal});
// dispose / BFCache teardown
stop(); mounted.destroy();
```

Snapshot uses existing native block, pending-block and difficulty shapes. Wire blocks arrive oldest-first; feed reverses them like native StateService.resetBlocks. `update` accepts newest-first `blocks`, one `block`, `mempoolBlocks`, `difficultyAdjustment`. No provider failover or unit calculation moved into router. `destination` is scoped to each mount through DI. Feed URL is fixed reviewed chain code. Multiple registrations do not modify one another's destinations. Shadow root is reused and cleared on remount.

Historical pin reconciliation: complete intervening range `a52c4b926..dfe5b3813` was inventoried (`reconciled-range.txt`). Search/metadata/footer/deployment-only commits remain outside the export. Block timestamp/loading/fee/palette/native font/amount changes are included by compiling the latest approved entire source files, not selecting an old pin. The native sources themselves are byte-identical to `dfe5b3813`. Public revision hashes are deployment observations, not proof of Git identity.

Captured `live-fixture.json` is a bounded native websocket snapshot for reproducible review, not fabricated chain data. Router review fixtures hold the matching native/hub visual captures and failure controls. Do not advertise these recorded fixtures as live or include fixture-only chains in production.

## Shadow renderer details

`createApplication(importProvidersFrom(StripModule))` uses one render scheduler so native ng-bootstrap hover transitions run normally. It does not patch global Zone.js or disable native animation. The style host removes `document.head` and installs only the band ShadowRoot. Each mount has a scoped DOCUMENT facade whose body is its overlay element; native explicit `container="body"` hover templates therefore keep their original DOM/style/transition behavior inside the band. Per-image instance src resolution preserves native fallback handling while redirecting the chain resource namespace and packaged default icon; global browser prototypes are unchanged. Destination injection is per instance, not module-global.

Local dependency setup used an existing installed frontend node_modules symlink from the corresponding approved row-actions worktree. For a fresh checkout, install dependencies using frontend/package-lock.json before running the exact build command above. Build-time dependencies are the existing frontend TypeScript, esbuild and Sass packages. `source.json` preserves the approved presentation revision independently of later hub export commits.
