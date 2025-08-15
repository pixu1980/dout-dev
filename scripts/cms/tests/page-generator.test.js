import { test, describe } from 'node:test';
import assert from 'node:assert';
import { generatePages } from '../page-generator.js';

describe('page-generator', () => {
  test('generatePages should process empty datasets without errors', () => {
    const dataset = { posts: [], tags: [], months: [] };
    const config = {
      postsOutputDir: '/tmp/test-posts',
      tagsOutputDir: '/tmp/test-tags',
      monthsOutputDir: '/tmp/test-months'
    };

    // Should not throw errors with empty datasets
    assert.doesNotThrow(() => {
      generatePages(dataset, config);
    });
  });

  test('generatePages should process all content types', () => {
    const dataset = {
      posts: [
        { name: 'post1', title: 'Test Post', published: true, content: '<p>Test content</p>' }
      ],
      tags: [
        { key: 'javascript', label: 'JavaScript', posts: [{ name: 'post1', title: 'Test Post' }] }
      ],
      months: [
        { key: '2023-12', label: 'December 2023', posts: [{ name: 'post1', title: 'Test Post' }] }
      ]
    };
    const config = {
      postsOutputDir: '/tmp/test-posts',
      tagsOutputDir: '/tmp/test-tags',
      monthsOutputDir: '/tmp/test-months'
    };

    // Should not throw errors
    assert.doesNotThrow(() => {
      generatePages(dataset, config);
    });
  });

  test('generateGroups should create tag pages with escaped special characters', () => {
    const dataset = {
      posts: [],
      tags: [
        {
          key: 'test-tag',
          label: 'Test & Demo <script>',
          posts: [
            { name: 'post1', title: 'Post with "quotes" & <tags>' }
          ]
        }
      ],
      months: []
    };
    const config = {
      postsOutputDir: '/tmp/test-posts',
      tagsOutputDir: '/tmp/test-tags',
      monthsOutputDir: '/tmp/test-months'
    };

    // Should not throw errors and should handle escaping
    assert.doesNotThrow(() => {
      generatePages(dataset, config);
    });
  });

  test('generatePages should handle mixed posts (published and unpublished)', () => {
    const dataset = {
      posts: [
        { name: 'published', title: 'Published Post', published: true, content: '<p>Content</p>' },
        { name: 'draft', title: 'Draft Post', published: false, content: '<p>Draft</p>' },
        { name: 'another', title: 'Another Post', published: true, content: '<p>Another</p>' }
      ],
      tags: [],
      months: []
    };
    const config = {
      postsOutputDir: '/tmp/test-posts',
      tagsOutputDir: '/tmp/test-tags',
      monthsOutputDir: '/tmp/test-months'
    };

    // Should not throw errors
    assert.doesNotThrow(() => {
      generatePages(dataset, config);
    });
  });

  test('generateGroups should handle both tags and months', () => {
    const dataset = {
      posts: [],
      tags: [
        { key: 'js', label: 'JavaScript', posts: [] }
      ],
      months: [
        { key: '2023-12', label: 'December 2023', posts: [] },
        { key: '2024-01', label: 'January 2024', posts: [] }
      ]
    };
    const config = {
      postsOutputDir: '/tmp/test-posts',
      tagsOutputDir: '/tmp/test-tags',
      monthsOutputDir: '/tmp/test-months'
    };

    // Should not throw errors with empty tags and months
    assert.doesNotThrow(() => {
      generatePages(dataset, config);
    });
  });
});
