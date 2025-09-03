#!/usr/bin/env node
// CMS Clean - removes generated output (test-friendly version)
import { join } from 'node:path';
import { resolveConfig } from './config.js';
import { removePath } from './utils.js';

export function clean(userConfig = {}) {
  const cfg = resolveConfig(userConfig);
  removePath(cfg.postsOutputDir);
  removePath(cfg.tagsOutputDir);
  removePath(cfg.monthsOutputDir);
  removePath(cfg.seriesOutputDir);
  removePath(join(cfg.dataDir, 'posts.json'));
  removePath(join(cfg.dataDir, 'tags.json'));
  removePath(join(cfg.dataDir, 'months.json'));
  removePath(join(cfg.dataDir, 'series.json'));
}

if (import.meta.url === `file://${process.argv[1]}`) clean();
