import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { describe, test } from 'node:test';

const PROJECT_ROOT = process.cwd();
const CSS_ROOTS = [
  join(PROJECT_ROOT, 'src', 'styles'),
  join(PROJECT_ROOT, 'src', 'scripts', 'components'),
];
const MARKUP_ROOTS = [join(PROJECT_ROOT, 'src', 'layouts')];
const CONTENT_ROOTS = [join(PROJECT_ROOT, 'data', 'posts'), join(PROJECT_ROOT, 'docs')];
const EXTRA_FILES = [
  join(PROJECT_ROOT, 'src', 'accessibility.html'),
  join(PROJECT_ROOT, 'src', 'demo', 'index.html'),
  join(PROJECT_ROOT, 'tests', 'layout.html'),
  join(PROJECT_ROOT, 'tests', 'output.html'),
];
const COMPONENTS_CSS = join(PROJECT_ROOT, 'src', 'styles', 'layers', 'components.css');
const OVERRIDES_CSS = join(PROJECT_ROOT, 'src', 'styles', 'layers', 'overrides.css');
const PIX_HIGHLIGHTER_POST = join(
  PROJECT_ROOT,
  'data',
  'posts',
  '2026-06-13-how-pixhighlighter-is-built.md'
);

async function collectFiles(root, extensions) {
  const entries = await readdir(root, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const filePath = join(root, entry.name);

      if (entry.isDirectory()) {
        return collectFiles(filePath, extensions);
      }

      if (entry.isFile() && extensions.some((extension) => entry.name.endsWith(extension))) {
        return [filePath];
      }

      return [];
    })
  );

  return files.flat();
}

describe('motion and typography polish', () => {
  test('line-height declarations use fixed unitless 1.3', async () => {
    const files = [
      ...(await Promise.all(CSS_ROOTS.map((root) => collectFiles(root, ['.css'])))).flat(),
      ...(await Promise.all(MARKUP_ROOTS.map((root) => collectFiles(root, ['.html'])))).flat(),
      ...(
        await Promise.all(CONTENT_ROOTS.map((root) => collectFiles(root, ['.md', '.html'])))
      ).flat(),
      ...EXTRA_FILES,
    ];
    const failures = [];

    for (const filePath of files) {
      const content = await readFile(filePath, 'utf8');
      const lineHeightDeclarations = content.matchAll(
        /line-height\s*:\s*([^;\n}"]+)\s*(?:[;}"]|$)/g
      );
      const lineHeightTokens = content.matchAll(
        /--(?:dout--pix-line-height|font-lineheight-[\w-]+)\s*:\s*([^;\n}"]+)\s*(?:[;}"]|$)/g
      );
      const fontShorthands = content.matchAll(/font\s*:\s*[^;]*\/([\d.]+)[^;]*;/gs);

      for (const match of [...lineHeightDeclarations, ...lineHeightTokens, ...fontShorthands]) {
        if (match[1].trim() !== '1.3') {
          failures.push(`${relative(PROJECT_ROOT, filePath)} -> ${match[0].trim()}`);
        }
      }
    }

    assert.deepEqual(failures, []);
  });

  test('scroll reveal uses view timeline for prose and respects reduced motion', async () => {
    const [componentsCss, overridesCss] = await Promise.all([
      readFile(COMPONENTS_CSS, 'utf8'),
      readFile(OVERRIDES_CSS, 'utf8'),
    ]);

    assert.match(componentsCss, /@keyframes dout-reveal-fade-up/);
    assert.match(componentsCss, /\[data-prose\]\s*>\s*:\s*where/);
    assert.match(componentsCss, /animation-timeline:\s*view\(\)/);
    assert.match(componentsCss, /animation-range:\s*entry\s+0%\s+cover\s+34%/);
    assert.match(componentsCss, /filter:\s*blur\(0\.28rem\)/);
    assert.match(
      overridesCss,
      /:root\[data-reduce-motion='true'\]\s+\[data-prose\]\s*>\s*:\s*where/
    );
  });

  test('PixHighlighter article frames CSS Custom Highlight API as the primary path', async () => {
    const article = await readFile(PIX_HIGHLIGHTER_POST, 'utf8');

    assert.match(article, /CSS Custom Highlight API/);
    assert.match(article, /primary path does not wrap/);
    assert.match(article, /not a pile of span wrappers/);
    assert.match(article, /::highlight\(pix-kw\)/);
    assert.match(article, /fallback spans only when the Highlight API is unavailable/);
  });
});
