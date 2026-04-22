import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import {
  evaluateCondition,
  evaluateExpression,
  parseExpression,
} from '../../code/public/expression-parser.js';

describe('skill-pack expression parser', () => {
  test('parses filter chains with typed arguments', () => {
    const expression = parseExpression('content | truncate:50 | default:"Untitled"');

    assert.equal(expression.variable, 'content');
    assert.equal(expression.filters.length, 2);
    assert.equal(expression.filters[0].name, 'truncate');
    assert.equal(expression.filters[0].args[0], 50);
    assert.equal(expression.filters[1].args[0], 'Untitled');
  });

  test('evaluates JavaScript-like expressions with array length', () => {
    const condition = evaluateCondition('items.length > 0 && published', {
      items: ['a'],
      published: true,
    });

    assert.equal(condition, true);
  });

  test('applies registered filters during evaluation', () => {
    const result = evaluateExpression(
      parseExpression('title | upper'),
      { title: 'portable engine' },
      {
        upper: (value) => String(value).toUpperCase(),
      }
    );

    assert.equal(result, 'PORTABLE ENGINE');
  });
});
