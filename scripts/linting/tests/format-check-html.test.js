#!/usr/bin/env node

/**
 * Test: HTML Format Checker
 */

import { test } from 'node:test';
import assert from 'node:assert';
import { checkHTMLFormatting } from '../format-check-html.js';

test('checkHTMLFormatting function exists', () => {
  assert.equal(typeof checkHTMLFormatting, 'function');
});

test('checkHTMLFormatting can be called', async () => {
  try {
    const result = await checkHTMLFormatting();
    // Should return an object with success property
    assert.ok(typeof result === 'object');
    assert.ok('success' in result);
    assert.ok('message' in result);
  } catch (error) {
    // Should not throw anymore
    assert.fail(`Function should not throw: ${error.message}`);
  }
});
