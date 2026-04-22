#!/usr/bin/env node

/**
 * Format Script - Main formatting entry point
 * Formats all project files using Biome and Prettier
 */

import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const execAsync = promisify(exec);
const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');

async function runFormatting() {
  console.log('🎨 Running code formatting...\n');

  try {
    console.log('📋 Formatting with Biome (JS/CSS)...');
    const { stdout: biomeStdout, stderr: biomeStderr } = await execAsync(
      'pnpm exec biome format --write .',
      { cwd: projectRoot }
    );

    if (biomeStdout) console.log(biomeStdout);
    if (biomeStderr && !biomeStderr.includes('No files')) console.warn(biomeStderr);

    console.log('📄 Formatting HTML with Prettier...');
    const { stdout: htmlStdout, stderr: htmlStderr } = await execAsync(
      'node scripts/linting/format-html.js',
      { cwd: projectRoot }
    );

    if (htmlStdout) console.log(htmlStdout);
    if (htmlStderr) console.warn(htmlStderr);

    console.log('🎯 Formatting with Prettier (MD/JSON/YAML)...');
    const { stdout: prettierStdout, stderr: prettierStderr } = await execAsync(
      'pnpm exec prettier --write "**/*.{md,json,yml,yaml}" --ignore-path .prettierignore',
      { cwd: projectRoot }
    );

    if (prettierStdout) console.log(prettierStdout);
    if (prettierStderr) console.warn(prettierStderr);

    console.log('✅ Formatting completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Formatting failed:');
    console.error(error.stdout || error.message);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runFormatting().catch((error) => {
    console.error('❌ Formatting script failed:', error);
    process.exit(1);
  });
}

export { runFormatting };
