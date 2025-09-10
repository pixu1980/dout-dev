#!/usr/bin/env node
// CMS Watch - rebuilds on changes
import { watch } from 'node:fs';
import { build } from './build.js';
import { resolveConfig } from './config.js';

export function startWatch(userConfig = {}, onBuild = () => {}) {
  const cfg = resolveConfig(userConfig);
  let timer = null;
  const trigger = () => {
    clearTimeout(timer);
    timer = setTimeout(async () => {
      try {
        const dataset = await build(cfg);
        onBuild(dataset);
      } catch (error) {
        console.error('Watch rebuild failed:', error?.message || error);
      }
    }, 80);
  };
  const w = watch(cfg.contentDir, { recursive: true }, trigger);
  trigger();
  return w;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('Watching content (CMS)...');
  startWatch();
}
