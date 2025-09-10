#!/usr/bin/env node
// CMS Build - orchestrates scan and page generation
import { scanContent } from './scan.js';
import { buildOgImages } from './og-image-generator.js';
import { generatePages, buildJsonFeed, buildRssFeed, buildSitemap } from './page-generator.js';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { resolveConfig } from './config.js';

export async function build(userConfig = {}) {
  const config = resolveConfig(userConfig);
  const dataset = scanContent(config);
  await buildOgImages({ dataset, config });
  generatePages(dataset, config);
  // Emit searchable JSON indexes under src/data for client-side features (e.g., M10 Search)
  try {
    const outDir = join('src', 'data');
    mkdirSync(outDir, { recursive: true });
    writeFileSync(join(outDir, 'posts.json'), JSON.stringify(dataset.posts, null, 2), 'utf8');
    writeFileSync(join(outDir, 'tags.json'), JSON.stringify(dataset.tags, null, 2), 'utf8');
    writeFileSync(join(outDir, 'months.json'), JSON.stringify(dataset.months, null, 2), 'utf8');
    writeFileSync(join(outDir, 'series.json'), JSON.stringify(dataset.series, null, 2), 'utf8');
  } catch (e) {
    console.warn('Warning: failed to write search indexes to src/data', e?.message || e);
  }
  // Generate global site RSS feed (latest posts)
  try {
    const posts = (dataset.posts || [])
      .filter((p) => p.published)
      .sort((a, b) => new Date(b.date) - new Date(a.date));
    const rssPath = config.SITE_META.rssFeedPath || '/feed.rss';
    const jsonFeedPath = config.SITE_META.jsonFeedPath || '/feed.json';
    const legacyRssFeedPath = config.SITE_META.legacyRssFeedPath || '/feed.xml';
    const xml = buildRssFeed({
      title: `${config.SITE_META.title} — Latest Posts`,
      link: `${config.SITE_META.url}/`,
      description: config.SITE_META.description,
      items: posts,
      siteUrl: config.SITE_META.url,
      feedUrl: `${config.SITE_META.url}${rssPath}`,
      language: config.SITE_META.language,
    });
    const json = buildJsonFeed({
      title: `${config.SITE_META.title} — Latest Posts`,
      homePageUrl: `${config.SITE_META.url}/`,
      feedUrl: `${config.SITE_META.url}${jsonFeedPath}`,
      description: config.SITE_META.description,
      items: posts,
      siteUrl: config.SITE_META.url,
      author: config.SITE_META.author,
      language: config.SITE_META.language,
    });
    writeFileSync(join('src', rssPath.replace(/^\//, '')), xml, 'utf8');
    writeFileSync(join('src', legacyRssFeedPath.replace(/^\//, '')), xml, 'utf8');
    writeFileSync(join('src', jsonFeedPath.replace(/^\//, '')), json, 'utf8');
  } catch (e) {
    console.warn('Warning: failed to generate global feeds', e?.message || e);
  }
  try {
    const sitemap = buildSitemap({ dataset, siteUrl: config.SITE_META.url });
    writeFileSync(join('src', 'sitemap.xml'), sitemap, 'utf8');
  } catch (e) {
    console.warn('Warning: failed to generate sitemap.xml', e?.message || e);
  }
  return dataset;
}

export async function main() {
  try {
    const dataset = await build();
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
