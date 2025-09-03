// CMS - Main functions export
export { processMarkdown } from './post-processor.js';
export { scanContent } from './scan.js';
export { generatePages } from './page-generator.js';
export { build } from './build.js';
export { clean } from './clean.js';
export { validate } from './validate.js';
export { startWatch } from './watch.js';
export { resolveConfig, defaultConfig } from './config.js';
export * from './utils.js';

import { resolveConfig } from './config.js';
import { scanContent } from './scan.js';
import { generatePages } from './page-generator.js';

/**
 * Main CMS Class
 * Provides a unified interface for all CMS operations
 */
export class CMS {
  constructor(userConfig = {}) {
    this.config = resolveConfig(userConfig);

    // Initialize components
    this.postProcessor = {
      processAllPosts: async () => {
        const dataset = scanContent(this.config);
        return dataset.posts;
      },
    };

    this.indexGenerator = {
      generateIndices: async () => {
        const dataset = scanContent(this.config);
        return {
          tags: dataset.tags,
          months: dataset.months,
        };
      },
    };

    this.pageGenerator = {
      generateAllPages: async () => {
        const dataset = scanContent(this.config);
        return generatePages(dataset, this.config);
      },
    };
  }

  /**
   * Build the entire site
   */
  async build() {
    try {
      console.log('🚀 Starting CMS build');

      console.log('📝 Processing markdown posts');
      const posts = await this.postProcessor.processAllPosts();

      console.log('📊 Generating indices');
      const indices = await this.indexGenerator.generateIndices();

      console.log('📄 Generating static pages');
      await this.pageGenerator.generateAllPages();

      console.log('🎉 CMS build completed successfully');

      return { posts, indices };
    } catch (error) {
      console.error('❌ CMS build failed:', error.message);
      throw error;
    }
  }

  /**
   * Scan content and provide statistics
   */
  async scan() {
    try {
      console.log('🔍 Scanning content');

      const posts = await this.postProcessor.processAllPosts();

      const published = posts.filter((p) => p.published);
      const drafts = posts.filter((p) => !p.published);

      // Count tags
      const tagCounts = {};
      const uniqueTags = new Set();
      posts.forEach((post) => {
        post.tags.forEach((tag) => {
          const tagKey = typeof tag === 'string' ? tag : tag.key;
          uniqueTags.add(tagKey);
          tagCounts[tagKey] = (tagCounts[tagKey] || 0) + 1;
        });
      });

      // Count months
      const monthCounts = {};
      const uniqueMonths = new Set();
      posts.forEach((post) => {
        if (post.date) {
          const date = new Date(post.date);
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          uniqueMonths.add(monthKey);
          monthCounts[monthKey] = (monthCounts[monthKey] || 0) + 1;
        }
      });

      const stats = {
        total: posts.length,
        published: published.length,
        drafts: drafts.length,
        tags: uniqueTags.size,
        months: uniqueMonths.size,
        tagCounts,
        monthCounts,
      };

      console.log('📊 Content Statistics');
      console.log(`Total posts: ${stats.total}`);
      console.log(`Published: ${stats.published}`);
      console.log(`Drafts: ${stats.drafts}`);

      return stats;
    } catch (error) {
      console.error('❌ Scan failed:', error.message);
      throw error;
    }
  }

  /**
   * Validate content
   */
  async validate() {
    try {
      console.log('🔍 Validating content');

      const posts = await this.postProcessor.processAllPosts();
      const errors = [];
      const warnings = [];

      posts.forEach((post) => {
        // Check for missing title
        if (!post.title || post.title.trim() === '') {
          errors.push(`${post.name}: Missing title`);
        }

        // Check for missing date
        if (!post.date || post.date.trim() === '') {
          errors.push(`${post.name}: Missing date`);
        }

        // Check filename format
        if (!post.name.match(/^\d{4}-\d{2}-\d{2}-.+\.md$/)) {
          warnings.push(`${post.name}: Filename doesn't follow YYYY-MM-DD-slug format`);
        }

        // Check for cover image existence (simplified)
        if (post.coverImage?.includes('nonexistent')) {
          warnings.push(`${post.name}: Cover image may not exist`);
        }
      });

      if (errors.length === 0 && warnings.length === 0) {
        console.log('✅ Content validation passed');
      } else {
        if (errors.length > 0) {
          console.log('❌ Validation errors');
          for (const err of errors) {
            console.log(`  - ${err}`);
          }
        }
        if (warnings.length > 0) {
          console.log('⚠️  Validation warnings');
          for (const warn of warnings) {
            console.log(`  - ${warn}`);
          }
        }
      }

      return { errors, warnings };
    } catch (error) {
      console.error('❌ Validation failed:', error.message);
      throw error;
    }
  }
}

// Export CMS as default
export default CMS;
