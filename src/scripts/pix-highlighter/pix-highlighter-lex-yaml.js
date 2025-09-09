import { makePusher, readString } from './pix-highlighter-lex-utils.js';

export function lexYAML(text) {
  const tokens = [];
  const push = makePusher(tokens);
  const bools = /^(true|false|null|yes|no|on|off)$/i;

  let i = 0,
    L = text.length;
  while (i < L) {
    const lineStart = i;
    let j = i;
    while (j < L && text[j] !== '\n') j++;
    const line = text.slice(i, j);

    if (/^\s*(---|\.\.\.)\s*$/.test(line)) {
      push('op', lineStart, lineStart + line.length);
      i = j + 1;
      continue;
    }

    let k = 0;
    while (k < line.length) {
      const ch = line[k];
      if (ch === "'" || ch === '"') {
        const [s, e] = readString(line, k, ch);
        push('str', lineStart + s, lineStart + e);
        k = e;
        continue;
      }
      if (ch === '#') {
        push('com', lineStart + k, lineStart + line.length);
        break;
      }
      k++;
    }

    const keyMatch = line.match(/^(\s*)([A-Za-z0-9_.-]+)\s*:/);
    if (keyMatch) {
      const keyStart = lineStart + keyMatch[1].length;
      const keyEnd = keyStart + keyMatch[2].length;
      push('key', keyStart, keyEnd);
    }

    let m;
    const anchorRe = /[&*][A-Za-z0-9_-]+/g;
    while ((m = anchorRe.exec(line))) {
      push('var', lineStart + m.index, lineStart + m.index + m[0].length);
    }

    const tagRe = /!![^\s]+/g;
    while ((m = tagRe.exec(line))) {
      push('type', lineStart + m.index, lineStart + m.index + m[0].length);
    }

    const wordRe = /[A-Za-z0-9_.-]+/g;
    while ((m = wordRe.exec(line))) {
      const w = m[0];
      const s = lineStart + m.index;
      const e = s + w.length;
      if (/^-?\d/.test(w)) {
        push('num', s, e);
        continue;
      }
      if (bools.test(w)) {
        push('kw', s, e);
        continue;
      }
    }

    const listM = line.match(/^(\s*)-\s+/);
    if (listM) {
      const p = lineStart + listM[1].length;
      push('op', p, p + 1);
    }

    i = j + 1;
  }
  return tokens;
}
