// Template Engine - Expression Parser
// Simple expression parser for template variables and filters

/**
 * Parse a template expression like "variable | filter1 | filter2:arg"
 * or JavaScript expressions like "a > b", "x + y", etc.
 * @param {string} expression - The expression to parse
 * @returns {object} Parsed expression object
 */
export function parseExpression(expression) {
  const trimmed = expression.trim();

  // Check if this is a JavaScript expression (contains operators)
  if (isJavaScriptExpression(trimmed)) {
    return {
      variable: null,
      filters: [],
      jsExpression: trimmed,
      toString: () => expression,
    };
  }

  // Split by pipe character to separate variable from filters
  const parts = trimmed.split('|').map((part) => part.trim());
  const variable = parts[0];
  const filters = parts.slice(1).map(parseFilter);

  return {
    variable,
    filters,
    jsExpression: null,
    toString: () => expression,
  };
}

/**
 * Check if expression contains JavaScript operators
 * @param {string} expression - Expression to check
 * @returns {boolean} True if contains JS operators
 */
function isJavaScriptExpression(expression) {
  // First check: if it contains a single pipe character (not || or &&), it's a filter expression
  if (expression.includes('|') && !expression.includes('||') && !expression.includes('&&')) {
    return false;
  }

  // Common JavaScript operators and patterns
  const jsOperators = [
    '+',
    '-',
    '*',
    '/',
    '%', // arithmetic (but check it's not in string)
    '>',
    '<',
    '>=',
    '<=',
    '==',
    '===',
    '!=',
    '!==', // comparison
    '&&',
    '||',
    '!', // logical
    '?',
    ':', // ternary
    '(',
    ')', // grouping
  ];

  // Check for operators that indicate JavaScript expressions
  const hasJsOperator = jsOperators.some((op) => {
    if (op === '+' || op === '-') {
      // Only treat as JS if surrounded by non-string contexts
      const regex = new RegExp(`[^'"]\\s*\\${op.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*[^'"]`);
      return regex.test(expression);
    }
    return expression.includes(op);
  });

  // If it contains JS operators, it's a JS expression
  if (hasJsOperator) {
    return true;
  }

  return false;
} /**
 * Parse a filter with optional arguments
 * Support both "filterName:arg1:arg2" and "filterName(arg1, arg2)" syntax
 * @param {string} filterStr - Filter string
 * @returns {object} Filter object
 */
function parseFilter(filterStr) {
  const trimmed = filterStr.trim();

  // Check for function-style syntax: filterName(arg1, arg2)
  const functionMatch = trimmed.match(/^([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(([^)]*)\)$/);
  if (functionMatch) {
    const name = functionMatch[1];
    const argsStr = functionMatch[2].trim();
    const args = argsStr ? argsStr.split(',').map((arg) => parseValue(arg.trim())) : [];
    return { name, args };
  }

  // Fall back to colon syntax: filterName:arg1:arg2
  const parts = trimmed.split(':').map((part) => part.trim());
  const name = parts[0];
  const args = parts.slice(1).map(parseValue);

  return { name, args };
}

/**
 * Parse a value, attempting to convert to appropriate type
 * @param {string} value - Value string
 * @returns {any} Parsed value
 */
function parseValue(value) {
  // Remove quotes if present
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }

  // Try to parse as number
  if (/^\d+$/.test(value)) {
    return parseInt(value, 10);
  }

  if (/^\d+\.\d+$/.test(value)) {
    return parseFloat(value);
  }

  // Try to parse as boolean
  if (value === 'true') return true;
  if (value === 'false') return false;

  // Return as string
  return value;
}

/**
 * Evaluate an expression against data context
 * @param {object} expression - Parsed expression
 * @param {object} data - Data context
 * @param {object} filters - Available filters
 * @returns {any} Evaluated value
 */
export function evaluateExpression(expression, data, filters) {
  // Handle JavaScript expressions
  if (expression.jsExpression) {
    return evaluateJavaScriptExpression(expression.jsExpression, data, filters || {});
  }

  // Get initial value from data for regular variable expressions
  let value = getValueFromPath(data, expression.variable);

  // Apply filters in sequence
  for (const filter of expression.filters) {
    if (filters[filter.name]) {
      value = filters[filter.name](value, ...filter.args);
    } else {
      console.warn(`Unknown filter: ${filter.name}`);
    }
  }

  return value;
}

/**
 * Safely evaluate a JavaScript expression with data context
 * @param {string} jsExpr - JavaScript expression
 * @param {object} data - Data context
 * @returns {any} Evaluation result
 */
