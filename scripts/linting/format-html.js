#!/usr/bin/env node

/**
 * HTML Formatter - Formats HTML files using Prettier
 */

import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { readdir, stat } from 'node:fs/promises';

const execAsync = promisify(exec);
const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..', '..');

async function findHTMLFiles(dir) {
  const files = [];

  try {
    const entries = await readdir(dir);

    for (const entry of entries) {
      const fullPath = join(dir, entry);
      const stats = await stat(fullPath);

      if (stats.isDirectory() && !entry.startsWith('.') && entry !== 'node_modules') {
        files.push(...(await findHTMLFiles(fullPath)));
      } else if (stats.isFile() && entry.endsWith('.html')) {
        files.push(fullPath);
      }
    }
  } catch (_error) {
    // Ignore directories that can't be read
  }

  return files;
}

async function formatHTML() {
  console.log('🎨 Formatting HTML files...\n');

  try {
    const htmlFiles = await findHTMLFiles(join(projectRoot, 'src'));

    if (htmlFiles.length === 0) {
      console.log('⚠️  No HTML files found to format');
      return { success: true, message: 'No HTML files found' };
    }

    console.log(`📄 Found ${htmlFiles.length} HTML files`);

    // Format with Prettier
    const { stdout, stderr } = await execAsync(
      `npx prettier --write ${htmlFiles.map((f) => `"${f}"`).join(' ')}`,
      { cwd: projectRoot }
    );

    if (stdout) console.log(stdout);
    if (stderr) console.warn(stderr);

    console.log('✅ HTML formatting completed');
    return { success: true, message: 'HTML formatting completed' };
  } catch (error) {
    console.error('❌ HTML formatting failed:');
    console.error(error.stdout || error.message);
    return { success: false, message: 'HTML formatting failed', error };
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  formatHTML()
    .then((result) => {
      process.exit(result.success ? 0 : 1);
    })
    .catch((error) => {
      console.error('❌ HTML format script failed:', error);
      process.exit(1);
    });
}

export { formatHTML };
