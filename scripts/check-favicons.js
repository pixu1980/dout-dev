#!/usr/bin/env node

import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, basename } from 'node:path';

const _projectRoot = new URL('..', import.meta.url).pathname.replace(/\/$/, '');

function extractAssetPathsFromMarkups(markups) {
  const re = /href="([^"]+)"|src="([^"]+)"/g;
  const paths = new Set();
  for (const markup of markups) {
    let m;
    while ((m = re.exec(markup)) !== null) {
      const candidate = m[1] || m[2];
      if (!candidate) continue;
      if (candidate.startsWith('http://') || candidate.startsWith('https://')) continue;
      paths.add(candidate.replace(/^\//, ''));
    }
  }
  return Array.from(paths);
}

async function main() {
  try {
    const raw = await readFile(new URL('../favicon.data.json', import.meta.url), 'utf8');
    const data = JSON.parse(raw);
    const markups = Array.isArray(data.markups) ? data.markups : [];
    const assetPaths = extractAssetPathsFromMarkups(markups);

    const missing = [];
    for (const p of assetPaths) {
      // check inside src/assets first
      const absInSrc = join(process.cwd(), 'src', 'assets', basename(p));
      const absInRoot = join(process.cwd(), basename(p));
      if (!existsSync(absInSrc) && !existsSync(absInRoot)) {
        missing.push(p);
      }
    }

    if (missing.length > 0) {
      console.error('❌ Missing favicon assets:');
      for (const m of missing) console.error('  -', m);
      process.exit(1);
    }

    console.log('✅ All favicon assets present');
    process.exit(0);
  } catch (err) {
    console.error('⚠️  Could not verify favicons:', err.message);
    process.exit(2);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) main();
