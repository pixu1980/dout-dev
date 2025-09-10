import { test, describe } from 'node:test';
import assert from 'node:assert';
import { defaultConfig, resolveConfig } from '../config.js';

describe('config', () => {
  test('should provide default configuration', () => {
    assert.strictEqual(typeof defaultConfig, 'object');
    assert.strictEqual(defaultConfig.contentDir, 'data/posts');
    assert.strictEqual(defaultConfig.dataDir, 'data');
    assert.strictEqual(defaultConfig.postsOutputDir, 'src/posts');
    assert.strictEqual(defaultConfig.tagsOutputDir, 'src/tags');
    assert.strictEqual(defaultConfig.monthsOutputDir, 'src/months');
    assert.strictEqual(defaultConfig.PAGE_SIZE, 10);
    assert.strictEqual(defaultConfig.site.baseUrl, '/');
    assert.strictEqual(defaultConfig.SITE_META.title, 'dout.dev');
    assert.strictEqual(defaultConfig.SITE_META.language, 'en');
  });

  test('should resolve config without overrides', () => {
    const config = resolveConfig();

    // Should return same values as default
    assert.strictEqual(config.contentDir, 'data/posts');
    assert.strictEqual(config.dataDir, 'data');
    assert.strictEqual(config.PAGE_SIZE, 10);
    assert.strictEqual(config.site.baseUrl, '/');
    assert.strictEqual(config.SITE_META.title, 'dout.dev');
    assert.strictEqual(config.SITE_META.author, 'Emiliano "pixu1980" Pisu');
  });

  test('should resolve config with simple overrides', () => {
    const config = resolveConfig({
      contentDir: 'custom/posts',
      PAGE_SIZE: 20,
    });

    // Overridden values
    assert.strictEqual(config.contentDir, 'custom/posts');
    assert.strictEqual(config.PAGE_SIZE, 20);

    // Default values should remain
    assert.strictEqual(config.dataDir, 'data');
    assert.strictEqual(config.postsOutputDir, 'src/posts');
    assert.strictEqual(config.site.baseUrl, '/');
    assert.strictEqual(config.SITE_META.title, 'dout.dev');
  });

  test('should resolve config with nested site overrides', () => {
    const config = resolveConfig({
      site: {
        baseUrl: '/blog/',
      },
    });

    // Overridden nested value
    assert.strictEqual(config.site.baseUrl, '/blog/');

    // Other values should remain default
    assert.strictEqual(config.contentDir, 'data/posts');
    assert.strictEqual(config.PAGE_SIZE, 10);
    assert.strictEqual(config.SITE_META.title, 'dout.dev');
  });

  test('should resolve config with nested SITE_META overrides', () => {
    const config = resolveConfig({
      SITE_META: {
        title: 'My Custom Blog',
        language: 'it',
      },
    });

    // Overridden nested values
    assert.strictEqual(config.SITE_META.title, 'My Custom Blog');
    assert.strictEqual(config.SITE_META.language, 'it');

    // Other SITE_META values should remain default
    assert.strictEqual(config.SITE_META.author, 'Emiliano "pixu1980" Pisu');
    assert.strictEqual(config.SITE_META.url, 'https://dout.dev');

    // Other config values should remain default
    assert.strictEqual(config.contentDir, 'data/posts');
    assert.strictEqual(config.site.baseUrl, '/');
  });

  test('should keep header-only CSP directives out of the HTML meta policy', () => {
    const config = resolveConfig();

    assert.ok(config.SITE_META.security.csp.includes("default-src 'self'"));
    assert.ok(!config.SITE_META.security.csp.includes('frame-ancestors'));
    assert.ok(!config.SITE_META.security.csp.includes('upgrade-insecure-requests'));
    assert.ok(config.SITE_META.security.headerCsp.includes("frame-ancestors 'none'"));
    assert.ok(config.SITE_META.security.headerCsp.includes('upgrade-insecure-requests'));
  });
});
