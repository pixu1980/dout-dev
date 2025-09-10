import { isIdentStart, makePusher, readNumber, readString } from './_Utils.js';

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: lexer scanners are intentionally branch-heavy.
export function lexPython(text) {
  const KW = new Set([
    'False',
    'None',
    'True',
    'and',
    'as',
    'assert',
    'async',
    'await',
    'break',
    'class',
    'continue',
    'def',
    'del',
    'elif',
    'else',
    'except',
    'finally',
    'for',
    'from',
    'global',
    'if',
    'import',
    'in',
    'is',
    'lambda',
    'nonlocal',
    'not',
    'or',
    'pass',
    'raise',
    'return',
    'try',
    'while',
    'with',
    'yield',
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
    if (ch === '#') {
      let j = i + 1;
      while (j < L && text[j] !== '\n') j++;
      push('com', i, j);
      i = j;
      continue;
    }
    if (text.startsWith("'''", i) || text.startsWith('"""', i)) {
      const q = text[i];
      let j = i + 3;
      while (j < L && !text.startsWith(q + q + q, j)) j++;
      j = Math.min(L, j + 3);
      push('str', i, j);
      i = j;
      continue;
    }
    if (ch === "'" || ch === '"') {
      const [s, e] = readString(text, i, ch);
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
    if ('(){}[]:.,+-*/%&|^~=<>`'.includes(ch)) {
      push('op', i, i + 1);
      i++;
      continue;
    }
    i++;
  }
  return tokens;
}
