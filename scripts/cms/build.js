#!/usr/bin/env node
// CMS Build - orchestrates scan and page generation
import { scanContent } from './scan.js';
import { generatePages } from './page-generator.js';
import { resolveConfig } from './config.js';

export function build(userConfig = {}) {
  const config = resolveConfig(userConfig);
  const dataset = scanContent(config);
  generatePages(dataset, config);
  return dataset;
}

export async function main() {
  try {
    const dataset = build();
    console.log(`Built ${dataset.posts.length} posts, ${dataset.tags.length} tags, ${dataset.months.length} months`);
    process.exit(0);
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) { main(); }
