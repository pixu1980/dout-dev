import { makePusher, readString, readNumber, isIdentStart } from './pix-highlighter-lex-utils.js';

export function lexRust(text) {
  const KW = new Set([
    'as','break','const','continue','crate','else','enum','extern','false','fn','for','if','impl','in','let','loop','match','mod','move','mut','pub','ref','return','self','Self','static','struct','super','trait','true','type','unsafe','use','where','while','async','await','dyn',
  ]);
  const tokens = [];
  const push = makePusher(tokens);
  let i = 0, L = text.length;
  while (i < L) {
    const ch = text[i];
    if (/\s/.test(ch)) { i++; continue; }
    if (ch === '/' && text[i + 1] === '/') { let j = i + 2; while (j < L && text[j] !== '\n') j++; push('com', i, j); i = j; continue; }
    if (ch === '/' && text[i + 1] === '*') { let j = i + 2; while (j < L && !(text[j] === '*' && text[j + 1] === '/')) j++; j = Math.min(L, j + 2); push('com', i, j); i = j; continue; }
    if (ch === '"') { const [s, e] = readString(text, i, '"'); push('str', s, e); i = e; continue; }
    if (ch === 'r' && text[i + 1] === '"') { const [s, e] = readString(text, i + 1, '"', { includePrefix: true }); push('str', s, e); i = e; continue; }
    if (/\d|-/.test(ch)) { const [s, e] = readNumber(text, i); push('num', s, e); i = e; continue; }
    if (isIdentStart(ch)) { let j = i + 1; while (/[A-Za-z0-9_]/.test(text[j] || '')) j++; if (text[j] === '!') { push('mac', i, j + 1); i = j + 1; continue; } const w = text.slice(i, j); push(KW.has(w) ? 'kw' : 'id', i, j); i = j; continue; }
    if ('(){}[]:.,+-*/%&|^!~?=<>'.includes(ch)) { push('op', i, i + 1); i++; continue; }
    i++;
  }
  return tokens;
}
