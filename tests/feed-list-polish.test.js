import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { describe, test } from 'node:test';

const PROJECT_ROOT = process.cwd();
const TEMPLATES_ROOT = join(PROJECT_ROOT, 'src', 'templates');
const SEARCH_SCRIPT = join(PROJECT_ROOT, 'src', 'scripts', 'search.js');
const COMPONENTS_CSS = join(PROJECT_ROOT, 'src', 'styles', 'layers', 'components.css');
const OVERRIDES_CSS = join(PROJECT_ROOT, 'src', 'styles', 'layers', 'overrides.css');

async function readTemplateFiles() {
  const entries = await readdir(TEMPLATES_ROOT, { withFileTypes: true });
  return Promise.all(
    entries
      .filter((entry) => entry.isFile() && entry.name.endsWith('.html'))
      .map(async (entry) => {
        const filePath = join(TEMPLATES_ROOT, entry.name);
        return {
          content: await readFile(filePath, 'utf8'),
          name: relative(PROJECT_ROOT, filePath),
        };
      })
  );
}

function getFunctionSource(source, functionName, nextFunctionName) {
  const start = source.indexOf(`function ${functionName}`);
  const end = source.indexOf(`function ${nextFunctionName}`, start + 1);

  assert.notEqual(start, -1, `Expected ${functionName} to exist`);
  assert.notEqual(end, -1, `Expected ${nextFunctionName} to follow ${functionName}`);

  return source.slice(start, end);
}

describe('feed list polish', () => {
  test('feature-list post feeds render post cards without cover images', async () => {
    const templates = await readTemplateFiles();
    const feedTemplates = templates.filter(
      ({ content }) =>
        content.includes('data-post-feed-variant="feature-list"') &&
        content.includes('src="../components/post-card.html"')
    );

    assert.ok(feedTemplates.length > 0, 'Expected feature-list feed templates');

    for (const { content, name } of feedTemplates) {
      assert.match(content, /"showCover": false/, name);
      assert.doesNotMatch(content, /"showCover": true/, name);
    }
  });

  test('client search renders post results as text-only list cards', async () => {
    const searchSource = await readFile(SEARCH_SCRIPT, 'utf8');
    const resultRenderer = getFunctionSource(searchSource, 'renderResultItem', 'renderTagItem');

    assert.doesNotMatch(resultRenderer, /data-post-card-media/);
    assert.doesNotMatch(resultRenderer, /coverImage/);
    assert.doesNotMatch(resultRenderer, /with-media/);
    assert.match(resultRenderer, /data-post-card-variant="default"/);
  });

  test('scroll reveal motion is CSS-driven and has a reduced-motion escape hatch', async () => {
    const [componentsCss, overridesCss] = await Promise.all([
      readFile(COMPONENTS_CSS, 'utf8'),
      readFile(OVERRIDES_CSS, 'utf8'),
    ]);

    assert.match(componentsCss, /@keyframes dout-reveal-fade-up/);
    assert.match(componentsCss, /\[data-reveal\]/);
    assert.match(componentsCss, /animation-timeline:\s*view\(\)/);
    assert.match(componentsCss, /animation-range:/);
    assert.match(overridesCss, /\[data-reveal\]/);
  });
});
