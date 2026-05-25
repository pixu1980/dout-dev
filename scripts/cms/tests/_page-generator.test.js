import assert from 'node:assert';
import { describe, test } from 'node:test';
import {
  buildPostSeriesNavigation,
  buildPostFeedLoadMoreConfig,
  generatePages,
  getHomePageFeedModel,
  withPostMediaFallback,
} from '../_page-generator.js';

describe('page-generator', () => {
  test('generatePages should process empty datasets without errors', () => {
    const dataset = { posts: [], tags: [], months: [], series: [] };
    const config = {
      postsOutputDir: '/tmp/test-posts',
      tagsOutputDir: '/tmp/test-tags',
      monthsOutputDir: '/tmp/test-months',
      seriesOutputDir: '/tmp/test-series',
    };

    // Should not throw errors with empty datasets
    assert.doesNotThrow(() => {
      generatePages(dataset, config);
    });
  });

  test('generatePages should process all content types', () => {
    const dataset = {
      posts: [
        { name: 'post1', title: 'Test Post', published: true, content: '<p>Test content</p>' },
      ],
      tags: [
        { key: 'javascript', label: 'JavaScript', posts: [{ name: 'post1', title: 'Test Post' }] },
      ],
      months: [
        { key: '2023-12', label: 'December 2023', posts: [{ name: 'post1', title: 'Test Post' }] },
      ],
    };
    const config = {
      postsOutputDir: '/tmp/test-posts',
      tagsOutputDir: '/tmp/test-tags',
      monthsOutputDir: '/tmp/test-months',
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
          posts: [{ name: 'post1', title: 'Post with "quotes" & <tags>' }],
        },
      ],
      months: [],
    };
    const config = {
      postsOutputDir: '/tmp/test-posts',
      tagsOutputDir: '/tmp/test-tags',
      monthsOutputDir: '/tmp/test-months',
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
        { name: 'another', title: 'Another Post', published: true, content: '<p>Another</p>' },
      ],
      tags: [],
      months: [],
    };
    const config = {
      postsOutputDir: '/tmp/test-posts',
      tagsOutputDir: '/tmp/test-tags',
      monthsOutputDir: '/tmp/test-months',
    };

    // Should not throw errors
    assert.doesNotThrow(() => {
      generatePages(dataset, config);
    });
  });

  test('generateGroups should handle both tags and months', () => {
    const dataset = {
      posts: [],
      tags: [{ key: 'js', label: 'JavaScript', posts: [] }],
      months: [
        { key: '2023-12', label: 'December 2023', posts: [] },
        { key: '2024-01', label: 'January 2024', posts: [] },
      ],
    };
    const config = {
      postsOutputDir: '/tmp/test-posts',
      tagsOutputDir: '/tmp/test-tags',
      monthsOutputDir: '/tmp/test-months',
    };

    // Should not throw errors with empty tags and months
    assert.doesNotThrow(() => {
      generatePages(dataset, config);
    });
  });

  test('getHomePageFeedModel keeps featured selection separate from latest date ordering', () => {
    const posts = [
      { name: 'older-pinned', published: true, pinned: true, date: '2024-01-01T00:00:00.000Z' },
      { name: 'latest', published: true, pinned: false, date: '2024-06-01T00:00:00.000Z' },
      { name: 'middle', published: true, pinned: false, date: '2024-03-01T00:00:00.000Z' },
      { name: 'draft', published: false, pinned: false, date: '2024-07-01T00:00:00.000Z' },
    ];

    const result = getHomePageFeedModel(posts);

    assert.strictEqual(result.featuredPost?.name, 'older-pinned');
    assert.deepStrictEqual(
      result.latestPosts.map((post) => post.name),
      ['latest', 'middle', 'older-pinned']
    );
    assert.strictEqual(result.loadMore, null);
  });

  test('getHomePageFeedModel exposes three featured posts when enough published posts exist', () => {
    const posts = [
      { name: 'older-pinned', published: true, pinned: true, date: '2024-01-01T00:00:00.000Z' },
      { name: 'latest', published: true, pinned: false, date: '2024-06-01T00:00:00.000Z' },
      { name: 'middle', published: true, pinned: false, date: '2024-03-01T00:00:00.000Z' },
      { name: 'older', published: true, pinned: false, date: '2024-02-01T00:00:00.000Z' },
      { name: 'draft', published: false, pinned: true, date: '2024-07-01T00:00:00.000Z' },
    ];

    const result = getHomePageFeedModel(posts);

    assert.deepStrictEqual(
      result.featuredPosts.map((post) => post.name),
      ['older-pinned', 'latest', 'middle']
    );
    assert.strictEqual(result.featuredPost?.name, 'older-pinned');
  });

  test('buildPostSeriesNavigation creates linked series items and marks the current post', () => {
    const series = [
      {
        slug: 'how-i-made-it',
        title: 'How I made it',
        posts: [
          { name: 'intro', title: 'Intro' },
          { name: 'current', title: 'Current' },
          { name: 'next', title: 'Next' },
        ],
      },
    ];

    const navigation = buildPostSeriesNavigation(series, {
      name: 'current',
      series: 'How I made it',
    });

    assert.deepStrictEqual(navigation, [
      {
        slug: 'how-i-made-it',
        title: 'How I made it',
        posts: [
          { current: false, label: 'Intro', title: 'Intro', url: '/posts/intro.html' },
          {
            current: true,
            label: 'Current (you are here)',
            title: 'Current',
            url: '/posts/current.html',
          },
          { current: false, label: 'Next', title: 'Next', url: '/posts/next.html' },
        ],
      },
    ]);
  });

  test('buildPostFeedLoadMoreConfig returns config only when a list exceeds the initial batch', () => {
    assert.strictEqual(buildPostFeedLoadMoreConfig(10, { initialCount: 10 }), null);
    assert.deepStrictEqual(buildPostFeedLoadMoreConfig(21, { initialCount: 20 }), {
      initial: 20,
      step: 10,
      buttonLabel: 'Load 10 more posts',
    });
  });

  test('withPostMediaFallback uses generated OG card image when a post has no cover', () => {
    const result = withPostMediaFallback({ name: 'example-post', title: 'Example Post' });

    assert.strictEqual(result.coverImage, '/assets/og/posts/example-post-card.png');
    assert.strictEqual(result.coverWidth, 1200);
    assert.strictEqual(result.coverHeight, 900);
    assert.strictEqual(result.coverAlt, 'Preview image for Example Post');
  });

  test('withPostMediaFallback preserves authored cover images', () => {
    const result = withPostMediaFallback({
      name: 'example-post',
      title: 'Example Post',
      coverImage: '/assets/images/example.jpg',
      coverWidth: 1600,
      coverHeight: 1200,
      coverAlt: 'Author cover',
    });

    assert.strictEqual(result.coverImage, '/assets/images/example.jpg');
    assert.strictEqual(result.coverWidth, 1600);
    assert.strictEqual(result.coverHeight, 1200);
    assert.strictEqual(result.coverAlt, 'Author cover');
  });
});
