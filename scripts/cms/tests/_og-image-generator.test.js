import assert from 'node:assert/strict';
import { existsSync, rmSync } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { test } from 'node:test';
import { resolveConfig } from '../_config.js';
import { buildOgImages, getOgImagePath } from '../_og-image-generator.js';

const TMP = join(process.cwd(), 'test-tmp-og-images');

test('getOgImagePath returns deterministic paths', () => {
  assert.equal(getOgImagePath('post', 'Hello World'), '/assets/og/posts/hello-world.png');
  assert.equal(getOgImagePath('page', 'Archive'), '/assets/og/pages/archive.png');
});

test('buildOgImages writes manifest entries and removes stale files', async () => {
  rmSync(TMP, { recursive: true, force: true });

  const config = resolveConfig({
    SITE_META: {
      title: 'dout.dev',
      description: 'Example description',
      url: 'https://dout.dev',
    },
  });

  const dataset = {
    posts: [
      { name: 'hello-world', title: 'Hello World', published: true, excerpt: 'Example excerpt' },
    ],
    tags: [{ key: 'css', slug: 'css', label: 'CSS', name: 'CSS' }],
    months: [{ key: '2026-04', slug: '2026-04', label: 'April 2026', name: 'April 2026' }],
    series: [{ slug: 'system-notes', title: 'System Notes', description: 'Series description' }],
  };

  const firstManifest = await buildOgImages({ dataset, config, outputDir: TMP });
  const firstManifestRaw = await readFile(join(TMP, 'manifest.json'), 'utf8');
  assert.ok(existsSync(join(TMP, 'manifest.json')));
  assert.ok(existsSync(join(TMP, 'posts', 'hello-world.png')));
  assert.ok(firstManifest.entries['post:hello-world']);
  assert.equal('generatedAt' in JSON.parse(firstManifestRaw), false);

  await writeFile(join(TMP, 'stale.txt'), 'stale', 'utf8');
  await buildOgImages({ dataset, config, outputDir: TMP });
  const secondManifestRaw = await readFile(join(TMP, 'manifest.json'), 'utf8');

  assert.equal(existsSync(join(TMP, 'stale.txt')), false);
  assert.equal(secondManifestRaw, firstManifestRaw);
  rmSync(TMP, { recursive: true, force: true });
});
