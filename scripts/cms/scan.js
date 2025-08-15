#!/usr/bin/env node
// CMS Scan - reads markdown and generates dataset + JSON
import { join, relative } from 'node:path';
import { resolveConfig } from './config.js';
import { processMarkdown } from './post-processor.js';
import { scanDirRecursive, readFile, writeJson, ensureDir } from './utils.js';

export function scanContent(userConfig = {}) {
  const config = resolveConfig(userConfig);
  const files = scanDirRecursive(config.contentDir, ['.md']);
  const posts = files.map((f) => {
    const raw = readFile(f);
    const post = processMarkdown(f, raw);
    post.source = relative(process.cwd(), f);
    post.path = `./${config.postsOutputDir}/${post.name}.html`;
    post.tags = post.tags.map((t) => ({ ...t, url: `./tags/${t.key}.html` }));
    return post;
  });
  const published = posts.filter((p) => p.published);
  const tagsMap = new Map();
  for (const p of published) {
    for (const t of p.tags) {
      if (!tagsMap.has(t.key)) tagsMap.set(t.key, { key: t.key, label: t.label, posts: [] });
      tagsMap.get(t.key).posts.push(minPost(p));
    }
  }
  const tags = [...tagsMap.values()].map((t) => ({ ...t, url: `./tags/${t.key}.html`, count: t.posts.length }));
  const monthsMap = new Map();
  for (const p of published) {
    if (!p.date) continue;
    const d = new Date(p.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (!monthsMap.has(key)) monthsMap.set(key, { key, label: d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }), year: d.getFullYear(), month: d.getMonth() + 1, posts: [] });
    monthsMap.get(key).posts.push(minPost(p));
  }
  const months = [...monthsMap.values()].map((m) => ({ ...m, url: `./months/${m.key}.html`, count: m.posts.length, from: m.posts[0]?.date || null, to: m.posts[m.posts.length - 1]?.date || null }));
  ensureDir(config.dataDir);
  writeJson(join(config.dataDir, 'posts.json'), posts);
  writeJson(join(config.dataDir, 'tags.json'), tags);
  writeJson(join(config.dataDir, 'months.json'), months);
  return { posts, tags, months };
}
function minPost(p) { return { name: p.name, title: p.title, date: p.date, dateString: p.dateString, path: p.path, excerpt: p.excerpt, tags: p.tags, pinned: p.pinned }; }
if (import.meta.url === `file://${process.argv[1]}`) { scanContent(); }
