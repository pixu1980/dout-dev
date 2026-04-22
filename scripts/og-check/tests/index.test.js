import assert from 'node:assert/strict';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, before, describe, test } from 'node:test';

import { inspectUrl, renderPreview, scanHtml, validateScanResult } from '../index.js';
import { __testStartStaticServer, validateOpenGraph } from '../../linting/validate-opengraph.js';

describe('og-check internal library', () => {
  test('scanHtml collects title and namespaced meta tags', () => {
    const scan = scanHtml(`
      <title>Hello &amp; Welcome</title>
      <meta property="og:title" content="Hello" />
      <meta property="og:image" content="https://example.com/image.png" />
      <meta property="og:type" content="website" />
      <meta property="og:url" content="https://example.com" />
      <meta name="twitter:card" content="summary_large_image" />
    `);

    assert.equal(scan.title, 'Hello & Welcome');
    assert.equal(scan.metaTags.length, 5);
    assert.equal(scan.lookup.get('og:title')?.namespace, 'og');
    assert.equal(scan.lookup.get('twitter:card')?.namespace, 'twitter');
  });

  test('validateScanResult flags missing required OpenGraph fields', async () => {
    const scan = scanHtml('<meta property="og:title" content="Hello" />');
    const validation = await validateScanResult(scan, {
      checkUrlStatus: false,
      outputFormat: 'opengraph',
    });

    assert.equal(validation.status, 'errors');
    assert.ok(validation.errors.some((issue) => issue.field === 'og:image'));
    assert.ok(validation.errors.some((issue) => issue.field === 'og:type'));
    assert.ok(validation.errors.some((issue) => issue.field === 'og:url'));
  });

  test('twitter preview falls back to OpenGraph fields', () => {
    const scan = scanHtml(`
      <title>Fallback</title>
      <meta property="og:title" content="OG Title" />
      <meta property="og:image" content="https://example.com/image.png" />
      <meta property="og:type" content="website" />
      <meta property="og:url" content="https://example.com" />
      <meta name="twitter:card" content="summary_large_image" />
    `);

    const preview = renderPreview(scan, {
      outputFormat: 'twitter',
      url: 'https://example.com',
    });

    assert.match(preview, /Title: OG Title/);
    assert.match(preview, /Image: https:\/\/example.com\/image.png/);
  });
});

describe('og-check localhost flow', () => {
  let fixtureRoot = '';

  before(async () => {
    fixtureRoot = await mkdtemp(join(tmpdir(), 'dout-og-check-'));
    await mkdir(join(fixtureRoot, 'assets', 'og', 'pages'), { recursive: true });

    await writeFile(
      join(fixtureRoot, 'index.html'),
      `<!doctype html>
      <html lang="en">
        <head>
          <title>Example</title>
          <meta property="og:title" content="Example" />
          <meta property="og:description" content="Example description" />
          <meta property="og:image" content="https://dout.dev/assets/og/pages/home.png" />
          <meta property="og:type" content="website" />
          <meta property="og:url" content="https://dout.dev/" />
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content="Example" />
          <meta name="twitter:image" content="https://dout.dev/assets/og/pages/home.png" />
        </head>
        <body><h1>Example</h1></body>
      </html>`,
      'utf8'
    );

    await writeFile(join(fixtureRoot, 'assets', 'og', 'pages', 'home.png'), 'png', 'utf8');
  });

  after(async () => {
    if (!fixtureRoot) return;
    await rm(fixtureRoot, { force: true, recursive: true });
  });

  test('validateOpenGraph checks a local site through localhost', async () => {
    const result = await validateOpenGraph(fixtureRoot);
    assert.equal(result.success, true);
    assert.equal(result.errorCount, 0);
    assert.equal(result.pagesChecked, 1);
  });

  test('inspectUrl validates rewritten local assets', async () => {
    const server = await __testStartStaticServer(fixtureRoot);

    try {
      const result = await inspectUrl(`${server.origin}/`, {
        outputFormat: 'none',
        rewriteOrigins: [{ from: 'https://dout.dev', to: server.origin }],
      });

      assert.equal(result.validation.status, 'success');
    } finally {
      await server.close();
    }
  });
});
