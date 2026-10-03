// Offline behavioral crawl of the real production request callback. No listen, browser or provider calls.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const { createRequire } = require('node:module');
const { URL } = require('node:url');
const { setTimeout, clearTimeout } = require('node:timers');

const root = path.resolve(__dirname, '../..');
const adapterRequire = createRequire(path.join(root, 'adapter/server.cjs'));
const frontendRequire = createRequire(path.join(root, 'frontend/package.json'));
const parse5 = adapterRequire('parse5');
const ts = frontendRequire('typescript');
const output = path.join(__dirname, 'responses');
fs.mkdirSync(output, { recursive: true });
let handler;
let networkAttempts = 0;
const server = { on() { return this; }, listen() { return this; } };
const context = {
  require(name) {
    if (name === 'node:http') return { createServer(callback) { handler = callback; return server; } };
    if (name === './pending-pool.cjs') return { createPendingPool() { return { start() {} }; } };
    return adapterRequire(name);
  },
  process: { env: { ...process.env, ETH_STATIC_ROOT: path.join(root, 'frontend/dist/mempool/browser') } },
  console: { log() {}, warn() {}, error() {} }, Buffer, URL,
  fetch() { networkAttempts++; throw new Error('Network forbidden in offline crawl'); },
  setInterval() { return { unref() {} }; }, setTimeout, clearTimeout,
};
vm.runInNewContext(fs.readFileSync(path.join(root, 'adapter/server.cjs'), 'utf8'), context, { filename: 'adapter/server.cjs' });
assert.equal(typeof handler, 'function');
const responses = new Map();
async function get(route, method = 'GET') {
  const key = `${method} ${route}`;
  if (responses.has(key)) return responses.get(key);
  let response;
  await handler({ url: route, method, headers: { host: 'eth.tx.taxi' } }, {
    writeHead(status, headers) { response = { route, method, status, headers: Object.fromEntries(Object.entries(headers).map(([name, value]) => [name.toLowerCase(), value])) }; },
    end(body) { response.body = body === undefined ? '' : body.toString(); },
  });
  assert.ok(response, `No response: ${route}`);
  responses.set(key, response);
  return response;
}
function dom(html) {
  const nodes = [];
  function walk(node) { nodes.push(node); for (const child of node.childNodes || []) walk(child); }
  walk(parse5.parse(html));
  const attr = (node, name) => node.attrs?.find(item => item.name === name)?.value;
  const text = node => (node.nodeName === '#text' ? node.value : (node.childNodes || []).map(text).join(''));
  const metas = nodes.filter(node => node.tagName === 'meta');
  const meta = key => {
    const matching = metas.filter(node => attr(node, 'name') === key || attr(node, 'property') === key);
    assert.equal(matching.length, 1, `Exactly one ${key}`);
    return attr(matching[0], 'content');
  };
  return { nodes, attr, text, meta };
}
const canonicalRoutes = ['/', '/blocks/1', '/txs', '/production', '/mempool-block/0', '/about', '/privacy-policy', '/terms-of-service', '/docs/faq', '/docs/api/rest', '/docs/api/websocket'];
const origin = 'https://eth.tx.taxi';
const image = 'https://tx.taxi/assets/screenshots/eth-transaction-4abe31f2a24f.jpg';
const imageAlt = 'A confirmed ETH transfer in eth.tx.taxi, showing status, fee, gas details, sender and destination.';
const checked = [];
const documents = new Map();
const descriptions = new Set();
const titles = new Set();

