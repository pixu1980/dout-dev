import { isIdent, isIdentStart, makePusher, readNumber, readString, skipSpace } from './_Utils.js';

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: lexer scanners are intentionally branch-heavy.
export function lexCSS(text) {
  const tokens = [];
  const push = makePusher(tokens);
  let i = 0,
    L = text.length;
  let inBlock = false;
  while (i < L) {
    const ch = text[i];
    if (ch === '/' && text[i + 1] === '*') {
      let j = i + 2;
      while (j < L && !(text[j] === '*' && text[j + 1] === '/')) j++;
      j = Math.min(L, j + 2);
      push('com', i, j);
      i = j;
      continue;
    }
    if (/\s/.test(ch)) {
      i++;
      continue;
    }

    if (ch === '@') {
      let j = i + 1;
      while (isIdent(text[j] || '')) j++;
      push('kw', i, j);
      i = j;
      continue;
    }

    if (ch === '{') {
      push('op', i, i + 1);
      inBlock = true;
      i++;
      continue;
    }
    if (ch === '}') {
      push('op', i, i + 1);
      inBlock = false;
      i++;
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

    if (inBlock) {
      let j = i;
      if (isIdentStart(text[j] || '')) {
        const pStart = j;
        j++;
        while (isIdent(text[j] || '')) j++;
        const saveJ = j;
        j = skipSpace(text, j);
        if (text[j] === ':') {
          push('prop', pStart, saveJ);
          push('op', j, j + 1);
          i = j + 1;
          continue;
        }
        push('id', pStart, saveJ);
        i = saveJ;
        continue;
      }
    } else {
      if (ch === '.' || ch === '#') {
        let j = i + 1;
        while (isIdent(text[j] || '')) j++;
        push('id', i, j);
        i = j;
        continue;
      }
      if (ch === ':') {
        let j = i + 1;
        while (isIdent(text[j] || '')) j++;
        push('kw', i, j);
        i = j;
        continue;
      }
      if (isIdentStart(ch)) {
        let j = i + 1;
        while (isIdent(text[j] || '')) j++;
        push('tag', i, j);
        i = j;
        continue;
      }
    }

    if ('()[];,:>.+*~^$|='.includes(ch)) {
      push('op', i, i + 1);
      i++;
      continue;
    }
    i++;
  }
  return tokens;
}
