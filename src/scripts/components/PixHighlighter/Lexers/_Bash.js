import { makePusher, readNumber, readString } from './_Utils.js';

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: lexer scanners are intentionally branch-heavy.
export function lexBash(text) {
  const KW = new Set([
    'if',
    'then',
    'elif',
    'else',
    'fi',
    'for',
    'in',
    'do',
    'done',
    'case',
    'esac',
    'while',
    'until',
    'function',
    'select',
    'time',
    'coproc',
  ]);
  const tokens = [];
  const push = makePusher(tokens);
  let i = 0,
    L = text.length;

  while (i < L) {
    const ch = text[i];

    if (i === 0 && text.startsWith('#!', 0)) {
      let j = 0;
      while (j < L && text[j] !== '\n') j++;
      push('pp', 0, j);
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

    if (ch === "'" || ch === '"' || ch === '`') {
      const [s, e] = readString(text, i, ch);
      push('str', s, e);
      i = e;
      continue;
    }

    if (ch === '$') {
      if (text[i + 1] === '{') {
        let j = i + 2;
        while (j < L && text[j] !== '}') j++;
        j = Math.min(L, j + 1);
        push('var', i, j);
        i = j;
        continue;
      } else {
        let j = i + 1;
        while (/[A-Za-z0-9_]/.test(text[j] || '')) j++;
        if (j > i + 1) {
          push('var', i, j);
          i = j;
          continue;
        }
      }
    }

    if (/\d|-/.test(ch)) {
      const [s, e] = readNumber(text, i);
      if (e > i) {
        push('num', s, e);
        i = e;
        continue;
      }
    }

    if (/[A-Za-z_]/.test(ch)) {
      let j = i + 1;
      while (/[A-Za-z0-9_.-]/.test(text[j] || '')) j++;
      const w = text.slice(i, j);
      push(KW.has(w) ? 'kw' : 'id', i, j);
      i = j;
      continue;
    }

    const three = text.slice(i, i + 3);
    const two = text.slice(i, i + 2);
    if (['<<<'].includes(three)) {
      push('op', i, i + 3);
      i += 3;
      continue;
    }
    if (['&&', '||', '>>', '<<', '>|', '2>', '>&'].includes(two)) {
      push('op', i, i + 2);
      i += 2;
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
