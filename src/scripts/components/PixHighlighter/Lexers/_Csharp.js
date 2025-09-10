import { isIdentStart, makePusher, readNumber, readString } from './_Utils.js';

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: lexer scanners are intentionally branch-heavy.
export function lexCSharp(text) {
  const KW = new Set([
    'abstract',
    'as',
    'base',
    'bool',
    'break',
    'byte',
    'case',
    'catch',
    'char',
    'checked',
    'class',
    'const',
    'continue',
    'decimal',
    'default',
    'delegate',
    'do',
    'double',
    'else',
    'enum',
    'event',
    'explicit',
    'extern',
    'false',
    'finally',
    'fixed',
    'float',
    'for',
    'foreach',
    'goto',
    'if',
    'implicit',
    'in',
    'int',
    'interface',
    'internal',
    'is',
    'lock',
    'long',
    'namespace',
    'new',
    'null',
    'object',
    'operator',
    'out',
    'override',
    'params',
    'private',
    'protected',
    'public',
    'readonly',
    'ref',
    'return',
    'sbyte',
    'sealed',
    'short',
    'sizeof',
    'stackalloc',
    'static',
    'string',
    'struct',
    'switch',
    'this',
    'throw',
    'true',
    'try',
    'typeof',
    'uint',
    'ulong',
    'unchecked',
    'unsafe',
    'ushort',
    'using',
    'virtual',
    'void',
    'volatile',
    'while',
    'var',
    'dynamic',
    'async',
    'await',
    'record',
    'nint',
    'nuint',
  ]);
  const tokens = [];
  const push = makePusher(tokens);
  let i = 0,
    L = text.length;
  while (i < L) {
    const ch = text[i];
    if (/\s/.test(ch)) {
      i++;
      continue;
    }
    if (ch === '/' && text[i + 1] === '/') {
      let j = i + 2;
      while (j < L && text[j] !== '\n') j++;
      push('com', i, j);
      i = j;
      continue;
    }
    if (ch === '/' && text[i + 1] === '*') {
      let j = i + 2;
      while (j < L && !(text[j] === '*' && text[j + 1] === '/')) j++;
      j = Math.min(L, j + 2);
      push('com', i, j);
      i = j;
      continue;
    }
    if (ch === '"') {
      const [s, e] = readString(text, i, '"');
      push('str', s, e);
      i = e;
      continue;
    }
    if ((ch === '@' || ch === '$') && text[i + 1] === '"') {
      const [s, e] = readString(text, i + 1, '"', { includePrefix: true });
      push('str', s, e);
      i = e;
      continue;
    }
    if (/\d|-/.test(ch)) {
      const [s, e] = readNumber(text, i);
      push('num', s, e);
      i = e;
      continue;
    }
    if (isIdentStart(ch)) {
      let j = i + 1;
      while (/[A-Za-z0-9_]/.test(text[j] || '')) j++;
      const w = text.slice(i, j);
      push(KW.has(w) ? 'kw' : 'id', i, j);
      i = j;
      continue;
    }
    if ('(){}[];:.,+-*/%&|^!~?=<>'.includes(ch)) {
      push('op', i, i + 1);
      i++;
      continue;
    }
    i++;
  }
  return tokens;
}
