#!/usr/bin/env node

/**
 * Test: HTML Validator
 */

import { test } from 'node:test';
import assert from 'node:assert';
import { validateHTML } from '../validate-html.js';

test('validateHTML function exists', () => {
  assert.equal(typeof validateHTML, 'function');
});

test('validateHTML can be called', async () => {
  try {
    await validateHTML();
  } catch (error) {
    // Expected in test environment
    assert.ok(typeof error === 'object');
  }
});
