import {
  makePusher,
  readString,
  readNumber,
  isIdentStart,
  isIdent,
} from './pix-highlighter-lex-utils.js';

export function lexJS(text) {
  const KW = new Set([
    'break',
    'case',
    'catch',
    'class',
    'const',
    'continue',
    'debugger',
    'default',
    'delete',
    'do',
    'else',
    'export',
    'extends',
    'finally',
    'for',
    'function',
    'if',
    'import',
    'in',
    'instanceof',
    'let',
    'new',
    'return',
    'super',
    'switch',
    'this',
    'throw',
    'try',
    'typeof',
    'var',
    'void',
    'while',
    'with',
    'yield',
    'await',
    'of',
    'as',
    'from',
  ]);
  const three = new Set(['===', '!==', '>>>']);
  const two = new Set([
    '++',
    '--',
    '=>',
    '==',
    '!=',
    '<=',
    '>=',
    '&&',
    '||',
    '??',
    '**',
    '<<',
    '>>',
    '?.',
    '??',
  ]);
  const one = new Set('(){}[];:.,+-*/%&|^!~?=<>'.split(''));
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
    if (ch === '/' && i + 1 < L) {
      const n = text[i + 1];
      if (n === '/') {
        let j = i + 2;
        while (j < L && text[j] !== '\n') j++;
        push('com', i, j);
        i = j;
        continue;
      }
      if (n === '*') {
        let j = i + 2;
        while (j < L && !(text[j] === '*' && text[j + 1] === '/')) j++;
        j = Math.min(L, j + 2);
        push('com', i, j);
        i = j;
        continue;
      }
    }
    if (ch === "'" || ch === '"' || ch === '`') {
      const [s, e] = readString(text, i, ch);
      push('str', s, e);
      i = e;
      continue;
    }
    if (/\d|-/.test(ch)) {
      const [s, e] = readNumber(text, i);
      if (e > i) {
        push('num', s, e);
        i = e;
        continue;
      }
    }
    if (isIdentStart(ch)) {
      let j = i + 1;
      while (isIdent(text[j] || '')) j++;
      const word = text.slice(i, j);
      push(KW.has(word) ? 'kw' : 'id', i, j);
      i = j;
      continue;
    }
    const t3 = text.slice(i, i + 3),
      t2 = text.slice(i, i + 2);
    if (three.has(t3)) {
      push('op', i, i + 3);
      i += 3;
      continue;
    }
    if (two.has(t2)) {
      push('op', i, i + 2);
      i += 2;
      continue;
    }
    if (one.has(ch)) {
      push('op', i, i + 1);
      i += 1;
      continue;
    }
    i++;
  }
  return tokens;
}
