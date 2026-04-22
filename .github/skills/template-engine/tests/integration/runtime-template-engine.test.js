import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import TemplateEngine from '../../code/public/ssr.js';

describe('skill-pack runtime adapters', () => {
  test('renders registry-backed templates without filesystem access', () => {
    const templates = {
      '/layouts/base.html': `<!DOCTYPE html>
<html>
  <body>
    <block name="content">Default content</block>
  </body>
</html>`,
      '/partials/card.html': `<article>
  <h2>{{ post.title }}</h2>
  <p>{{ post.summary | default:"No summary" }}</p>
</article>`,
      '/pages/home.html': `<extends src="../layouts/base.html" />
<block name="content">
  <include src="../partials/card.html" data='{"post": {{ featured | json | raw }}}'></include>
</block>`,
    };

    const engine = new TemplateEngine({
      rootDir: '/pages',
      templates,
    });

    const result = engine.render('home.html', {
      featured: { title: 'SSR Card' },
    });

    assert.match(result, /SSR Card/);
    assert.match(result, /No summary/);
    assert.ok(!result.includes('<include'));
  });

  test('renders markdown blocks in runtime mode', () => {
    const engine = new TemplateEngine({
      templates: {},
    });

    const result = engine.renderString('<md># Runtime Title</md>', {}, { currentDir: '/' });
    assert.match(result, /<h1>Runtime Title<\/h1>/);
  });
});
