function parseFilter(filterString) {
  const trimmed = filterString.trim();
  const functionMatch = trimmed.match(/^([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(([^)]*)\)$/);

  if (functionMatch) {
    const name = functionMatch[1];
    const argsString = functionMatch[2].trim();
    const args = argsString ? argsString.split(',').map((arg) => parseValue(arg.trim())) : [];
    return { name, args };
  }

  const parts = trimmed.split(':').map((part) => part.trim());
  return {
    name: parts[0],
    args: parts.slice(1).map(parseValue),
  };
}

function parseValue(value) {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }

  if (/^\d+$/.test(value)) {
    return parseInt(value, 10);
  }

  if (/^\d+\.\d+$/.test(value)) {
    return parseFloat(value);
  }

  if (value === 'true') return true;
  if (value === 'false') return false;

  return value;
}

function getSimpleValueFromPath(objectValue, pathValue) {
  if (!pathValue || !objectValue) return undefined;

  const normalizedPath = pathValue.replace(/\[(\d+)\]/g, '.$1');
  const keys = normalizedPath.split('.');
  let current = objectValue;

  for (const key of keys) {
    if (current === null || current === undefined) {
      return undefined;
    }
    current = current[key];
  }

  return current;
}

function getValueFromPath(objectValue, pathValue) {
  if (!pathValue || !objectValue) return undefined;

  const mathExpressionPattern = /^[\d\s+\-*/().]+$/;
  if (mathExpressionPattern.test(pathValue)) {
    try {
      return Function(`"use strict"; return (${pathValue})`)();
    } catch (_error) {
      console.warn(`Failed to evaluate math expression: ${pathValue}`);
      return pathValue;
    }
  }

  if (
    pathValue.includes('*') ||
    pathValue.includes('+') ||
    pathValue.includes('-') ||
    pathValue.includes('/')
  ) {
    try {
      let expression = pathValue;
      const pathPattern = /([a-zA-Z_$][a-zA-Z0-9_$.]*)/g;

      expression = expression.replace(pathPattern, (match) => {
        if (/^\d+$/.test(match) || match.startsWith('Math.')) {
          return match;
        }

        const value = getSimpleValueFromPath(objectValue, match);
        return value !== undefined ? value : match;
      });

      return Function(`"use strict"; return (${expression})`)();
    } catch (_error) {
      console.warn(`Failed to evaluate expression: ${pathValue}`);
      return getSimpleValueFromPath(objectValue, pathValue);
    }
  }

  return getSimpleValueFromPath(objectValue, pathValue);
}

function evaluateJavaScriptExpression(expressionString, data, filters) {
  try {
    let processedExpression = expressionString.replace(/\band\b/g, '&&').replace(/\bor\b/g, '||');

    const rewritePipes = (input) => {
      let changed = true;
      let output = input;
      const pipePattern = /\(([^()]*?)\s\|\s*([a-zA-Z_$][a-zA-Z0-9_$]*)\s*(?::\s*([^)]*?))?\)/g;

      while (changed) {
        changed = false;
        output = output.replace(pipePattern, (_match, inner, filterName, filterArgs) => {
          changed = true;
          const argsList = filterArgs?.trim()
            ? ',' +
              filterArgs
                .split(':')
                .map((argument) => argument.trim())
                .filter(Boolean)
                .join(',')
            : '';
          return `__applyFilter('${filterName}', (${inner})${argsList})`;
        });
      }

      return output;
    };

    processedExpression = rewritePipes(processedExpression);

    const lengthPattern = /([a-zA-Z_$][a-zA-Z0-9_$.[\]]*)\.length\b/g;
    const safeExpression = processedExpression.replace(
      lengthPattern,
      (_match, pathValue) => `__len("${pathValue}")`
    );

    const evaluate = new Function(
      'data',
      'getVal',
      'filters',
      '__applyFilter',
      `with(data) { const __len = (pathValue) => { const value = getVal(data, pathValue); return Array.isArray(value) ? value.length : 0; }; return (${safeExpression}); }`
    );

    const applyFilter = (name, value, ...args) => {
      try {
        if (filters && typeof filters[name] === 'function') {
          return filters[name](value, ...args);
        }
        console.warn(`Unknown filter in JS expression: ${name}`);
        return value;
      } catch (error) {
        console.warn(`Filter '${name}' failed:`, error?.message || error);
        return value;
      }
    };

    return evaluate(data, getSimpleValueFromPath, filters || {}, applyFilter);
  } catch (error) {
    console.error(`Failed to evaluate expression: ${expressionString}`, error);
    return undefined;
  }
}

export function isJavaScriptExpression(expressionString) {
  if (
    expressionString.includes('|') &&
    !expressionString.includes('||') &&
    !expressionString.includes('&&')
  ) {
    return false;
  }

  const javascriptOperators = [
    '+',
    '-',
    '*',
    '/',
    '%',
    '>',
    '<',
    '>=',
    '<=',
    '==',
    '===',
    '!=',
    '!==',
    '&&',
    '||',
    '!',
    '?',
    ':',
    '(',
    ')',
  ];

  return javascriptOperators.some((operator) => {
    if (operator === '+' || operator === '-') {
      const pattern = new RegExp(
        `[^'"]\\s*\\${operator.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*[^'"]`
      );
      return pattern.test(expressionString);
    }
    return expressionString.includes(operator);
  });
}

export function parseExpression(expressionString) {
  const trimmed = expressionString.trim();

  if (isJavaScriptExpression(trimmed)) {
    return {
      variable: null,
      filters: [],
      jsExpression: trimmed,
      toString: () => expressionString,
    };
  }

  const parts = trimmed.split('|').map((part) => part.trim());
  return {
    variable: parts[0],
    filters: parts.slice(1).map(parseFilter),
    jsExpression: null,
    toString: () => expressionString,
  };
}

export function evaluateExpression(expression, data, filters) {
  if (expression.jsExpression) {
    return evaluateJavaScriptExpression(expression.jsExpression, data, filters || {});
  }

  let value = getValueFromPath(data, expression.variable);

  for (const filter of expression.filters) {
    if (filters[filter.name]) {
      value = filters[filter.name](value, ...filter.args);
    } else {
      console.warn(`Unknown filter: ${filter.name}`);
    }
  }

  return value;
}

export function evaluateCondition(condition, data) {
  const parsed = parseExpression(condition);
  return Boolean(evaluateExpression(parsed, data, {}));
}
