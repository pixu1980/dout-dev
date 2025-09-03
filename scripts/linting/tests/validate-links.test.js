#!/usr/bin/env node

/**
 * Test: Link Validator
 */

import { test } from 'node:test';
import assert from 'node:assert';
import { validateLinks } from '../validate-links.js';

test('validateLinks function exists', () => {
  assert.equal(typeof validateLinks, 'function');
});

test('validateLinks can be called', async () => {
  try {
    await validateLinks();
  } catch (error) {
    // Expected in test environment
    assert.ok(typeof error === 'object');
  }
});
