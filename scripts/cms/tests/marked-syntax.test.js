import { describe, it } from 'node:test';
import assert from 'node:assert';
import { marked } from 'marked';
import { createMarkedOptions } from '../marked-syntax.js';

describe('CMS - Marked Syntax', () => {
  it('should create marked options with custom renderer', () => {
    const options = createMarkedOptions();
    assert.ok(options.renderer);
    assert.strictEqual(options.headerIds, false);
    assert.strictEqual(options.mangle, false);
  });

  it('should render code block with language', () => {
    const options = createMarkedOptions();
    const renderer = options.renderer;

    const result = renderer.code('console.log("hello");', 'javascript');
    assert.strictEqual(
      result,
      '<pre is="pix-highlighter" lang="javascript"><code>console.log("hello");</code></pre>'
    );
  });

  it('should render code block without language', () => {
    const options = createMarkedOptions();
    const renderer = options.renderer;

    const result = renderer.code('console.log("hello");', '');
    assert.strictEqual(
      result,
      '<pre is="pix-highlighter"><code>console.log("hello");</code></pre>'
    );
  });

  it('should render code block with undefined infostring', () => {
    const options = createMarkedOptions();
    const renderer = options.renderer;

    const result = renderer.code('console.log("hello");', undefined);
    assert.strictEqual(
      result,
      '<pre is="pix-highlighter"><code>console.log("hello");</code></pre>'
    );
  });

  it('should handle code block with object token', () => {
    const options = createMarkedOptions();
    const renderer = options.renderer;

    // Test the case where code is an object with text property
    const codeToken = { text: 'console.log("hello");', lang: 'javascript' };
    const result = renderer.code(codeToken, 'typescript');
    assert.strictEqual(
      result,
      '<pre is="pix-highlighter" lang="typescript"><code>console.log("hello");</code></pre>'
    );
  });

  it('should use lang from code object when infostring is empty', () => {
    const options = createMarkedOptions();
    const renderer = options.renderer;

    const codeToken = { text: 'console.log("hello");', lang: 'javascript' };
    const result = renderer.code(codeToken, '');
    assert.strictEqual(
      result,
      '<pre is="pix-highlighter" lang="javascript"><code>console.log("hello");</code></pre>'
    );
  });

  it('should escape HTML in code content', () => {
    const options = createMarkedOptions();
    const renderer = options.renderer;

    const result = renderer.code('<script>alert("xss")</script>', 'html');
    assert.strictEqual(
      result,
      '<pre is="pix-highlighter" lang="html"><code>&lt;script&gt;alert("xss")&lt;/script&gt;</code></pre>'
    );
  });

  it('should handle non-string values in escapeHtml', () => {
    const options = createMarkedOptions();
    const renderer = options.renderer;

    // Test non-string code (should be converted to string)
    const result = renderer.code(123, 'text');
    assert.strictEqual(result, '<pre is="pix-highlighter" lang="text"><code>123</code></pre>');
  });

  it('should render images with lazy attributes and noscript fallback', () => {
    const md = '![Alt text](../assets/images/example.jpg "Title")';
    const html = marked(md, createMarkedOptions());
    // data-src and lazy attrs present
    if (!html.includes('data-src="../assets/images/example.jpg"'))
      throw new Error('data-src missing');
    if (!html.includes('loading="lazy"')) throw new Error('loading lazy missing');
    if (!html.includes('<noscript><img src="../assets/images/example.jpg"'))
      throw new Error('noscript fallback missing');
  });

  it('should support srcset/sizes meta and keep them in noscript', () => {
    const md =
      '![Alt text](../assets/images/example.jpg "Hero | srcset=../img/320.jpg 320w, ../img/640.jpg 640w | sizes=(max-width: 640px) 100vw, 640px")';
    const html = marked(md, createMarkedOptions());
    if (!html.includes('data-srcset="../img/320.jpg 320w, ../img/640.jpg 640w"'))
      throw new Error('data-srcset missing');
    if (!html.includes('data-sizes="(max-width: 640px) 100vw, 640px"'))
      throw new Error('data-sizes missing');
    if (!html.includes('<noscript>')) throw new Error('noscript missing');
    if (!html.includes('srcset="../img/320.jpg 320w, ../img/640.jpg 640w"'))
      throw new Error('noscript srcset missing');
    if (!html.includes('sizes="(max-width: 640px) 100vw, 640px"'))
      throw new Error('noscript sizes missing');
  });

  it('should render eager/high-priority images with real srcset/sizes', () => {
    const md =
      '![Alt text](../assets/images/example.jpg "Hero | loading=eager | priority=high | srcset=../img/320.jpg 320w, ../img/640.jpg 640w | sizes=100vw")';
    const html = marked(md, createMarkedOptions());
    if (html.includes('<noscript>'))
      throw new Error('noscript should not be present for eager images');
    if (!html.includes('loading="eager"')) throw new Error('loading eager missing');
    if (!html.includes('fetchpriority="high"')) throw new Error('priority high missing');
    if (!html.includes(' srcset="../img/320.jpg 320w, ../img/640.jpg 640w"'))
      throw new Error('srcset missing');
    if (!html.includes(' sizes="100vw"')) throw new Error('sizes missing');
  });
});
