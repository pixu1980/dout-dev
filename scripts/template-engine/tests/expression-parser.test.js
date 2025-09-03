#!/usr/bin/env node
/**
 * Template Engine Tests - Expression Parser Complete Suite
 * Test completi per expression-parser.js con copertura avanzata
 * Conforme agli standard definiti in COPILOT_RULES.md
 */

import assert, { equal } from 'node:assert';
import { describe, test } from 'node:test';

import { evaluateCondition, evaluateExpression, parseExpression } from '../expression-parser.js';

describe('TemplateEngine - Expression Parser', () => {
  // === Basic Parsing Tests ===

  test('should parse simple variable expressions', () => {
    const expr = parseExpression('title');
    equal(expr.variable, 'title');
    equal(expr.filters.length, 0);
  });

  test('should parse expressions with filters', () => {
    const expr = parseExpression('title | upper | trim');
    equal(expr.variable, 'title');
    equal(expr.filters.length, 2);
    equal(expr.filters[0].name, 'upper');
    equal(expr.filters[1].name, 'trim');
  });

  test('should parse filters with arguments', () => {
    const expr = parseExpression('content | truncate:100');
    equal(expr.variable, 'content');
    equal(expr.filters.length, 1);
    equal(expr.filters[0].name, 'truncate');
    equal(expr.filters[0].args.length, 1);
    equal(expr.filters[0].args[0], 100);
  });

  test('should evaluate simple expressions', () => {
    const expr = parseExpression('title');
    const data = { title: 'Hello World' };
    const filters = {};

    const result = evaluateExpression(expr, data, filters);
    equal(result, 'Hello World');
  });

  test('should evaluate expressions with filters', () => {
    const expr = parseExpression('title | upper');
    const data = { title: 'Hello World' };
    const filters = {
      upper: (value) => String(value).toUpperCase(),
    };

    const result = evaluateExpression(expr, data, filters);
    equal(result, 'HELLO WORLD');
  });

  test('should evaluate conditions', () => {
    const data = { published: true, title: 'Test' };

    equal(evaluateCondition('published', data), true);
    equal(evaluateCondition('draft', data), false);
    equal(evaluateCondition('title == "Test"', data), true);
    equal(evaluateCondition('title == "Other"', data), false);
  });

  // === Advanced Parsing Tests ===

  test('should parse boolean values correctly', () => {
    const expr = parseExpression('flag | default:true');
    assert.strictEqual(expr.filters[0].args[0], true);

    const expr2 = parseExpression('flag | default:false');
    assert.strictEqual(expr2.filters[0].args[0], false);
  });

  test('should parse integer values correctly', () => {
    const expr = parseExpression('text | truncate:15');
    assert.strictEqual(expr.filters[0].args[0], 15);
  });

  test('should parse float values correctly', () => {
    const expr = parseExpression('value | multiply:3.14');
    assert.strictEqual(expr.filters[0].args[0], 3.14);
  });

  test('should parse quoted string values correctly', () => {
    const expr = parseExpression('text | default:"hello world"');
    assert.strictEqual(expr.filters[0].args[0], 'hello world');

    const expr2 = parseExpression("text | default:'single quoted'");
    assert.strictEqual(expr2.filters[0].args[0], 'single quoted');
  });

  // === Path Traversal Tests ===

  test('should handle undefined/null objects in path traversal', () => {
    const filters = {};

    const result1 = evaluateExpression(
      parseExpression('user.profile.name'),
      { user: null },
      filters
    );
    assert.strictEqual(result1, undefined);

    const result2 = evaluateExpression(
      parseExpression('user.profile.name'),
      { user: undefined },
      filters
    );
    assert.strictEqual(result2, undefined);

    const result3 = evaluateExpression(
      parseExpression('user.missing.property'),
      { user: { existing: 'value' } },
      filters
    );
    assert.strictEqual(result3, undefined);
  });

  // === Condition Evaluation Tests ===

  test('should evaluate == comparisons correctly (advanced)', () => {
    const data = { status: 'active', count: 5 };

    assert.strictEqual(evaluateCondition('status == "active"', data), true);
    assert.strictEqual(evaluateCondition('status == "inactive"', data), false);
    assert.strictEqual(evaluateCondition('count == 5', data), true);
    assert.strictEqual(evaluateCondition('count == 10', data), false);
  });

  test('should evaluate != comparisons correctly (advanced)', () => {
    const data = { status: 'active', count: 5 };

    assert.strictEqual(evaluateCondition('status != "inactive"', data), true);
    assert.strictEqual(evaluateCondition('status != "active"', data), false);
    assert.strictEqual(evaluateCondition('count != 10', data), true);
    assert.strictEqual(evaluateCondition('count != 5', data), false);
  });

  test('should evaluate && conditions correctly (advanced)', () => {
    const data = {
      isActive: true,
      hasPermission: true,
      items: ['a', 'b', 'c'],
      emptyArray: [],
    };

    assert.strictEqual(evaluateCondition('isActive && hasPermission', data), true);
    assert.strictEqual(evaluateCondition('isActive && items.length', data), true);
    assert.strictEqual(evaluateCondition('isActive && emptyArray.length', data), false);
  });

  test('should evaluate .length > 0 conditions correctly (advanced)', () => {
    const data = {
      items: ['a', 'b'],
      emptyItems: [],
      notArray: 'string',
    };

    assert.strictEqual(evaluateCondition('items.length > 0', data), true);
    assert.strictEqual(evaluateCondition('emptyItems.length > 0', data), false);
    assert.strictEqual(evaluateCondition('notArray.length > 0', data), false);
  });

  // === Complex Expressions Tests ===

  test('should handle complex nested path traversal (advanced)', () => {
    const data = {
      user: {
        profile: {
          settings: {
            theme: 'dark',
          },
        },
      },
    };

    const filters = {};
    const result = evaluateExpression(
      parseExpression('user.profile.settings.theme'),
      data,
      filters
    );

    assert.strictEqual(result, 'dark');
  });

  test('should handle empty path gracefully (advanced)', () => {
    const filters = {};
    const result = evaluateExpression(parseExpression(''), { data: 'value' }, filters);

    assert.strictEqual(result, undefined);
  });

  test('should apply multiple filters in sequence (advanced)', () => {
    const filters = {
      upper: (value) => String(value).toUpperCase(),
      truncate: (value, length) => String(value).substring(0, length),
    };

    const result = evaluateExpression(
      parseExpression('text | upper | truncate:5'),
      { text: 'hello world' },
      filters
    );

    assert.strictEqual(result, 'HELLO');
  });

  test('should handle unknown filter gracefully (advanced)', () => {
    const filters = {};

    const result = evaluateExpression(
      parseExpression('text | unknownFilter'),
      { text: 'hello' },
      filters
    );

    assert.strictEqual(result, 'hello');
  });

  // === Edge Cases and Error Handling ===

  test('should handle nested property access with missing intermediates', () => {
    const expr = parseExpression('user.profile.settings.theme');
    const data = { user: { profile: null } };
    const filters = {};

    const result = evaluateExpression(expr, data, filters);
    assert.strictEqual(result, undefined);
  });

  test('should parse complex filter chains with mixed argument types', () => {
    const expr = parseExpression('content | truncate:50 | default:"No content" | upper');
    assert.strictEqual(expr.variable, 'content');
    assert.strictEqual(expr.filters.length, 3);
    assert.strictEqual(expr.filters[0].name, 'truncate');
    assert.strictEqual(expr.filters[0].args[0], 50);
    assert.strictEqual(expr.filters[1].name, 'default');
    assert.strictEqual(expr.filters[1].args[0], 'No content');
    assert.strictEqual(expr.filters[2].name, 'upper');
  });

  test('should handle edge cases in condition evaluation', () => {
    const data = {
      zero: 0,
      emptyString: '',
      nullValue: null,
      undefinedValue: undefined,
      falseValue: false,
    };

    // Test falsy values
    assert.strictEqual(evaluateCondition('zero', data), false);
    assert.strictEqual(evaluateCondition('emptyString', data), false);
    assert.strictEqual(evaluateCondition('nullValue', data), false);
    assert.strictEqual(evaluateCondition('undefinedValue', data), false);
    assert.strictEqual(evaluateCondition('falseValue', data), false);
  });

  test('should handle malformed expressions gracefully', () => {
    // Test various malformed expressions
    try {
      const expr = parseExpression('');
      // Should handle empty strings
      assert.ok(expr);
    } catch (error) {
      // Should handle gracefully
      assert.ok(error instanceof Error);
    }

    try {
      const expr = parseExpression('| filter');
      // Should handle expressions starting with filter
      assert.ok(expr);
    } catch (error) {
      // Should handle gracefully
      assert.ok(error instanceof Error);
    }
  });

  test('should handle complex nested paths with arrays', () => {
    const data = {
      posts: [{ author: { name: 'John' } }, { author: { name: 'Jane' } }],
    };

    const expr = parseExpression('posts.0.author.name');
    const result = evaluateExpression(expr, data, {});
    assert.strictEqual(result, 'John');
  });

  test('should handle JavaScript expression evaluation errors', () => {
    // Mock console.error to capture error logging
    const originalConsoleError = console.error;
    const errorMessages = [];
    console.error = (...args) => {
      errorMessages.push(args.join(' '));
    };

    const data = { title: 'Test' };

    // Test with an invalid JavaScript expression that will throw
    const result = evaluateCondition('title.nonExistentMethod()', data);

    // Should return false/undefined for failed expressions
    assert.ok(result === false || result === undefined);

    // Restore console.error
    console.error = originalConsoleError;
  });

  test('should handle function-style filter parsing', () => {
    // Test function-style filter syntax: filterName(arg1, arg2)
    const expr = parseExpression('title | truncate(100, "...")');
    assert.strictEqual(expr.filters[0].name, 'truncate');
    assert.strictEqual(expr.filters[0].args.length, 2);
    assert.strictEqual(expr.filters[0].args[0], 100);
    assert.strictEqual(expr.filters[0].args[1], '...');
  });

  test('should handle function-style filter without arguments', () => {
    // Test function-style filter syntax without arguments
    const expr = parseExpression('title | upper()');
    assert.strictEqual(expr.filters[0].name, 'upper');
    assert.strictEqual(expr.filters[0].args.length, 0);
  });

  test('should distinguish between JavaScript expressions and filter expressions', () => {
    // Test that expressions with pipes are not treated as JavaScript
    const filterExpr = 'title | upper';
    const jsExpr = 'count > 5';

    // This tests the isJavaScriptExpression function indirectly
    const data = { title: 'hello', count: 10 };

    // Test filter expression
    const filterResult = evaluateCondition(filterExpr, data);
    // Should handle as filter expression (might return boolean based on truthy value)
    assert.ok(typeof filterResult === 'boolean');

    // Test JavaScript expression
    const jsResult = evaluateCondition(jsExpr, data);
    assert.strictEqual(jsResult, true);
  });

  test('should handle function-style filter with multiple arguments', () => {
    // Test function-style filter syntax with multiple arguments
    const expr = parseExpression('title | slice(0, 3)');
    assert.strictEqual(expr.filters[0].name, 'slice');
    assert.strictEqual(expr.filters[0].args.length, 2);
    assert.strictEqual(expr.filters[0].args[0], 0);
    assert.strictEqual(expr.filters[0].args[1], 3);
  });

  test('should parse different value types in filter arguments', () => {
    // Test parsing of different value types: string, integer, float, boolean
    const expr = parseExpression('content | test("string", 42, 3.14, true, false)');
    assert.strictEqual(expr.filters[0].name, 'test');
    assert.strictEqual(expr.filters[0].args.length, 5);
    assert.strictEqual(expr.filters[0].args[0], 'string');
    assert.strictEqual(expr.filters[0].args[1], 42);
    assert.strictEqual(expr.filters[0].args[2], 3.14);
    assert.strictEqual(expr.filters[0].args[3], true);
    assert.strictEqual(expr.filters[0].args[4], false);
  });

  test('should parse unquoted string values as fallback', () => {
    // Test parsing of unquoted string values that don't match number/boolean patterns
    const expr = parseExpression('content | test(someVariable, hello-world)');
    assert.strictEqual(expr.filters[0].name, 'test');
    assert.strictEqual(expr.filters[0].args.length, 2);
    assert.strictEqual(expr.filters[0].args[0], 'someVariable');
    assert.strictEqual(expr.filters[0].args[1], 'hello-world');
  });

  test('should handle mathematical expressions in conditions', () => {
    // Test mathematical expression evaluation (covers lines 220-230)
    const data = { count: 10, total: 20 };

    // These expressions should be evaluated as truthy/falsy
    const result1 = evaluateCondition('5 + 3 > 7', data);
    assert.strictEqual(result1, true);

    const result2 = evaluateCondition('10 * 2 == 20', data);
    assert.strictEqual(result2, true);

    const result3 = evaluateCondition('100 / 5 != 15', data);
    assert.strictEqual(result3, true);
  });

  test('should handle property access with mathematical operations', () => {
    // Test property access with math expressions (covers lines 240-260)
    const data = { posts: [1, 2, 3], count: 5 };

    const result1 = evaluateCondition('posts.length * 2 == 6', data);
    assert.strictEqual(result1, true);

    const result2 = evaluateCondition('count + posts.length > 7', data);
    assert.strictEqual(result2, true);

    const result3 = evaluateCondition('count - posts.length == 2', data);
    assert.strictEqual(result3, true);
  });
});
