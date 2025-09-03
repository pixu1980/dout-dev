import { makePusher, skipSpace, readString, readNumber } from './pix-highlighter-lex-utils.js';

export function lexJSON(text) {
  const tokens = [];
  const push = makePusher(tokens);
  let i = 0, L = text.length;
  const stack = [];
  while (i < L) {
    i = skipSpace(text, i);
    const ch = text[i];
    if (!ch) break;

    if (ch === '{') { push('op', i, i + 1); stack.push(true); i++; continue; }
    if (ch === '[') { push('op', i, i + 1); stack.push(false); i++; continue; }
    if (ch === '}' || ch === ']') { push('op', i, i + 1); stack.pop(); i++; continue; }
    if (ch === ',') { push('op', i, i + 1); i++; continue; }
    if (ch === ':') { push('op', i, i + 1); i++; continue; }

    if (ch === '"') {
      const [s, e] = readString(text, i, '"');
      const j = skipSpace(text, e);
      const isKey = stack[stack.length - 1] === true && text[j] === ':';
      push(isKey ? 'key' : 'str', s, e);
      i = e; continue;
    }
    if (/\d|-/.test(ch)) { const [s, e] = readNumber(text, i); push('num', s, e); i = e; continue; }
    if (text.startsWith('true', i) || text.startsWith('false', i) || text.startsWith('null', i)) {
      const m = text.startsWith('true', i) ? 'true' : (text.startsWith('false', i) ? 'false' : 'null');
      push('kw', i, i + m.length); i += m.length; continue;
    }
    i++;
  }
  return tokens;
}
