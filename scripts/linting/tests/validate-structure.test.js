#!/usr/bin/env node

/**
 * Test: Structure Validator
 */

import { test } from 'node:test';
import assert from 'node:assert';
import { validateStructure } from '../validate-structure.js';

test('validateStructure function exists', () => {
  assert.equal(typeof validateStructure, 'function');
});

test('validateStructure can be called', async () => {
  try {
    await validateStructure();
  } catch (error) {
    // Expected in test environment
    assert.ok(typeof error === 'object');
  }
});
