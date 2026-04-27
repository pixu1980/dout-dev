#!/usr/bin/env node
// CMS Validate - validates content for common issues
import { scanContent } from './_scan.js';
import { resolveConfig } from './_config.js';

export function validate(userConfig = {}) {
  const config = resolveConfig(userConfig);
  const errors = [];
  const warnings = [];

  try {
    const { posts } = scanContent(config);

    for (const post of posts) {
      // Check for missing title
      if (!post.title || post.title.trim() === '') {
        errors.push(`Post ${post.name}: Missing title`);
      }

      // Check for missing date
      if (!post.date) {
        warnings.push(`Post ${post.name}: Missing date`);
      }

      // Check for duplicate names
      const duplicates = posts.filter((p) => p.name === post.name);
      if (duplicates.length > 1) {
        errors.push(`Duplicate post name: ${post.name}`);
      }
    }

    return { errors, warnings, posts };
  } catch (error) {
    errors.push(`Validation error: ${error.message}`);
    return { errors, warnings, posts: [] };
  }
}

// Export main for CLI usage
export async function main() {
  try {
    const result = validate();

    if (result.warnings.length > 0) {
      console.warn('Warnings:', result.warnings);
    }

    if (result.errors.length > 0) {
      console.error('Errors:', result.errors);
      process.exit(1);
    }

    console.log('Validation passed');
    process.exit(0);
  } catch (error) {
    console.error('Validation failed:', error);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
