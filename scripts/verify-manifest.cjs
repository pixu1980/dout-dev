#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');

const candidates = [
  path.resolve(__dirname, '../dist/manifest.json'),
  path.resolve(__dirname, '../dist/.vite/manifest.json'),
];

let manifestPath = null;
for (const p of candidates) {
  if (fs.existsSync(p)) {
    manifestPath = p;
    break;
  }
}

if (!manifestPath) {
  console.error('❌ manifest.json not found in dist/. Did the build generate a manifest?');
  process.exit(1);
}

let manifest;
try {
  manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
} catch (err) {
  console.error('❌ Failed to parse manifest.json:', err.message);
  process.exit(1);
}

const cssAssets = Object.values(manifest).filter((entry) => {
  if (!entry || typeof entry !== 'object') return false;
  const file = entry.file || entry.src || '';
  return typeof file === 'string' && file.endsWith('.css');
});

if (cssAssets.length === 0) {
  console.error(
    '❌ No CSS assets found in dist/manifest.json — build may have missed CSS extraction.'
  );
  process.exit(1);
}

console.log('✅ Manifest verification passed — CSS assets found:');
cssAssets.forEach((a) => {
  console.log('  -', a.file || a.src);
});
process.exit(0);
