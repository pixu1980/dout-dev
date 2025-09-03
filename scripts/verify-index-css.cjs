#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');

const indexPath = path.resolve(__dirname, '../dist/index.html');

if (!fs.existsSync(indexPath)) {
  console.error('❌ dist/index.html not found. Has the site been built?');
  process.exit(1);
}

const html = fs.readFileSync(indexPath, 'utf8');

// Look for link rel="stylesheet" href="/assets/*.css" or similar
const re =
  /<link\s+[^>]*rel=["']stylesheet["'][^>]*href=["']([^"']*assets\/[^"']*\.css)["'][^>]*>/i;
const m = html.match(re);

if (!m) {
  console.error('❌ No stylesheet link to /assets/*.css found in dist/index.html');
  process.exit(1);
}

console.log('✅ dist/index.html includes stylesheet:', m[1]);
process.exit(0);
