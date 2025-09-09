import { makePusher, isIdent, skipSpace, readString } from './pix-highlighter-lex-utils.js';

export function lexHTML(text) {
  const tokens = [];
  const push = makePusher(tokens);
  let i = 0,
    L = text.length;
  while (i < L) {
    const ch = text[i];
    if (ch === '<') {
      if (text.startsWith('<!--', i)) {
        let j = i + 4;
        while (j < L && !text.startsWith('-->', j)) j++;
        j = Math.min(L, j + 3);
        push('com', i, j);
        i = j;
        continue;
      }
      let j = i + 1;
      if (text[j] === '/' || text[j] === '!') j++;
      const tnStart = j;
      while (isIdent(text[j] || '')) j++;
      if (j > tnStart) push('tag', tnStart, j);
      while (j < L && text[j] !== '>') {
        if (/\s/.test(text[j])) {
          j++;
          continue;
        }
        if (text[j] === '/') {
          j++;
          continue;
        }
        const aStart = j;
        while (isIdent(text[j] || '')) j++;
        if (j > aStart) push('attr', aStart, j);
        j = skipSpace(text, j);
        if (text[j] === '=') {
          push('op', j, j + 1);
          j++;
          j = skipSpace(text, j);
          if (text[j] === '"' || text[j] === "'") {
            const quote = text[j];
            const [s, e] = readString(text, j, quote);
            push('str', s, e);
            j = e;
          } else {
            const vStart = j;
            while (j < L && !/[\s>]/.test(text[j])) j++;
            if (j > vStart) push('str', vStart, j);
          }
        }
      }
      if (text[j] === '>') {
        push('op', j, j + 1);
        j++;
      }
      i = j;
      continue;
    }
    i++;
  }
  return tokens;
}
