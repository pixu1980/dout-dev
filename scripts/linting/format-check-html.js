#!/usr/bin/env node

/**
 * HTML Format Checker - Verifies HTML formatting without making changes
 */

import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { readdir, stat } from 'node:fs/promises';

const execAsync = promisify(exec);
const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..', '..');
const handAuthoredRoots = ['components', 'demo', 'layouts', 'templates'];
const handAuthoredFiles = ['accessibility.html'];

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

async function getHandAuthoredHtmlFiles() {
  const files = [];

  for (const entry of handAuthoredRoots) {
    files.push(...(await findHTMLFiles(join(projectRoot, 'src', entry))));
  }

  for (const fileName of handAuthoredFiles) {
    files.push(join(projectRoot, 'src', fileName));
  }

  return files;
}

async function checkHTMLFormatting() {
  console.log('🔍 Checking HTML formatting...\n');

  try {
    const htmlFiles = await getHandAuthoredHtmlFiles();

    if (htmlFiles.length === 0) {
      console.log('⚠️  No HTML files found to check');
      return { success: true, message: 'No HTML files found' };
    }

    console.log(`📄 Checking ${htmlFiles.length} HTML files`);

    // Check with Prettier
    const { stdout } = await execAsync(
      `npx prettier --check ${htmlFiles.map((f) => `"${f}"`).join(' ')}`,
      { cwd: projectRoot }
    );

    if (stdout) console.log(stdout);

    console.log('✅ HTML formatting is correct');
    return { success: true, message: 'HTML formatting is correct' };
  } catch (error) {
    console.error('❌ HTML formatting issues found:');
    console.error(error.stdout || error.message);
    console.log('\n�️  Attempting to auto-format HTML (Prettier --write)...');

    try {
      // Auto-fix and re-check once
      const htmlFiles = await getHandAuthoredHtmlFiles();
      await execAsync(`npx prettier --write ${htmlFiles.map((f) => `"${f}"`).join(' ')}`, {
        cwd: projectRoot,
      });

      const { stdout: recheckOut } = await execAsync(
        `npx prettier --check ${htmlFiles.map((f) => `"${f}"`).join(' ')}`,
        { cwd: projectRoot }
      );

      if (recheckOut) console.log(recheckOut);
      console.log('✅ HTML formatting is correct after auto-fix');
      return { success: true, message: 'HTML formatting corrected automatically' };
    } catch (retryError) {
      console.log('\n�💡 Run `pnpm format:html` to fix formatting issues');
      return {
        success: false,
        message: 'HTML formatting issues persist after auto-fix',
        error: retryError,
      };
    }
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  checkHTMLFormatting()
    .then((result) => {
      process.exit(result.success ? 0 : 1);
    })
    .catch((error) => {
      console.error('❌ HTML format check script failed:', error);
      process.exit(1);
    });
}

export { checkHTMLFormatting };
