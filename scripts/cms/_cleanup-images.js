#!/usr/bin/env node
import { execFile } from 'node:child_process';
import { unlink } from 'node:fs/promises';
import { basename, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const __dirname = fileURLToPath(new URL('.', import.meta.url));
const projectRoot = join(__dirname, '..', '..');
const IMG_DIR = join(projectRoot, 'src', 'assets', 'images');
const RESPONSIVE_SIZES = new Set(['320', '640', '960', '1280']);

function trailingResponsiveSuffixCount(filePath) {
  const ext = extname(filePath).toLowerCase();
  const stem = basename(filePath, ext);
  const parts = stem.split('-');
  let count = 0;

  for (let index = parts.length - 1; index >= 0; index -= 1) {
    if (!RESPONSIVE_SIZES.has(parts[index])) break;
    count += 1;
  }

  return count;
}

async function listUntrackedImageFiles() {
  const { stdout } = await execFileAsync(
    'git',
    ['ls-files', '--others', '--exclude-standard', 'src/assets/images'],
    { cwd: projectRoot }
  );

  return stdout
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

async function findRecursiveVariants() {
  const files = await listUntrackedImageFiles();
  return files.filter((file) => trailingResponsiveSuffixCount(file) >= 2);
}

async function removeFiles(files) {
  for (const relativePath of files) {
    await unlink(join(projectRoot, relativePath));
  }
}

async function main() {
  const apply = process.argv.includes('--apply');
  const candidates = await findRecursiveVariants();

  if (!candidates.length) {
    console.log('No recursive image variants found.');
    return;
  }

  console.log(`Found ${candidates.length} recursive image variants in ${IMG_DIR}.`);
  for (const file of candidates.slice(0, 25)) {
    console.log(`- ${file}`);
  }
  if (candidates.length > 25) {
    console.log(`- ...and ${candidates.length - 25} more`);
  }

  if (!apply) {
    console.log('\nDry run only. Re-run with --apply to delete these files.');
    return;
  }

  await removeFiles(candidates);
  console.log(`Removed ${candidates.length} recursive image variants.`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error('Failed to clean recursive image variants:', error?.message || error);
    process.exit(1);
  });
}

export { findRecursiveVariants, trailingResponsiveSuffixCount };