(async () => {
  for (const route of canonicalRoutes) {
    const response = await get(route);
    assert.equal(response.status, 200, route);
    assert.ok(!/noindex/.test(response.headers['x-robots-tag'] || ''), route);
    assert.match(response.headers['content-type'], /^text\/html/);
    const document = dom(response.body);
    const { nodes, attr, text, meta } = document;
    documents.set(route, document);
    const canonicals = nodes.filter(node => node.tagName === 'link' && attr(node, 'rel') === 'canonical');
    assert.equal(canonicals.length, 1, route);
    assert.equal(attr(canonicals[0], 'id'), 'canonical', route);
    assert.equal(attr(canonicals[0], 'href'), origin + route, route);
    const titleNodes = nodes.filter(node => node.tagName === 'title');
    assert.equal(titleNodes.length, 1, route);
    const title = text(titleNodes[0]);
    assert.equal(meta('og:title'), title);
    assert.equal(meta('twitter:title'), title);
    assert.equal(meta('og:url'), origin + route);
    const description = meta('description');
    assert.equal(meta('og:description'), description);
    assert.equal(meta('twitter:description'), description);
    assert.ok(!titles.has(title), `Duplicate title ${route}`);
    assert.ok(!descriptions.has(description), `Duplicate description ${route}`);
    titles.add(title); descriptions.add(description);
    assert.equal(meta('og:image'), image);
    assert.equal(meta('twitter:image'), image);
    assert.equal(meta('og:image:type'), 'image/jpeg');
    assert.equal(meta('og:image:width'), '1440');
    assert.equal(meta('og:image:height'), '1605');
    assert.equal(meta('og:image:alt'), imageAlt);
    assert.equal(meta('twitter:image:alt'), imageAlt);
    const schemaNode = nodes.find(node => node.tagName === 'script' && attr(node, 'id') === 'jsonld-page');
    const schema = JSON.parse(text(schemaNode));
    assert.equal(schema.url, origin + route);
    assert.equal(schema.image.url, image);
    assert.equal(schema.image.width, 1440);
    assert.equal(schema.image.height, 1605);
    assert.equal(schema.image.caption, imageAlt);
    const app = nodes.find(node => node.tagName === 'app-root');
    assert.ok(text(app).trim().length > 140, `Readable content ${route}`);
    assert.ok(!text(app).includes('{{'), `Unresolved template ${route}`);
    assert.ok(nodes.some(node => node.tagName === 'main'), `Main landmark ${route}`);
    const alternate = nodes.find(node => node.tagName === 'link' && attr(node, 'rel') === 'alternate' && attr(node, 'type') === 'text/markdown');
    const mdPath = new URL(attr(alternate, 'href')).pathname;
    const markdown = await get(mdPath);
    assert.equal(markdown.status, 200);
    assert.match(markdown.headers['content-type'], /^text\/markdown/);
    assert.equal(markdown.headers.link, `<${origin + route}>; rel="canonical"`);
    assert.match(markdown.headers['x-robots-tag'], /noindex, follow/);
    for (const node of nodes.filter(item => item.tagName === 'article' && attr(item, 'id'))) {
      assert.ok(markdown.body.includes(`<a id="${attr(node, 'id')}"></a>`), `Markdown fragment ${route}#${attr(node, 'id')}`);
    }
    checked.push({ route, status: response.status, title, description, schemaType: schema['@type'], textCharacters: text(app).trim().length, markdown: mdPath, bodySha256: crypto.createHash('sha256').update(response.body).digest('hex') });
  }
  const docs = frontendRequire('./static-content.cjs').loadData(path.join(root, 'frontend/src/app/docs/api-docs/ethereum-docs-data.ts'));
  for (const [route, entries] of [['/docs/faq', docs.ethereumGuideData], ['/docs/api/rest', docs.ethereumRestData], ['/docs/api/websocket', docs.ethereumWebsocketData]]) {
    const document = documents.get(route);
    const expected = entries.filter(item => item.type === 'entry');
    const articles = document.nodes.filter(node => node.tagName === 'article');
    assert.equal(articles.length, expected.length, route);
    for (const entry of expected) {
      const article = articles.find(node => document.attr(node, 'id') === entry.fragment);
      assert.ok(article, `Source fragment ${entry.fragment}`);
      assert.ok(document.text(article).includes(entry.title), `Source heading ${entry.fragment}`);
      const sourceText = dom(entry.description).text(parse5.parseFragment(entry.description)).replace(/\s+/g, ' ').trim();
      assert.ok(document.text(article).replace(/\s+/g, ' ').includes(sourceText), `Source content ${entry.fragment}`);
    }
  }
  let internalLinks = 0;
  const skippedDataLinks = new Set();
  for (const [route, document] of documents) {
    for (const node of document.nodes.filter(item => item.tagName === 'a')) {
      const href = document.attr(node, 'href');
      if (!href) continue;
      const target = new URL(href, origin + route);
      if (target.origin !== origin) continue;
      if (/^\/api\//.test(target.pathname) && !['/api/api/rest', '/api/api/websocket'].includes(target.pathname)) { skippedDataLinks.add(target.pathname); continue; }
      let response = await get(target.pathname);
      for (let count = 0; response.status === 301 && count < 4; count++) response = await get(response.headers.location);
      assert.equal(response.status, 200, `Internal link ${route} -> ${href}`);
      assert.ok(!/noindex/.test(response.headers['x-robots-tag'] || ''), `Indexed internal link ${route} -> ${href}`);
      if (target.hash) {
        const targetDocument = dom(response.body);
        assert.ok(targetDocument.nodes.some(item => targetDocument.attr(item, 'id') === decodeURIComponent(target.hash.slice(1))), `Fragment ${route} -> ${href}`);
      }
      internalLinks++;
    }
  }
  const aliases = { '/docs': '/docs/faq', '/docs/api': '/docs/api/rest', '/api': '/docs/faq', '/api/api/rest': '/docs/api/rest', '/api/api/websocket': '/docs/api/websocket', '/blocks': '/blocks/1', '/mining': '/production', '/llm.txt': '/llms.txt', '/about/': '/about' };
  for (const [route, target] of Object.entries(aliases)) {
    const response = await get(route);
    assert.equal(response.status, 301, route);
    assert.equal(response.headers.location, target, route);
  }
  for (const route of ['/tools/calculator', '/graphs/mining/hashrate-difficulty', '/graphs/price', '/trademark-policy', '/lightning', '/tx/push', '/rbf', '/not-a-route']) {
    const response = await get(route);
    assert.match(response.headers['x-robots-tag'], /noindex/, route);
  }
  const paginated = await get('/blocks/2');
  assert.equal(paginated.status, 200);
  const pagination = dom(paginated.body);
  assert.equal(pagination.attr(pagination.nodes.find(node => pagination.attr(node, 'id') === 'canonical'), 'href'), origin + '/blocks/2');
  assert.ok(pagination.meta('og:title').includes('page 2'));
  const entity = await get('/tx/0x82f117c1b9e9bbca003ed94bc7bf5f37ce5df5dfa512d189de6c10d66c6bee48');
  assert.equal(entity.status, 200);
  const entityDocument = dom(entity.body);
  assert.ok(entityDocument.nodes.some(node => entityDocument.attr(node, 'id') === 'canonical'));
  assert.equal(entityDocument.meta('og:image'), image);
  assert.equal(entityDocument.meta('twitter:image'), image);
  assert.equal(entityDocument.meta('og:image:width'), '1440');
  assert.equal(entityDocument.meta('og:image:height'), '1605');
  assert.equal(entityDocument.meta('og:image:alt'), imageAlt);
  for (const route of ['/robots.txt', '/sitemap.xml', '/llms.txt', '/llms-full.txt']) {
    const response = await get(route);
    assert.equal(response.status, 200, route);
    fs.writeFileSync(path.join(__dirname, route.slice(1)), response.body);
  }
  const llms = (await get('/llms.txt')).body;
  assert.ok(llms.includes('wss://eth.tx.taxi/api/v1/ws'));
  for (const route of canonicalRoutes) assert.ok(llms.includes(origin + route), route);
  assert.match((await get('/llms.txt')).headers['content-type'], /^text\/plain/);
  assert.match((await get('/llms-full.txt')).headers['x-robots-tag'], /noindex, follow/);
  assert.equal((await get('/llms.txt', 'HEAD')).body, '');
  assert.equal(networkAttempts, 0);

  // Execute the actual client service against an initial docs head: canonical survival and base reset.
  const serviceSource = fs.readFileSync(path.join(root, 'frontend/src/app/services/seo.service.ts'), 'utf8');
  const compiled = ts.transpileModule(serviceSource, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, experimentalDecorators: true } }).outputText;
  const removed = [];
  const canonical = { href: origin + '/docs/faq', setAttribute(name, value) { if (name === 'href') this.href = value; } };
  const exports = {};
  const mockDocument = { getElementById(id) { return id === 'canonical' ? canonical : { remove() { removed.push(id); } }; }, querySelector() { return { remove() { removed.push('markdown'); } }; } };
  vm.runInNewContext(compiled, { exports, URL, document: mockDocument, window: {}, require(name) {
    if (name === '@angular/core') return { Injectable() { return value => value; } };
    if (name === 'rxjs') return { filter() {}, map() {}, switchMap() {} };
    return {};
  } });
  const updates = [];
  const service = new exports.SeoService({ getTitle() { return 'Ethereum Guide - eth.tx.taxi - Ethereum Explorer'; }, setTitle(value) { updates.push(['title', value]); } }, { getTag() { return { content: 'Initial guide description' }; }, updateTag(value) { updates.push(value); } }, { networkChanged$: { subscribe(callback) { callback(''); } } }, { events: { pipe() { return { subscribe() {} }; } } }, {});
  assert.equal(service.getTitle(), 'eth.tx.taxi - Ethereum Explorer');
  assert.equal(service.getDescription(), 'Track Ethereum blocks, transactions, addresses, and live gas conditions on eth.tx.taxi.');
  service.updateCanonical('/docs/faq');
  assert.equal(removed.length, 0, 'Retain matching initial schema');
  service.updateCanonical('/about');
  assert.equal(canonical.href, origin + '/about');
  assert.deepEqual(removed, ['jsonld-page', 'markdown']);
  service.resetTitle(); service.resetDescription();
  assert.ok(updates.some(item => item[0] === 'title' && item[1] === 'eth.tx.taxi - Ethereum Explorer'));

  const graphSource = fs.readFileSync(path.join(root, 'frontend/src/app/services/opengraph.service.ts'), 'utf8');
  const graphCompiled = ts.transpileModule(graphSource, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, experimentalDecorators: true } }).outputText;
  const graphExports = {};
  vm.runInNewContext(graphCompiled, { exports: graphExports, window: {}, require(name) {
    if (name === '@angular/core') return { Injectable() { return value => value; } };
    if (name === 'rxjs/operators') return { filter() {}, map() {}, switchMap() {} };
    return {};
  } });
  for (const route of ['/about', '/tx/0x82f117c1b9e9bbca003ed94bc7bf5f37ce5df5dfa512d189de6c10d66c6bee48']) {
    const graphUpdates = new Map();
    const graph = new graphExports.OpenGraphService({}, { updateTag(value) { graphUpdates.set(value.property || value.name, value.content); } }, {}, { url: route, events: { pipe() { return { subscribe() {} }; } } }, {});
    graph.clearOgImage();
    assert.equal(graphUpdates.get('og:image'), image);
    assert.equal(graphUpdates.get('twitter:image'), image);
    assert.equal(graphUpdates.get('og:image:type'), 'image/jpeg');
    assert.equal(graphUpdates.get('og:image:width'), '1440');
    assert.equal(graphUpdates.get('og:image:height'), '1605');
    assert.equal(graphUpdates.get('og:image:alt'), imageAlt);
  }

  fs.writeFileSync(path.join(output, 'http.json'), JSON.stringify([...responses.values()]));
  fs.writeFileSync(path.join(__dirname, 'check-results.json'), JSON.stringify({ date: new Date().toISOString(), mode: 'real adapter callback, no listen; actual built Angular index; providers forbidden', canonicalPages: checked, internalLinks, skippedDataLinks: [...skippedDataLinks], responses: responses.size, aliases, networkAttempts, clientNavigation: 'initial route schema retained; changed canonical clears stale schema/Markdown link; reset restores Ethereum base', failures: 0 }, null, 2) + '\n');
  console.log(JSON.stringify({ canonicalPages: checked.length, internalLinks, responses: responses.size, networkAttempts, failures: 0 }));
})().catch(error => { console.error(error.stack); process.exitCode = 1; });
