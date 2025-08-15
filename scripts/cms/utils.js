// CMS Utilities - support functions without external dependencies
import { mkdirSync, readdirSync, statSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';

export function ensureDir(dir) {
  mkdirSync(dir, { recursive: true });
}

export function readFile(filePath) {
  return readFileSync(filePath, 'utf8');
}

export function writeJson(filePath, data) {
  ensureDir(dirname(filePath));
  writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

export function scanDirRecursive(dir, exts = ['.md']) {
  const results = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) results.push(...scanDirRecursive(full, exts));
    else if (exts.some((e) => full.endsWith(e))) results.push(full);
  }
  return results.sort();
}

export function removePath(p) {
  try { rmSync(p, { recursive: true, force: true }); } catch { /* ignore */ }
}

export function slugify(str) {
  return String(str).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}
