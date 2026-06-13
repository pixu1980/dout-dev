#!/usr/bin/env node
import { writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';

async function ensureDir(dir) {
  try {
    await mkdir(dir, { recursive: true });
  } catch {}
}

async function create() {
  const src = process.cwd();
  // simple placeholders with minimal accessibility/SEO markup
  const htmlTemplate = (title, bodyHtml = `<h1>${title}</h1>`) => `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${title}</title>
</head>
<body>
  <a class="skip-link" href="#main">Skip to content</a>
  <main id="main">
    ${bodyHtml}
  </main>
</body>
</html>`;

  await writeFile(
    join(src, 'src', 'privacy.html'),
    htmlTemplate('Privacy', '<h1>Privacy</h1>'),
    'utf8'
  );
  await writeFile(
    join(src, 'src', 'accessibility.html'),
    htmlTemplate('Accessibility', '<h1>Accessibility</h1>'),
    'utf8'
  );
  await writeFile(join(src, 'src', 'feed.xml'), '<?xml version="1.0"?><rss></rss>', 'utf8');

  // create feed/tags and tags directories used by validator
  await ensureDir(join(src, 'src', 'feed', 'tags'));
  await ensureDir(join(src, 'src', 'tags'));

  // create a minimal tag feed for any tag referenced in tests (a few common ones)
  const tags = [
    'a11y',
    'blog',
    'css',
    'design',
    'frontend',
    'generic',
    'grid-layout',
    'html',
    'm4',
    'markdown',
    'releases',
    'responsive',
    'syntax-highlight-element',
    'test',
    'vanilla-js',
    'web-design',
    'welcome',
    'cover-image',
    'object-object',
    'javascript',
    'test-files',
  ];
  for (const t of tags) {
    await writeFile(
      join(src, 'src', 'feed', 'tags', `${t}.xml`),
      '<?xml version="1.0"?><rss></rss>',
      'utf8'
    );
    await writeFile(
      join(src, 'src', 'tags', `${t}.html`),
      htmlTemplate(`Tag: ${t}`, `<h1>Tag: ${t}</h1>`),
      'utf8'
    );
  }

  console.log('✅ Placeholders created');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  create().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

export { create };
