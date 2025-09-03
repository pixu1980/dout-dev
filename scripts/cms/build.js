#!/usr/bin/env node
// CMS Build - orchestrates scan and page generation
import { scanContent } from './scan.js';
import { generatePages, buildRssFeed } from './page-generator.js';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { resolveConfig } from './config.js';

export function build(userConfig = {}) {
  const config = resolveConfig(userConfig);
  const dataset = scanContent(config);
  generatePages(dataset, config);
  // Generate global site RSS feed (latest posts)
  try {
    const posts = (dataset.posts || [])
      .filter((p) => p.published)
      .sort((a, b) => new Date(b.date) - new Date(a.date));
    const xml = buildRssFeed({
      title: `${config.SITE_META.title} — Latest Posts`,
      link: `${config.SITE_META.url}/`,
      description: config.SITE_META.description,
      items: posts,
      siteUrl: config.SITE_META.url,
    });
    writeFileSync(join('src', 'feed.xml'), xml, 'utf8');
  } catch (e) {
    console.warn('Warning: failed to generate global feed.xml', e?.message || e);
  }
  return dataset;
}

export async function main() {
  try {
    const dataset = build();
    console.log(
      `Built ${dataset.posts.length} posts, ${dataset.tags.length} tags, ${dataset.months.length} months, ${dataset.series.length} series`
    );
    process.exit(0);
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
