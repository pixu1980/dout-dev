// CMS Page Generator - generates basic HTML pages
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { ensureDir } from './utils.js';
import { TemplateRenderer } from '../template-engine/renderer.js';

export function generatePages(dataset, config) {
  const renderer = new TemplateRenderer(process.cwd());
  generatePosts(dataset.posts, config, renderer);
  generateGroups(dataset.tags, config.tagsOutputDir, 'Tag', renderer, (t) => t.key);
  generateGroups(dataset.months, config.monthsOutputDir, 'Month', renderer, (m) => m.key);
}

function generatePosts(posts, config, renderer) {
  for (const post of posts) {
    if (!post.published) continue;
    const tpl = `<!DOCTYPE html><html><head><meta charset='utf-8'><title>{{ title }}</title></head><body><article><h1>{{ title }}</h1><div>{{ content | raw }}</div></article></body></html>`;
    const html = renderer.renderString(tpl, post);
    ensureDir(config.postsOutputDir);
    writeFileSync(join(config.postsOutputDir, `${post.name}.html`), html, 'utf8');
  }
}

function generateGroups(arr, outDir, labelPrefix, renderer, keyFn) {
  for (const g of arr) {
    const list = g.posts.map((p) => `<li><a href="../posts/${p.name}.html">${escapeHtml(p.title)}</a></li>`).join('');
    const tpl = `<!DOCTYPE html><html><head><meta charset='utf-8'><title>${labelPrefix}: {{ label }}</title></head><body><section><h1>${labelPrefix}: {{ label }}</h1><ul>${list}</ul></section></body></html>`;
    const html = renderer.renderString(tpl, g);
    ensureDir(outDir);
    writeFileSync(join(outDir, `${keyFn(g)}.html`), html, 'utf8');
  }
}

function escapeHtml(str) { return String(str).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#x27;' }[c])); }
