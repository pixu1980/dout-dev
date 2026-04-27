#!/usr/bin/env node
// CMS Clean - removes generated output (test-friendly version)
import { join } from 'node:path';
import { resolveConfig } from './_config.js';
import { removePath } from './_utils.js';

export function clean(userConfig = {}) {
  const cfg = resolveConfig(userConfig);
  const srcDir = cfg.srcDir || 'src';
  removePath(cfg.postsOutputDir);
  removePath(cfg.tagsOutputDir);
  removePath(cfg.monthsOutputDir);
  removePath(cfg.seriesOutputDir);
  removePath(join(cfg.dataDir, 'posts.json'));
  removePath(join(cfg.dataDir, 'tags.json'));
  removePath(join(cfg.dataDir, 'months.json'));
  removePath(join(cfg.dataDir, 'series.json'));
  removePath(join(srcDir, 'data', 'posts.json'));
  removePath(join(srcDir, 'data', 'tags.json'));
  removePath(join(srcDir, 'data', 'months.json'));
  removePath(join(srcDir, 'data', 'series.json'));
  removePath(join(srcDir, 'feed.rss'));
  removePath(join(srcDir, 'feed.json'));
  removePath(join(srcDir, 'feed.xml'));
  removePath(join(srcDir, 'sitemap.xml'));
}

if (import.meta.url === `file://${process.argv[1]}`) clean();
