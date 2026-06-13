#!/usr/bin/env node

import { readFile, readdir, stat } from 'node:fs/promises';
import { extname, join, relative } from 'node:path';

const projectRoot = process.cwd();
const srcDir = join(projectRoot, 'src');
const forbiddenPattern = /\{%/;
const authoredDirectories = new Set(['components', 'layouts', 'templates', 'demo']);
const excludedDirectories = new Set(['assets', 'data', 'months', 'posts', 'series', 'tags']);

async function findFiles(dir) {
  const files = [];
  const entries = await readdir(dir, { withFileTypes: true });
  const isSrcRoot = dir === srcDir;

  for (const entry of entries) {
    if (entry.name.startsWith('.')) {
      continue;
    }

    if (isSrcRoot && excludedDirectories.has(entry.name)) {
      continue;
    }

    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (isSrcRoot && !authoredDirectories.has(entry.name)) {
        continue;
      }

      files.push(...(await findFiles(fullPath)));
      continue;
    }

    if (entry.isFile() && extname(entry.name).toLowerCase() === '.html') {
      files.push(fullPath);
    }
  }

  return files;
}

async function scanFile(filePath) {
  const fileStats = await stat(filePath);
  if (!fileStats.isFile()) {
    return [];
  }

  const content = await readFile(filePath, 'utf8');
  if (!forbiddenPattern.test(content)) {
    return [];
  }

  return content
    .split('\n')
    .map((line, index) => ({ line, lineNumber: index + 1 }))
    .filter(({ line }) => forbiddenPattern.test(line));
}

async function main() {
  console.log('🔎 Validating template syntax...');

  const files = await findFiles(srcDir);
  const violations = [];

  for (const filePath of files) {
    const matches = await scanFile(filePath);
    if (matches.length === 0) {
      continue;
    }

    violations.push({
      filePath,
      matches,
    });
  }

  if (violations.length > 0) {
    console.error('❌ Found forbidden Liquid or Jekyll syntax in src/:');

    for (const violation of violations) {
      console.error(`\n${relative(projectRoot, violation.filePath)}`);
      for (const match of violation.matches) {
        console.error(`  ${match.lineNumber}: ${match.line.trim()}`);
      }
    }

    process.exit(1);
  }

  console.log('✅ Template syntax validation passed');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error('❌ Template syntax validation failed:', error);
    process.exit(1);
  });
}
