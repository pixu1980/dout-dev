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
    console.log('📋 Checking Biome formatting (JS/CSS)...');
    try {
      const { stdout: biomeStdout } = await execAsync(
        'pnpm exec biome format --reporter=summary --diagnostic-level=error .',
        { cwd: projectRoot }
      );

      if (biomeStdout) console.log(biomeStdout);
      console.log('✅ Biome formatting is correct');
    } catch (biomeError) {
      console.error('❌ Biome formatting issues found:');
      console.error(biomeError.stdout || biomeError.message);
      hasErrors = true;
    }

    console.log('\n📄 Checking HTML formatting...');
    try {
      const { stdout: htmlStdout } = await execAsync('node scripts/linting/format-check-html.js', {
        cwd: projectRoot,
      });

      if (htmlStdout) console.log(htmlStdout);
      console.log('✅ HTML formatting is correct');
    } catch (htmlError) {
      console.error('❌ HTML formatting issues found:');
      console.error(htmlError.stdout || htmlError.message);
      hasErrors = true;
    }

    console.log('\n🎯 Checking Prettier formatting (MD/JSON/YAML)...');
    try {
      const { stdout: prettierStdout } = await execAsync(
        'pnpm exec prettier --check "**/*.{md,json,yml,yaml}" --ignore-path .prettierignore',
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
