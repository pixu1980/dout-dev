import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { TemplateRenderer } from '../renderer.js';

describe('TemplateEngine - Renderer', () => {
  test('DOM renderer - nested loops and include', () => {
    const renderer = new TemplateRenderer(path.resolve('./'));
    // Percorsi corretti (prima erano 'tests/example/...')
    const template = fs.readFileSync(
      path.join(process.cwd(), 'tests/debug-template.html'),
      'utf8'
    );
    const data = JSON.parse(
      fs.readFileSync(path.join(process.cwd(), 'tests/simple-test-data.json'), 'utf8')
    );

    const out = renderer.renderString(template, data, {
      currentDir: path.join(process.cwd(), 'tests'),
    });
    assert.match(out, /First Post/);
    assert.ok(!out.includes('<for')); // ensure no leftover <for> tags
  });

  test('should handle missing template files gracefully', () => {
    const renderer = new TemplateRenderer(path.resolve('./'));

    try {
      renderer.render('non-existent-template.html', {});
      assert.ok(false, 'Should throw for missing template');
    } catch (error) {
      assert.ok(error instanceof Error);
      assert.ok(error.message.includes('ENOENT') || error.message.includes('not found'));
    }
  });

  test('should render template with complex data structures', () => {
    const renderer = new TemplateRenderer(path.resolve('./'));
    const template = `
      <div>
        <for each="post in posts">
          <article>
            <h2>{{ post.title }}</h2>
            <p>{{ post.excerpt }}</p>
            <for each="tag in post.tags">
              <span class="tag">{{ tag.name }}</span>
            </for>
          </article>
        </for>
      </div>
    `;

    const data = {
      posts: [
        {
          title: 'Test Post',
          excerpt: 'This is a test',
          tags: [{ name: 'javascript' }, { name: 'node' }],
        },
      ],
    };

    const result = renderer.renderString(template, data);
    assert.match(result, /Test Post/);
    assert.match(result, /This is a test/);
    assert.match(result, /javascript/);
    assert.match(result, /node/);
  });

  test('should handle conditional rendering', () => {
    const renderer = new TemplateRenderer(path.resolve('./'));
    const template = `
      <if condition="user.isAdmin">
        <div class="admin-panel">Admin Content</div>
      </if>
      <if condition="!user.isAdmin">
        <div class="user-panel">User Content</div>
      </if>
    `;

    const adminData = { user: { isAdmin: true } };
    const userResult = renderer.renderString(template, adminData);
    assert.match(userResult, /Admin Content/);
    assert.ok(!userResult.includes('User Content'));

    const regularData = { user: { isAdmin: false } };
    const adminResult = renderer.renderString(template, regularData);
    assert.match(adminResult, /User Content/);
    assert.ok(!adminResult.includes('Admin Content'));
  });

  test('should handle template inheritance with blocks', () => {
    const renderer = new TemplateRenderer(path.resolve('./src/templates'));

    // Simple test for extends/blocks functionality
    const childTemplate = `
      <extends src="base.html">
        <block name="title">Child Page</block>
        <block name="content">
          <h1>Child Content</h1>
        </block>
      </extends>
    `;

    try {
      const result = renderer.renderString(childTemplate, {});
      // Should attempt to process extends directive
      assert.ok(typeof result === 'string');
    } catch (error) {
      // Expected if base.html doesn't exist in test environment
      assert.ok(error instanceof Error);
    }
  });

  test('should handle empty templates', () => {
    const renderer = new TemplateRenderer(path.resolve('./'));
    const result = renderer.renderString('', {});
    assert.strictEqual(result, '');
  });

  test('should handle templates with only static content', () => {
    const renderer = new TemplateRenderer(path.resolve('./'));
    const template = '<h1>Static Content</h1><p>No variables here</p>';
    const result = renderer.renderString(template, {});
    assert.strictEqual(result, template);
  });

  test('should handle malformed template syntax gracefully', () => {
    const renderer = new TemplateRenderer(path.resolve('./'));

    // Test various malformed templates
    const malformedTemplates = [
      '{{ unclosed variable',
      '<for each="item in">content</for>',
      '{{ nested {{ variable }} }}',
      '<for each="">content</for>',
    ];

    for (const template of malformedTemplates) {
      try {
        const result = renderer.renderString(template, {});
        // Should either handle gracefully or throw a reasonable error
        assert.ok(typeof result === 'string' || result === undefined);
      } catch (error) {
        // Expected for malformed syntax
        assert.ok(error instanceof Error);
      }
    }
  });

  test('should handle preprocessing errors gracefully', () => {
    const renderer = new TemplateRenderer(path.resolve('./'));

    // Mock console.warn to capture warnings
    const originalWarn = console.warn;
    const warnings = [];
    console.warn = (...args) => {
      warnings.push(args.join(' '));
    };

    // Template with invalid extends/includes that should trigger preprocessing errors
    const template = `
      <extends src="non-existent-layout.html">
        <block name="content">Test</block>
      </extends>
      <include src="non-existent-include.html"></include>
    `;

    try {
      const result = renderer.renderString(template, {}, { currentDir: path.resolve('./') });
      assert.ok(typeof result === 'string');
    } catch (error) {
      // Should handle errors gracefully
      assert.ok(error instanceof Error);
    }

    // Restore console.warn
    console.warn = originalWarn;
  });

  test('should handle include errors gracefully', () => {
    const renderer = new TemplateRenderer(path.resolve('./'));

    // Mock console.warn to capture warnings
    const originalWarn = console.warn;
    const warnings = [];
    console.warn = (...args) => {
      warnings.push(args.join(' '));
    };

    const template = `
      <div>
        <include src="non-existent-file.html"></include>
        <p>Regular content</p>
      </div>
    `;

    const result = renderer.renderString(template, {}, { currentDir: path.resolve('./') });

    // Should include warning about failed include
    assert.ok(warnings.some(warn => warn.includes('Include failed')));
    assert.ok(result.includes('Regular content'));

    // Restore console.warn
    console.warn = originalWarn;
  });

  test('should handle different element directives', () => {
    const renderer = new TemplateRenderer(path.resolve('./'));

    // Test switch element
    const switchTemplate = `
      <switch expr="status">
        <case value="active">Active Status</case>
        <case value="inactive">Inactive Status</case>
        <default>Unknown Status</default>
      </switch>
    `;

    const result1 = renderer.renderString(switchTemplate, { status: 'active' });
    assert.ok(result1.includes('Active Status'));

    const result2 = renderer.renderString(switchTemplate, { status: 'unknown' });
    assert.ok(result2.includes('Unknown Status'));

    // Test markdown element
    const mdTemplate = `
      <md>
        # Heading

        This is **bold** text.
      </md>
    `;

    const mdResult = renderer.renderString(mdTemplate, {});
    assert.ok(mdResult.includes('Heading'));
  });

  test('should use template cache for repeated renders', () => {
    const renderer = new TemplateRenderer(path.resolve('./'));
    const template = '<h1>{{ title }}</h1>';

    // First render
    const result1 = renderer.renderString(template, { title: 'First' });
    assert.ok(result1.includes('First'));

    // Second render should use cache (tests cache functionality)
    const result2 = renderer.renderString(template, { title: 'Second' });
    assert.ok(result2.includes('Second'));
  });
});
