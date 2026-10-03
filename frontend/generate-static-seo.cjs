const fs = require('node:fs');
const path = require('node:path');
const { escapeHtml: escape, loadData, renderTemplate, htmlToMarkdown, styleBlock } = require('./static-content.cjs');

const root = __dirname;
const origin = 'https://eth.tx.taxi';
const screenshot = { '@type': 'ImageObject', url: 'https://tx.taxi/assets/screenshots/eth-transaction-4abe31f2a24f.jpg', width: 1440, height: 1605, caption: 'A confirmed ETH transfer in eth.tx.taxi, showing status, fee, gas details, sender and destination.' };
const source = filename => fs.readFileSync(path.join(root, filename), 'utf8');
const docs = loadData(path.join(root, 'src/app/docs/api-docs/ethereum-docs-data.ts'));
const output = path.resolve(process.env.ETH_SEO_OUTPUT || path.join(root, 'dist/mempool/browser/resources/seo'));
fs.mkdirSync(output, { recursive: true });

function intro(context = 'documentation') {
  return '<app-tx-taxi-docs-intro>' + renderTemplate(source('src/app/shared/components/tx-taxi-docs-intro/tx-taxi-docs-intro.component.html'), { chainName: 'Ethereum', chainHost: 'eth.tx.taxi', context }) + '</app-tx-taxi-docs-intro>';
}
function styles(filename, tag) {
  return styleBlock(path.join(root, filename), '.static-seo-content ' + tag);
}
const introStyles = styles('src/app/shared/components/tx-taxi-docs-intro/tx-taxi-docs-intro.component.scss', 'app-tx-taxi-docs-intro');
const footerSource = source('src/app/shared/components/global-footer/global-footer.component.html');
const footer = '<app-global-footer><footer><div class="container-fluid">' + renderTemplate(footerSource.slice(footerSource.indexOf('<div class="row col-md-12 link-tree"'), footerSource.indexOf('\n  </div>\n</footer>'))) + '</div></footer></app-global-footer>';
const footerStyles = styles('src/app/shared/components/global-footer/global-footer.component.scss', 'app-global-footer');
const pages = [];
function add(route, title, description, body, options = {}) {
  const canonical = origin + route;
  const heading = title || 'eth.tx.taxi';
  const markdownPath = route === '/' ? '/index.md' : route + '.md';
  const content = body || `<main class="container-xl"><h1>${escape(heading)}</h1><p>${escape(description)}</p><p><a href="/docs/faq">Ethereum guide</a> · <a href="/docs/api/rest">REST API reference</a> · <a href="/docs/api/websocket">WebSocket reference</a></p></main>`;
  const page = { path: route, title: title ? `${title} - eth.tx.taxi - Ethereum Explorer` : 'eth.tx.taxi - Ethereum Explorer', heading, description, canonical, markdownPath,
    html: `<div class="static-seo-content">${content}${footer}</div>`,
    styles: introStyles + footerStyles + (options.styles || ''),
    schema: { '@context': 'https://schema.org', '@type': options.schemaType || 'WebPage', '@id': canonical + '#page', url: canonical, name: heading, description, inLanguage: 'en', isPartOf: { '@id': origin + '/#website' }, image: screenshot },
    sources: options.sources || [], fragments: options.fragments || [] };
  if (options.questions) page.schema.mainEntity = options.questions;
  page.markdown = `# ${heading}\n\nCanonical: ${canonical}\n\n` + htmlToMarkdown(content).replace(/^# [^\n]+\n+/, '') + `\n## Explorer information\n\n[About](${origin}/about) · [Ethereum guide](${origin}/docs/faq) · [REST API](${origin}/docs/api/rest) · [WebSocket API](${origin}/docs/api/websocket) · [Terms](${origin}/terms-of-service) · [Privacy](${origin}/privacy-policy)\n`;
  pages.push(page);
}

add('/', '', 'Track Ethereum blocks, transactions, addresses, and live gas conditions on eth.tx.taxi.', null, { sources: ['src/index.mempool.html', 'src/app/dashboard/dashboard.component.html'], schemaType: 'WebApplication' });
add('/blocks/1', 'Blocks', 'See recent Ethereum blocks with validator, gas usage, transaction count, rewards, and fees.', null, { sources: ['src/app/components/blocks-list/blocks-list.component.ts', 'src/app/components/blocks-list/blocks-list.component.html'], schemaType: 'CollectionPage' });
add('/txs', 'Recent Transactions', 'See recent Ethereum transactions with value, gas used, and gas price, updated in real time.', null, { sources: ['src/app/components/recent-transactions-list/recent-transactions-list.component.ts', 'src/app/components/recent-transactions-list/recent-transactions-list.component.html'], schemaType: 'CollectionPage' });
add('/production', 'Ethereum Block Production', 'Follow recent Ethereum blocks, fee recipients, gas usage, transaction activity, and the live gas market.', null, { sources: ['src/app/components/mining-dashboard/mining-dashboard.component.ts', 'src/app/components/mining-dashboard/mining-dashboard.component.html'] });
add('/mempool-block/0', 'Pending transaction sample', 'See observed Ethereum pending transactions, gas-price ranges, gas limits, and estimated execution fees for the next validator slot.', null, { sources: ['src/app/components/mempool-block/mempool-block.component.html', 'src/app/docs/api-docs/ethereum-docs-data.ts'] });

for (const item of [
  { route: '/about', title: 'About eth.tx.taxi', description: 'Learn about eth.tx.taxi, its Ethereum data sources, open-source lineage, and operator contact details.', name: 'about', schemaType: 'AboutPage' },
  { route: '/privacy-policy', title: 'Privacy Policy', description: 'How eth.tx.taxi handles the limited technical data required to operate its Ethereum explorer.', name: 'privacy-policy' },
  { route: '/terms-of-service', title: 'Terms of Service', description: 'Terms for using eth.tx.taxi, an independent Ethereum block explorer operated by tx.taxi.', name: 'terms-of-service' },
]) {
  const file = `src/app/components/${item.name}/${item.name}.component.html`;
  let body = source(file).replace(/<app-tx-taxi-docs-intro\b[^>]*><\/app-tx-taxi-docs-intro>/g, intro('explorer'));
  body = renderTemplate(body);
  if (item.name !== 'about') body = '<main>' + body.replace(`<h2>${item.title}</h2>`, `<h1>${item.title}</h1>`) + '</main>';
  const cssFile = `src/app/components/${item.name}/${item.name}.component.scss`;
  add(item.route, item.title, item.description, `<app-${item.name}>${body}</app-${item.name}>`, { schemaType: item.schemaType, styles: fs.existsSync(path.join(root, cssFile)) ? styles(cssFile, `app-${item.name}`) : '', sources: [file] });
}

for (const tab of [
  { route: '/docs/faq', title: 'Ethereum Guide', heading: 'Understand what the explorer shows', description: 'Understand Ethereum transactions, gas, account activity, confirmations, and the data shown by eth.tx.taxi.', data: docs.ethereumGuideData, type: 'FAQPage' },
  { route: '/docs/api/rest', title: 'REST API', heading: 'Ethereum REST API', description: 'Documentation for the eth.tx.taxi REST API: blocks, transactions, accounts, tokens, gas estimates, and explorer state.', data: docs.ethereumRestData, type: 'TechArticle' },
  { route: '/docs/api/websocket', title: 'WebSocket API', heading: 'Ethereum WebSocket API', description: 'Documentation for the eth.tx.taxi WebSocket API: live Ethereum blocks, pending transactions, accounts, and transaction status.', data: docs.ethereumWebsocketData, type: 'TechArticle' },
]) {
  const entries = tab.data.filter(item => item.type === 'entry');
  const nav = tab.data.map(item => item.type === 'category' ? `<p>${escape(item.title)}</p>` : `<a href="#${escape(item.fragment)}">${escape(item.title)}</a>`).join('');
  const content = tab.data.map(item => item.type === 'category' ? `<h2 class="section-title">${escape(item.title)}</h2>` : `<article class="endpoint-container expanded" id="${escape(item.fragment)}"><h3 class="section-header"><span class="section-header-title">${escape(item.title)}</span><span class="section-label">${escape(item.category)}</span></h3><div class="endpoint-content">${item.path ? `<div class="endpoint"><code><strong>${escape(item.method)}</strong> ${escape(item.path)}</code></div>` : ''}<div class="description">${item.description}</div>${item.path ? `<div class="code-example"><div class="subtitle">cURL</div><pre><code>${escape('curl ' + origin + item.path)}</code></pre></div>` : ''}${item.request ? `<div class="code-example"><div class="subtitle">Client example</div><pre><code>${escape(item.request)}</code></pre></div>` : ''}${item.response ? `<div class="code-example"><div class="subtitle">Server response</div><pre><code>${escape(item.response)}</code></pre></div>` : ''}</div></article>`).join('');
  const tabs = '<ul class="nav-tabs nav"><li><a class="nav-link" href="/docs/faq">Ethereum Guide</a></li><li><a class="nav-link" href="/docs/api/rest">API - REST</a></li><li><a class="nav-link" href="/docs/api/websocket">API - WebSocket</a></li></ul>';
  const body = `<app-docs><div class="container-xl">${intro()}${tabs}<app-api-docs><div class="docs-layout"><div id="doc-nav-desktop" class="hide-on-mobile"><app-api-docs-nav><nav aria-label="Documentation sections">${nav}</nav></app-api-docs-nav></div><main class="doc-content"><section class="docs-intro"><h1>${tab.heading}</h1><p>${escape(tab.description)}</p></section>${content}</main></div></app-api-docs></div></app-docs>`;
  add(tab.route, tab.title, tab.description, body, { schemaType: tab.type, questions: tab.type === 'FAQPage' ? entries.map(item => ({ '@type': 'Question', name: item.title, acceptedAnswer: { '@type': 'Answer', text: item.description } })) : undefined,
    styles: styles('src/app/docs/api-docs/api-docs.component.scss', 'app-api-docs') + styles('src/app/docs/api-docs/api-docs-nav.component.scss', 'app-api-docs-nav'),
    sources: ['src/app/docs/api-docs/ethereum-docs-data.ts', 'src/app/docs/api-docs/api-docs.component.html'], fragments: entries.map(item => item.fragment) });
}

const aliases = { '/docs': '/docs/faq', '/docs/api': '/docs/api/rest', '/docs/api/electrs': '/docs/faq', '/api': '/docs/faq', '/api/faq': '/docs/faq', '/api/api': '/docs/api/rest', '/api/api/rest': '/docs/api/rest', '/api/api/websocket': '/docs/api/websocket', '/blocks': '/blocks/1', '/mining': '/production' };
const llms = '# eth.tx.taxi\n\n> Public Ethereum mainnet explorer in the tx.taxi family. Read-only blocks, transactions, accounts, tokens, gas estimates and provider-observed pending activity.\n\n## Canonical pages\n\n' + pages.map(page => `- [${page.heading}](${page.canonical}): ${page.description}`).join('\n') + '\n\n## Markdown representations\n\n' + pages.map(page => `- [${page.heading}](${origin}${page.markdownPath})`).join('\n') + '\n\n## Documented interfaces\n\nREST base: https://eth.tx.taxi\nWebSocket endpoint: wss://eth.tx.taxi/api/v1/ws\n\n' + docs.ethereumRestData.filter(item => item.path).map(item => `- GET ${item.path}: ${item.title}`).join('\n') + '\n\n## Limits\n\n' + htmlToMarkdown(docs.ethereumRestData.find(item => item.fragment === 'rest-overview').description) + '\n' + htmlToMarkdown(docs.ethereumGuideData.find(item => item.fragment === 'support-disclaimer').description) + '\nFull documentation: https://eth.tx.taxi/llms-full.txt\n';
fs.writeFileSync(path.join(output, 'pages.json'), JSON.stringify({ origin, pages, aliases, llms, llmsFull: '# eth.tx.taxi documentation\n\n' + pages.map(page => page.markdown).join('\n---\n\n') }, null, 2) + '\n');
console.log(`Generated ${pages.length} canonical Ethereum pages and Markdown representations; documentation entries: 15 guide, 18 REST, 7 WebSocket.`);
