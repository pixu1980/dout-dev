#!/usr/bin/env node

/**
 * Lint Script - Main linting entry point
 * Runs Biome linter on all project files
 */

import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const execAsync = promisify(exec);
const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');

async function runLinting() {
  console.log('🔍 Running linting checks...\n');

  try {
    // Run Biome linting
    console.log('📋 Biome lint check...');
    const { stdout: biomeStdout, stderr: biomeStderr } = await execAsync('npx biome lint .', {
      cwd: projectRoot,
    });

    if (biomeStdout) console.log(biomeStdout);
    if (biomeStderr) console.warn(biomeStderr);

    console.log('✅ Linting completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Linting failed:');
    console.error(error.stdout || error.message);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runLinting().catch((error) => {
    console.error('❌ Linting script failed:', error);
    process.exit(1);
  });
}

export { runLinting };
