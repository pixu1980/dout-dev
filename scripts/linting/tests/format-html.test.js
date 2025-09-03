#!/usr/bin/env node

/**
 * Test: HTML Formatter
 */

import { test } from 'node:test';
import assert from 'node:assert';
import { formatHTML } from '../format-html.js';

test('formatHTML function exists', () => {
  assert.equal(typeof formatHTML, 'function');
});

test('formatHTML can be called', async () => {
  // This test just ensures the function doesn't throw when called
  try {
    const result = await formatHTML();
    // Should return an object with success property
    assert.ok(typeof result === 'object');
    assert.ok('success' in result);
    assert.ok('message' in result);
  } catch (error) {
    // Should not throw anymore
    assert.fail(`Function should not throw: ${error.message}`);
  }
});
