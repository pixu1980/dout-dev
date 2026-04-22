import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { registerBuiltinFilters } from '../../code/public/filters.js';

function createFilterRegistry() {
  const filters = new Map();
  registerBuiltinFilters({
    registerFilter(name, fn) {
      filters.set(name, fn);
    },
  });
  return filters;
}

describe('skill-pack builtin filters', () => {
  test('registers markdown and slug helpers', () => {
    const filters = createFilterRegistry();

    assert.equal(filters.get('slug')('Hello Portable World!'), 'hello-portable-world');
    assert.match(filters.get('md')('# Portable Title'), /<h1/i);
  });

  test('keeps helpers used by include data payloads', () => {
    const filters = createFilterRegistry();

    assert.equal(filters.get('json')({ title: 'Card' }), '{"title":"Card"}');
    assert.equal(filters.get('raw')('<b>bold</b>'), '<b>bold</b>');
    assert.equal(filters.get('absUrl')('tags/css.html'), '/tags/css.html');
  });
});
