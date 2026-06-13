export * from './_release.js';

import { release } from './_release.js';

if (import.meta.url === `file://${process.argv[1]}`) {
  if (process.argv[2]) {
    console.error('Usage: node scripts/release/index.js');
    process.exit(1);
  }

  release();
}
