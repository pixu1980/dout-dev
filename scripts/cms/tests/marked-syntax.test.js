import { describe, it } from 'node:test';
import assert from 'node:assert';
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
    assert.strictEqual(
      result,
      '<pre is="pix-highlighter" lang="text"><code>123</code></pre>'
    );
  });
});
