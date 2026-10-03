const fs = require('node:fs');
const path = require('node:path');
const parse5 = require('parse5');

const ORIGIN = 'https://eth.tx.taxi';
// Historical real full-page capture; this is a product reference, not a screenshot of these pages.
const IMAGE = 'https://tx.taxi/assets/screenshots/eth-transaction-4abe31f2a24f.jpg';
const IMAGE_ALT = 'A confirmed ETH transfer in eth.tx.taxi, showing status, fee, gas details, sender and destination.';
const escape = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);

function createStaticSeo(staticRoot, injectDocument) {
  let manifest;
  function data() {
    if (!manifest) manifest = JSON.parse(fs.readFileSync(path.join(staticRoot, 'resources/seo/pages.json'), 'utf8'));
    return manifest;
  }
  function page(pathname) {
    const found = data().pages.find(item => item.path === pathname);
    if (found) return found;
    const pagination = pathname.match(/^\/blocks\/([1-9]\d{0,7})$/);
    if (!pagination) return null;
    const first = data().pages.find(item => item.path === '/blocks/1');
    const heading = `Blocks — page ${pagination[1]}`;
    const canonical = ORIGIN + pathname;
    return { ...first, path: pathname, title: `${heading} - eth.tx.taxi - Ethereum Explorer`, canonical,
      markdownPath: null, html: first.html.replace('<h1>Blocks</h1>', `<h1>${heading}</h1>`),
      schema: { ...first.schema, '@id': canonical + '#page', url: canonical, name: heading } };
  }
  function render(html, item) {
    const tags = [
      ['name', 'description', item.description], ['property', 'og:type', 'website'],
      ['property', 'og:site_name', 'eth.tx.taxi'], ['property', 'og:locale', 'en_US'],
      ['property', 'og:title', item.title], ['property', 'og:description', item.description],
      ['property', 'og:url', item.canonical], ['property', 'og:image', IMAGE],
      ['property', 'og:image:type', 'image/jpeg'], ['property', 'og:image:width', '1440'], ['property', 'og:image:height', '1605'],
      ['property', 'og:image:alt', IMAGE_ALT],
      ['name', 'twitter:card', 'summary_large_image'], ['name', 'twitter:title', item.title],
      ['name', 'twitter:description', item.description], ['name', 'twitter:image', IMAGE],
      ['name', 'twitter:image:alt', IMAGE_ALT], ['name', 'twitter:domain', 'eth.tx.taxi'],
    ];
    const metadata = { html: `<title>${escape(item.title)}</title><link id="canonical" rel="canonical" href="${escape(item.canonical)}">` + tags.map(([attribute, name, value]) => `<meta ${attribute}="${name}" content="${escape(value)}">`).join('') +
      `<link rel="describedby" href="${ORIGIN}/llms.txt" type="text/plain">` +
      (item.markdownPath ? `<link rel="alternate" type="text/markdown" href="${ORIGIN}${item.markdownPath}">` : '') +
      `<script id="jsonld-page" type="application/ld+json">${JSON.stringify(item.schema).replace(/</g, '\\u003c')}</script><style id="static-seo-styles">${item.styles}</style>` };
    const document = injectDocument(html, metadata);
    const tree = parse5.parse(document, { sourceCodeLocationInfo: true });
    let app;
    function find(node) {
      if (node.tagName === 'app-root') app = node;
      for (const child of node.childNodes || []) find(child);
    }
    find(tree);
    if (!app?.sourceCodeLocation?.startTag || !app?.sourceCodeLocation?.endTag) throw new Error('SPA index has no app-root');
    return document.slice(0, app.sourceCodeLocation.startTag.endOffset) + item.html + document.slice(app.sourceCodeLocation.endTag.startOffset);
  }
  function respond(req, res, body, type, extra = {}) {
    res.writeHead(200, { 'Content-Type': type + '; charset=utf-8', 'Cache-Control': 'public, max-age=3600', 'X-Content-Type-Options': 'nosniff', ...extra });
    res.end(req.method === 'HEAD' ? undefined : body);
  }
  function handle(req, res, pathname) {
    const all = data();
    const slashless = pathname.length > 1 ? pathname.replace(/\/$/, '') : pathname;
    const alias = all.aliases[slashless] || (slashless !== pathname && all.pages.some(item => item.path === slashless) ? slashless : null);
    if (pathname === '/llm.txt' || alias) {
      res.writeHead(301, { Location: pathname === '/llm.txt' ? '/llms.txt' : alias, 'Cache-Control': 'public, max-age=3600' });
      res.end();
      return true;
    }
    if (pathname === '/robots.txt') {
      respond(req, res, `User-agent: *\nAllow: /\nDisallow: /api/\n\nSitemap: ${ORIGIN}/sitemap.xml\n`, 'text/plain');
      return true;
    }
    if (pathname === '/sitemap.xml') {
      respond(req, res, `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${all.pages.map(item => `  <url><loc>${escape(item.canonical)}</loc></url>`).join('\n')}\n</urlset>\n`, 'application/xml');
      return true;
    }
    if (pathname === '/llms.txt' || pathname === '/llms-full.txt') {
      respond(req, res, pathname === '/llms.txt' ? all.llms : all.llmsFull, 'text/plain', pathname === '/llms-full.txt' ? { 'X-Robots-Tag': 'noindex, follow' } : {});
      return true;
    }
    const markdown = all.pages.find(item => item.markdownPath === pathname);
    if (markdown) {
      respond(req, res, markdown.markdown, 'text/markdown', { Link: `<${markdown.canonical}>; rel="canonical"`, 'X-Robots-Tag': 'noindex, follow' });
      return true;
    }
    return false;
  }
  return { page, render, handle };
}

module.exports = { createStaticSeo };
