import { isIdentStart, makePusher, readNumber, readString } from './_Utils.js';

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: lexer scanners are intentionally branch-heavy.
function lexCBase(text, isCPP) {
  const KW = new Set([
    'auto',
    'break',
    'case',
    'char',
    'const',
    'continue',
    'default',
    'do',
    'double',
    'else',
    'enum',
    'extern',
    'float',
    'for',
    'goto',
    'if',
    'inline',
    'int',
    'long',
    'register',
    'restrict',
    'return',
    'short',
    'signed',
    'sizeof',
    'static',
    'struct',
    'switch',
    'typedef',
    'union',
    'unsigned',
    'void',
    'volatile',
    'while',
    '_Bool',
    '_Complex',
    '_Imaginary',
  ]);
  if (isCPP) {
    for (const k of [
      'alignas',
      'alignof',
      'and',
      'and_eq',
      'asm',
      'bitand',
      'bitor',
      'bool',
      'catch',
      'char8_t',
      'char16_t',
      'char32_t',
      'class',
      'compl',
      'concept',
      'consteval',
      'constexpr',
      'constinit',
      'co_await',
      'co_return',
      'co_yield',
      'decltype',
      'delete',
      'explicit',
      'export',
      'false',
      'friend',
      'mutable',
      'namespace',
      'new',
      'noexcept',
      'not',
      'not_eq',
      'operator',
      'or',
      'or_eq',
      'private',
      'protected',
      'public',
      'reinterpret_cast',
      'requires',
      'static_cast',
      'template',
      'this',
      'thread_local',
      'throw',
      'true',
      'try',
      'typeid',
      'typename',
      'virtual',
      'wchar_t',
      'xor',
      'xor_eq',
      'using',
    ])
      KW.add(k);
  }
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
      push('pp', i, j);
      i = j;
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
    if (ch === "'") {
      const [s, e] = readString(text, i, "'");
      push('str', s, e);
      i = e;
      continue;
    }
    if (ch === '"') {
      const [s, e] = readString(text, i, '"');
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

export function lexC(text) {
  return lexCBase(text, false);
}
export function lexCPP(text) {
  return lexCBase(text, true);
}
