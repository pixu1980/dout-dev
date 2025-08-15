import { test, describe } from 'node:test';
import assert from 'node:assert';
import { scanContent } from '../scan.js';

describe('scan', () => {
  test('should scan content and return dataset structure', () => {
    const result = scanContent();

    // Should return object with required structure
    assert.strictEqual(typeof result, 'object');
    assert.ok(Array.isArray(result.posts));
    assert.ok(Array.isArray(result.tags));
    assert.ok(Array.isArray(result.months));

    // Should have some posts from data folder
    assert.ok(result.posts.length > 0);
  });

  test('should process posts with correct properties', () => {
    const result = scanContent();
    const firstPost = result.posts[0];

    // Post should have required properties
    assert.ok(typeof firstPost.name === 'string');
    assert.ok(typeof firstPost.title === 'string');
    assert.ok(typeof firstPost.published === 'boolean');
    assert.ok(typeof firstPost.content === 'string');
    assert.ok(typeof firstPost.excerpt === 'string');
    assert.ok(typeof firstPost.source === 'string');
    assert.ok(typeof firstPost.path === 'string');
    assert.ok(Array.isArray(firstPost.tags));

    // Path should be correctly formatted
    assert.ok(firstPost.path.includes('./src/posts/'));
    assert.ok(firstPost.path.endsWith('.html'));
  });

  test('should generate tags with correct structure', () => {
    const result = scanContent();

    if (result.tags.length > 0) {
      const firstTag = result.tags[0];

      // Tag should have required properties
      assert.ok(typeof firstTag.key === 'string');
      assert.ok(typeof firstTag.label === 'string');
      assert.ok(typeof firstTag.count === 'number');
      assert.ok(typeof firstTag.url === 'string');
      assert.ok(Array.isArray(firstTag.posts));

      // URL should be correctly formatted
      assert.ok(firstTag.url.includes('./tags/'));
      assert.ok(firstTag.url.endsWith('.html'));

      // Count should match posts length
      assert.strictEqual(firstTag.count, firstTag.posts.length);
    }
  });

  test('should generate months with correct structure', () => {
    const result = scanContent();

    if (result.months.length > 0) {
      const firstMonth = result.months[0];

      // Month should have required properties
      assert.ok(typeof firstMonth.key === 'string');
      assert.ok(typeof firstMonth.label === 'string');
      assert.ok(typeof firstMonth.count === 'number');
      assert.ok(typeof firstMonth.url === 'string');
      assert.ok(typeof firstMonth.year === 'number');
      assert.ok(typeof firstMonth.month === 'number');
      assert.ok(Array.isArray(firstMonth.posts));

      // URL should be correctly formatted
      assert.ok(firstMonth.url.includes('./months/'));
      assert.ok(firstMonth.url.endsWith('.html'));

      // Key should be in YYYY-MM format
      assert.ok(/^\d{4}-\d{2}$/.test(firstMonth.key));

      // Count should match posts length
      assert.strictEqual(firstMonth.count, firstMonth.posts.length);
    }
  });

  test('should work with custom configuration', () => {
    const customConfig = {
      postsOutputDir: 'custom/posts',
      dataDir: 'custom/data'
    };

    const result = scanContent(customConfig);

    // Should still return valid structure
    assert.strictEqual(typeof result, 'object');
    assert.ok(Array.isArray(result.posts));
    assert.ok(Array.isArray(result.tags));
    assert.ok(Array.isArray(result.months));

    // Post paths should use custom directory
    if (result.posts.length > 0) {
      const firstPost = result.posts[0];
      assert.ok(firstPost.path.includes('./custom/posts/'));
    }
  });
});
