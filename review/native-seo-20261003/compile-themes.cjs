// Reproduce generate-themes.js without a child shell, for this restricted local environment.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { createRequire } = require('node:module');
const frontend = path.resolve(__dirname, '../../frontend');
const sass = createRequire(path.join(frontend, 'package.json'))('sass');
const output = path.join(frontend, '.theme-build');
fs.rmSync(output, { recursive: true, force: true });
fs.mkdirSync(output, { recursive: true });
const manifest = {};
for (const theme of ['contrast', 'softsimon', 'bukele', 'nymkappa']) {
  const css = sass.compile(path.join(frontend, `src/theme-${theme}.scss`), { style: 'compressed' }).css;
  const hash = crypto.createHash('md5').update(css).digest('hex').slice(0, 16);
  const filename = `${theme}.${hash}.css`;
  fs.writeFileSync(path.join(output, `${theme}.css`), css);
  fs.writeFileSync(path.join(output, filename), css);
  manifest[theme] = filename;
}
fs.writeFileSync(path.join(frontend, 'theme-manifest.json'), JSON.stringify(manifest, null, 2));
