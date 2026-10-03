// Build-time helpers: preserve existing page content, never fetch providers.
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const parse5 = require('parse5');
const sass = require('sass');

const escapeHtml = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);

function loadData(filename) {
  const output = ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const loaded = new Module(filename, module);
  loaded.filename = filename;
  loaded.paths = Module._nodeModulePaths(path.dirname(filename));
  loaded._compile(output, filename);
  return loaded.exports;
}

function renderTemplate(source, values = {}) {
  const html = source.replace(/{{\s*(\w+)\s*}}/g, (match, key) => {
    if (!(key in values)) throw new Error(`Unresolved static template binding: ${key}`);
    return escapeHtml(values[key]);
  });
  const fragment = parse5.parseFragment(html);
  function visit(node) {
    if (node.attrs) {
      const route = node.attrs.find(attr => attr.name === 'routerlink' || attr.name === '[routerlink]');
      if (route) {
        const href = route.name === 'routerlink' ? route.value : route.value.match(/['"]([^'"]+)['"]/)?.[1];
        if (!href) throw new Error(`Unresolved router link: ${route.value}`);
        node.attrs.push({ name: 'href', value: href });
      }
      node.attrs = node.attrs.filter(attr => !['[', '(', '*'].includes(attr.name[0]) && !attr.name.startsWith('i18n') && attr.name !== 'routerlink');
    }
    for (const child of node.childNodes || []) visit(child);
  }
  visit(fragment);
  return parse5.serialize(fragment);
}

function htmlToMarkdown(html) {
  const tree = parse5.parseFragment(html);
  function convert(node) {
    if (node.nodeName === '#text') return node.value;
    const text = (node.childNodes || []).map(convert).join('');
    const tag = node.tagName;
    const attr = name => node.attrs?.find(value => value.name === name)?.value;
    if (/^h[1-6]$/.test(tag || '')) return `\n\n${'#'.repeat(Number(tag[1]))} ${text.trim()}\n\n`;
    if (tag === 'a') return attr('href') ? `[${text.trim()}](${attr('href')})` : text;
    if (tag === 'pre') return `\n\n\`\`\`\n${(node.childNodes || []).map(child => child.tagName === 'code' ? (child.childNodes || []).map(convert).join('') : convert(child)).join('').trim()}\n\`\`\`\n\n`;
    if (tag === 'code') return `\`${text}\``;
    if (tag === 'strong' || tag === 'b') return `**${text}**`;
    if (tag === 'em' || tag === 'i') return `_${text}_`;
    if (tag === 'li') return `\n- ${text.trim()}`;
    if (tag === 'br') return '\n';
    if (tag === 'sup') return `<sup>${text}</sup>`;
    if (['script', 'style', 'img'].includes(tag)) return '';
    if (['p', 'article', 'section', 'main', 'div', 'aside', 'ul', 'ol'].includes(tag)) return `\n\n${attr('id') ? `<a id="${attr('id')}"></a>\n\n` : ''}${text.trim()}\n\n`;
    return text;
  }
  return convert(tree).replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim() + '\n';
}

function styleBlock(filename, selector) {
  const source = fs.readFileSync(filename, 'utf8').replace(/:host-context\(([^)]+)\)/g, '$1 &').replace(/:host\b/g, '&').replace(/::ng-deep\s*/g, '');
  return sass.compileString(`${selector} { ${source} }`, { style: 'compressed' }).css;
}

module.exports = { escapeHtml, loadData, renderTemplate, htmlToMarkdown, styleBlock };
