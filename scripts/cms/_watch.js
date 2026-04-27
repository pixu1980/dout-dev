#!/usr/bin/env node
// CMS Watch - rebuilds on changes
import { watch } from 'node:fs';
import { build } from './_build.js';
import { resolveConfig } from './_config.js';

export function startWatch(userConfig = {}, onBuild = () => {}) {
  const cfg = resolveConfig(userConfig);
  const watchRecursive = cfg.watchRecursive ?? true;
  const watchFactory =
    cfg.watchFactory || ((contentDir, options, listener) => watch(contentDir, options, listener));
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
  let w;
  try {
    w = watchFactory(cfg.contentDir, { recursive: watchRecursive }, trigger);
  } catch (error) {
    if (
      cfg.watchFactory ||
      !watchRecursive ||
      (error?.code !== 'EMFILE' && error?.code !== 'ERR_FEATURE_UNAVAILABLE_ON_PLATFORM')
    ) {
      throw error;
    }

    console.warn(`Watch fallback for ${cfg.contentDir}: ${error.code}`);
    w = watch(cfg.contentDir, trigger);
  }

  const close = w.close.bind(w);
  w.close = () => {
    clearTimeout(timer);
    close();
  };

  trigger();
  return w;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('Watching content (CMS)...');
  startWatch();
}