function evaluateJavaScriptExpression(jsExpr, data, filters) {
  try {
    // Convert template-style logical operators to JavaScript operators
    let processedExpr = jsExpr.replace(/\band\b/g, '&&').replace(/\bor\b/g, '||');

    // Support filter pipes inside JS expressions when wrapped in parentheses, e.g. (tag | slugify)
    // Rewrites "(value | filter:arg1:arg2)" to "__applyFilter('filter', (value), arg1, arg2)"
    const rewritePipes = (expr) => {
      let changed = true;
      let out = expr;
      const pipeRegex = /\(([^()]*?)\s\|\s*([a-zA-Z_$][a-zA-Z0-9_$]*)\s*(?::\s*([^)]*?))?\)/g;
      while (changed) {
        changed = false;
        out = out.replace(pipeRegex, (_m, inner, fname, args) => {
          changed = true;
          const argsList = args?.trim()
            ? ',' +
              args
                .split(':')
                .map((a) => a.trim())
                .filter(Boolean)
                .join(',')
            : '';
          return `__applyFilter('${fname}', (${inner})${argsList})`;
        });
      }
      return out;
    };

    processedExpr = rewritePipes(processedExpr);

    // Preprocess `.length` access: for expressions like `items.length > 0`
    // treat length as array-only: if the base is not an array, length should be 0
  const lengthRegex = /([a-zA-Z_$][a-zA-Z0-9_$.[\]]*)\.length\b/g;
    const modifiedExpr = processedExpr.replace(lengthRegex, (_, path) => `__len("${path}")`);

    // Use the data object with a helper __len that uses getSimpleValueFromPath
    const func = new Function(
      'data',
      'getVal',
      'filters',
      '__applyFilter',
      `with(data) { const __len = (p) => { const v = getVal(data, p); return Array.isArray(v) ? v.length : 0; }; return (${modifiedExpr}); }`
    );

    const applyFilter = (name, value, ...args) => {
      try {
        if (filters && typeof filters[name] === 'function') {
          return filters[name](value, ...args);
        }
        console.warn(`Unknown filter in JS expression: ${name}`);
        return value;
      } catch (e) {
        console.warn(`Filter '${name}' failed:`, e?.message || e);
        return value;
      }
    };

    return func(data, getSimpleValueFromPath, filters || {}, applyFilter);
  } catch (error) {
    console.error(`Failed to evaluate expression: ${jsExpr}`, error);
    return undefined;
  }
} /**
 * Create a safe context for expression evaluation
 * @param {object} data - Original data
 * @returns {object} Safe context
 */
function _createSafeContext(data) {
  // Flatten nested objects to make them accessible in with() statement
  const context = {};

  function addToContext(obj, prefix = '') {
    for (const [key, value] of Object.entries(obj)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      context[fullKey] = value;

      // Also add without prefix for top-level access
      if (!prefix) {
        context[key] = value;
      }

      // If value is object, recurse
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        addToContext(value, fullKey);
      }
    }
  }

  addToContext(data);
  return context;
}

/**
 * Process variable references in expression
 * @param {string} expr - JavaScript expression
 * @param {object} context - Evaluation context
 * @returns {string} Processed expression
 */
function _processVariableReferences(expr, _context) {
  // For now, return as-is since we're using with() statement
  // which provides direct access to context properties
  return expr;
}

/**
 * Get value from object using dot notation path or evaluate simple expressions
 * @param {object} obj - Object to search
 * @param {string} path - Dot notation path or expression
 * @returns {any} Found value or evaluated result
 */
function getValueFromPath(obj, path) {
  if (!path || !obj) return undefined;

  // Check if it's a simple mathematical expression (numbers and basic operators)
  const mathExprRegex = /^[\d\s+\-*/().]+$/;
  if (mathExprRegex.test(path)) {
    try {
      // Safely evaluate simple math expressions
      return Function(`"use strict"; return (${path})`)();
  } catch (_error) {
      console.warn(`Failed to evaluate math expression: ${path}`);
      return path; // Return original if evaluation fails
    }
  }

  // Check for property access with expressions (like posts.length * 2)
  if (path.includes('*') || path.includes('+') || path.includes('-') || path.includes('/')) {
    try {
      // Replace object paths with their values
      let expression = path;
      const pathRegex = /([a-zA-Z_$][a-zA-Z0-9_$.]*)/g;

      expression = expression.replace(pathRegex, (match) => {
        // Don't replace if it's just a number or Math
        if (/^\d+$/.test(match) || match.startsWith('Math.')) {
          return match;
        }

        // Get the value from the data object
        const value = getSimpleValueFromPath(obj, match);
        return value !== undefined ? value : match;
      });

      // Safely evaluate the expression
      return Function(`"use strict"; return (${expression})`)();
  } catch (_error) {
      console.warn(`Failed to evaluate expression: ${path}`);
      return getSimpleValueFromPath(obj, path);
    }
  }

  return getSimpleValueFromPath(obj, path);
}

/**
 * Simple path resolution without expression evaluation
 * @param {object} obj - Object to search
 * @param {string} path - Dot notation path (supports array access like posts[0])
 * @returns {any} Found value or undefined
 */
function getSimpleValueFromPath(obj, path) {
  if (!path || !obj) return undefined;

  // Handle array access notation: posts[0] becomes posts.0
  const normalizedPath = path.replace(/\[(\d+)\]/g, '.$1');

  const keys = normalizedPath.split('.');
  let current = obj;

  for (const key of keys) {
    if (current === null || current === undefined) {
      return undefined;
    }
    current = current[key];
  }

  return current;
}

/**
 * Check if a condition expression is truthy
 * @param {string} condition - Condition expression
 * @param {object} data - Data context
 * @returns {boolean} Condition result
 */
export function evaluateCondition(condition, data) {
  // Parse the condition as an expression
  const parsed = parseExpression(condition);

  // Evaluate it and convert to boolean
  const result = evaluateExpression(parsed, data, {});
  return Boolean(result);
}

// Export for testing
export { isJavaScriptExpression };
