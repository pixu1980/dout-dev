import { makePusher, readString, readNumber, isIdentStart } from './pix-highlighter-lex-utils.js';

export function lexPHP(text) {
  const KW = new Set([
    'abstract',
    'and',
    'array',
    'as',
    'break',
    'callable',
    'case',
    'catch',
    'class',
    'clone',
    'const',
    'continue',
    'declare',
    'default',
    'do',
    'echo',
    'else',
    'elseif',
    'empty',
    'enddeclare',
    'endfor',
    'endforeach',
    'endif',
    'endswitch',
    'endwhile',
    'eval',
    'exit',
    'extends',
    'final',
    'finally',
    'for',
    'foreach',
    'function',
    'global',
    'goto',
    'if',
    'implements',
    'include',
    'include_once',
    'instanceof',
    'insteadof',
    'interface',
    'isset',
    'list',
    'match',
    'namespace',
    'new',
    'or',
    'print',
    'private',
    'protected',
    'public',
    'readonly',
    'require',
    'require_once',
    'return',
    'static',
    'switch',
    'throw',
    'trait',
    'try',
    'unset',
    'use',
    'var',
    'while',
    'xor',
    'yield',
    'true',
    'false',
    'null',
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
    if (ch === '#') {
      let j = i + 1;
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
    if (ch === "'" || ch === '"') {
      const [s, e] = readString(text, i, ch);
      push('str', s, e);
      i = e;
      continue;
    }
    if (ch === '$' && isIdentStart(text[i + 1] || '')) {
      let j = i + 2;
      while (/[A-Za-z0-9_]/.test(text[j] || '')) j++;
      push('var', i, j);
      i = j;
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
    if ('(){}[];:.,+-*/%&|^!~?=<>@'.includes(ch)) {
      push('op', i, i + 1);
      i++;
      continue;
    }
    i++;
  }
  return tokens;
}
