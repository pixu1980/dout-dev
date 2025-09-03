#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');

const manifestCandidates = [
  path.resolve(__dirname, '../dist/manifest.json'),
  path.resolve(__dirname, '../dist/.vite/manifest.json'),
];

let manifestPath = null;
for (const p of manifestCandidates) {
  if (fs.existsSync(p)) {
    manifestPath = p;
    break;
  }
}
if (!manifestPath) {
  console.error('❌ manifest.json not found in dist/.');
  process.exit(1);
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const cssFiles = Object.values(manifest)
  .map((e) => e.file || e.src)
  .filter(Boolean)
  .filter((f) => f.endsWith('.css'));
if (cssFiles.length === 0) {
  console.error('❌ No CSS entries in manifest.');
  process.exit(1);
}

const indexPath = path.resolve(__dirname, '../dist/index.html');
if (!fs.existsSync(indexPath)) {
  console.error('❌ dist/index.html not found.');
  process.exit(1);
}
const html = fs.readFileSync(indexPath, 'utf8');

// Check if any of the cssFiles is present in index.html
const matched = cssFiles.filter((f) => html.includes(f) || html.includes(`/${f}`));
if (matched.length === 0) {
  console.error('❌ None of the CSS assets from manifest are referenced in dist/index.html');
  console.error('Manifest CSS files:');
  for (const f of cssFiles) console.error('  -', f);
  process.exit(1);
}

console.log('✅ Manifest and index.html are consistent. Referenced CSS:', matched);
process.exit(0);
