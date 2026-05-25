import assert from 'node:assert/strict';
import { existsSync, rmSync } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { test } from 'node:test';
import sharp from 'sharp';
import { resolveConfig } from '../_config.js';
import { buildOgImages, getOgFallbackImagePath, getOgImagePath } from '../_og-image-generator.js';

const TMP = join(process.cwd(), 'test-tmp-og-images');

function normalizeSvgText(svg) {
  return svg
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

test('getOgImagePath returns deterministic paths', () => {
  assert.equal(getOgImagePath('post', 'Hello World'), '/assets/og/posts/hello-world.png');
  assert.equal(getOgImagePath('page', 'Archive'), '/assets/og/pages/archive.png');
  assert.equal(
    getOgFallbackImagePath('post', 'Hello World'),
    '/assets/og/posts/hello-world-card.png'
  );
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
  assert.ok(existsSync(join(TMP, 'posts', 'hello-world-card.png')));
  assert.ok(firstManifest.entries['post:hello-world']);
  assert.equal(
    firstManifest.entries['post:hello-world'].fallbackPngPath,
    '/assets/og/posts/hello-world-card.png'
  );
  const fallbackMetadata = await sharp(join(TMP, 'posts', 'hello-world-card.png')).metadata();
  assert.equal(fallbackMetadata.width, 1200);
  assert.equal(fallbackMetadata.height, 900);
  assert.ok(firstManifest.version >= 2);
  const postSvg = await readFile(join(TMP, 'posts', 'hello-world.svg'), 'utf8');
  assert.match(postSvg, /id="paperTexture"/);
  assert.match(postSvg, /id="accentSweep"/);
  assert.match(postSvg, /id="dotGrid"/);
  assert.match(postSvg, /EDITORIAL/);
  assert.doesNotMatch(postSvg, /<circle/);
  assert.doesNotMatch(postSvg, /letter-spacing="-/);
  assert.equal('generatedAt' in JSON.parse(firstManifestRaw), false);

  await writeFile(join(TMP, 'stale.txt'), 'stale', 'utf8');
  await buildOgImages({ dataset, config, outputDir: TMP });
  const secondManifestRaw = await readFile(join(TMP, 'manifest.json'), 'utf8');

  assert.equal(existsSync(join(TMP, 'stale.txt')), false);
  assert.equal(secondManifestRaw, firstManifestRaw);
  rmSync(TMP, { recursive: true, force: true });
});

test('buildOgImages renders archive badge and description copy', async () => {
  rmSync(TMP, { recursive: true, force: true });

  const config = resolveConfig({
    SITE_META: {
      title: 'dout.dev',
      description: 'Example description',
      url: 'https://dout.dev',
    },
  });

  const dataset = {
    posts: [],
    tags: [{ key: 'ai-copilot', slug: 'ai-copilot', label: 'Ai-copilot', name: 'Ai-copilot' }],
    months: [{ key: '2026-04', slug: '2026-04', label: 'April 2026', name: 'April 2026' }],
    series: [{ slug: 'system-notes', title: 'System Notes', description: 'Series description' }],
  };

  await buildOgImages({ dataset, config, outputDir: TMP });

  const tagSvg = await readFile(join(TMP, 'tags', 'ai-copilot.svg'), 'utf8');
  const monthSvg = await readFile(join(TMP, 'months', '2026-04.svg'), 'utf8');
  const seriesSvg = await readFile(join(TMP, 'series', 'system-notes.svg'), 'utf8');
  const tagText = normalizeSvgText(tagSvg);
  const monthText = normalizeSvgText(monthSvg);
  const seriesText = normalizeSvgText(seriesSvg);

  assert.match(monthSvg, /<rect x="128" y="118" width="260" height="42" rx="21"/);
  assert.doesNotMatch(tagSvg, />TOPIC<\/text>/);
  assert.match(tagText, /Posts tagged with Ai-copilot\./);
  assert.match(tagText, /Follow related posts across the full archive\./);
  assert.match(monthText, /Everything published in April 2026\./);
  assert.match(monthText, /Follow related posts across the full archive\./);
  assert.match(seriesText, /Series description\./);
  assert.match(seriesText, /Follow related posts across the full archive\./);

  rmSync(TMP, { recursive: true, force: true });
});

test('buildOgImages renders post front matter description before first h2', async () => {
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
      {
        name: 'hello-world',
        title: 'Hello World',
        published: true,
        description: 'Front matter summary for social cards.',
        excerpt: 'The first h2 should not be first anymore.',
        toc: [{ level: 2, text: 'The first h2 should not be first anymore' }],
      },
    ],
    tags: [],
    months: [],
    series: [],
  };

  await buildOgImages({ dataset, config, outputDir: TMP });

  const postSvg = await readFile(join(TMP, 'posts', 'hello-world.svg'), 'utf8');
  const descriptionIndex = postSvg.indexOf('Front matter summary for social cards.');
  const headingIndex = postSvg.indexOf('The first h2 should not be first anymore');

  assert.ok(descriptionIndex > -1);
  assert.ok(headingIndex > descriptionIndex);
  assert.match(
    postSvg,
    /Front matter summary for social cards\.<\/tspan><tspan x="142" dy="38">The first h2/
  );

  rmSync(TMP, { recursive: true, force: true });
});
