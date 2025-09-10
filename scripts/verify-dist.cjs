#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');

const distDir = path.resolve(__dirname, '../dist');

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walk(full));
    } else {
      files.push(full);
    }
  }
  return files;
}

if (!fs.existsSync(distDir)) {
  console.error('dist/ is missing. Run the build first.');
  process.exit(1);
}

const requiredFiles = [
  '_headers',
  'index.html',
  'archive.html',
  'about.html',
  'privacy.html',
  'search.html',
  'feed.rss',
  'feed.json',
  'feed.xml',
  'sitemap.xml',
  'data/posts.json',
  'data/tags.json',
  'data/months.json',
  'data/series.json',
  'CNAME',
  'robots.txt',
  'manifest.json',
  'sw.js',
];

const missing = requiredFiles.filter((file) => !fs.existsSync(path.join(distDir, file)));
const htmlFiles = walk(distDir).filter((file) => file.endsWith('.html'));
const unresolved = htmlFiles.filter((file) => {
  const html = fs.readFileSync(file, 'utf8');
  return /<(extends|block|include|if|for|switch|case|default)\b/i.test(html);
});

const tagFeeds = walk(path.join(distDir, 'tags')).filter((file) => file.endsWith('.xml'));
const monthFeeds = walk(path.join(distDir, 'months')).filter((file) => file.endsWith('.xml'));

if (!tagFeeds.length) missing.push('tags/*.xml');
if (!monthFeeds.length) missing.push('months/*.xml');

if (missing.length || unresolved.length) {
  if (missing.length) {
    console.error('Missing deploy artifacts:');
    for (const item of missing) console.error(`- ${item}`);
  }
  if (unresolved.length) {
    console.error('Unresolved template directives remain in built HTML:');
    for (const item of unresolved) console.error(`- ${path.relative(distDir, item)}`);
  }
  process.exit(1);
}

console.log(
  `Verified dist artifact (${htmlFiles.length} HTML files, feeds, search data, CNAME, service worker).`
);
