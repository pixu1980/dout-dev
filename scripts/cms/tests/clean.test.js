import { test } from 'node:test';
import assert from 'node:assert/strict';
import { writeFileSync, rmSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { clean } from '../../cms/clean.js';

const TMP = 'test-tmp-cms-clean';

test('clean removes json outputs', () => {
  rmSync(TMP, { force: true, recursive: true });
  const dataDir = join(TMP, 'data');
  mkdirSync(dataDir, { recursive: true });
  writeFileSync(join(dataDir, 'posts.json'), '[]');
  clean({ dataDir, postsOutputDir: join(TMP, 'out/posts'), tagsOutputDir: join(TMP, 'out/tags'), monthsOutputDir: join(TMP, 'out/months') });
  assert.equal(existsSync(join(dataDir, 'posts.json')), false);
  rmSync(TMP, { recursive: true, force: true });
});
