#!/usr/bin/env node

/**
 * Format Check Script - Verifies formatting without making changes
 * Checks if all project files are properly formatted
 */

import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const execAsync = promisify(exec);
const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');

async function checkFormatting() {
  console.log('🔍 Checking code formatting...\n');

  let hasErrors = false;

  try {
    // Check JavaScript/TypeScript with Biome
    console.log('📋 Checking Biome formatting (JS only)...');
    try {
      // Run formatter in dry mode at repo root (config controls includes)
      const { stdout: biomeStdout } = await execAsync(
        'npx biome format --reporter=summary --diagnostic-level=error .',
        { cwd: projectRoot }
      );

      if (biomeStdout) console.log(biomeStdout);
      console.log('✅ Biome formatting is correct');
    } catch (biomeError) {
      console.error('❌ Biome formatting issues found:');
      console.error(biomeError.stdout || biomeError.message);
      hasErrors = true;
    }

    // Check other files with Prettier
    console.log('\n🎯 Checking Prettier formatting (HTML/CSS/MD/JSON/YAML)...');
    try {
      const { stdout: prettierStdout } = await execAsync(
        'npx prettier --check "**/*.{css,md,json,yml,yaml}" --ignore-path .prettierignore',
        { cwd: projectRoot }
      );

      if (prettierStdout) console.log(prettierStdout);
      console.log('✅ Prettier formatting is correct');
    } catch (prettierError) {
      console.error('❌ Prettier formatting issues found:');
      console.error(prettierError.stdout || prettierError.message);
      hasErrors = true;
    }

    if (hasErrors) {
      console.log('\n💡 Run `pnpm format` to fix formatting issues');
      process.exit(1);
    } else {
      console.log('\n✅ All files are properly formatted');
      process.exit(0);
    }
  } catch (error) {
    console.error('❌ Format check failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  checkFormatting().catch((error) => {
    console.error('❌ Format check script failed:', error);
    process.exit(1);
  });
}

export { checkFormatting };
