import assert from 'node:assert/strict';
import { readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, test } from 'node:test';

const scriptsRoot = 'scripts';
const scriptExtensions = new Set(['.js', '.cjs']);

function walkScripts(directory, entries = []) {
  for (const entryName of readdirSync(directory)) {
    const entryPath = join(directory, entryName);
    const stat = statSync(entryPath);

    if (stat.isDirectory()) {
      entries.push({ path: entryPath, type: 'directory' });
      walkScripts(entryPath, entries);
      continue;
    }

    entries.push({ path: entryPath, type: 'file' });
  }

  return entries;
}

function isScriptFile(filePath) {
  return scriptExtensions.has(filePath.slice(filePath.lastIndexOf('.')));
}

describe('scripts folder structure', () => {
  test('every scripts folder exposes an index.js barrel', () => {
    const folders = [
      scriptsRoot,
      ...walkScripts(scriptsRoot)
        .filter((entry) => entry.type === 'directory')
        .map((entry) => entry.path),
    ];
    const missingBarrels = folders
      .filter((folder) => !statSync(join(folder, 'index.js'), { throwIfNoEntry: false })?.isFile())
      .map((folder) => relative(process.cwd(), folder));

    assert.deepEqual(missingBarrels, []);
  });

  test('script files outside barrels use private underscore names', () => {
    const invalidFiles = walkScripts(scriptsRoot)
      .filter((entry) => entry.type === 'file')
      .map((entry) => relative(scriptsRoot, entry.path))
      .filter(isScriptFile)
      .filter((filePath) => filePath.split('/').pop() !== 'index.js')
      .filter((filePath) => !filePath.split('/').pop().startsWith('_'));

    assert.deepEqual(invalidFiles, []);
  });
});
