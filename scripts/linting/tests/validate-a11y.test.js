#!/usr/bin/env node

/**
 * Test: Accessibility Validator
 */

import { test } from 'node:test';
import assert from 'node:assert';
import { validateA11y } from '../validate-a11y.js';

test('validateA11y function exists', () => {
  assert.equal(typeof validateA11y, 'function');
});

test('validateA11y can be called', async () => {
  try {
    const result = await validateA11y();
    // Should return an object with success property
    assert.ok(typeof result === 'object');
    assert.ok('success' in result);
    assert.ok('message' in result);
  } catch (error) {
    // Should not throw anymore
    assert.fail(`Function should not throw: ${error.message}`);
  }
});
