export /* ---------- Utilities comuni ---------- */
function normalizeLang(v) {
  v = (v || '').toLowerCase().trim();
  const map = new Map([
    ['javascript', 'js'],
    ['mjs', 'js'],
    ['cjs', 'js'],
    ['typescript', 'ts'],
    ['tsx', 'ts'],
    ['py', 'python'],
    ['rs', 'rust'],
    ['c++', 'cpp'],
    ['hpp', 'cpp'],
    ['h++', 'cpp'],
    ['cs', 'csharp'],
    ['md', 'markdown'],
    ['yaml', 'yml'],
    ['shell', 'bash'],
  ]);
  return map.get(v) || v || 'js';
}

// Shared utilities for lexers
export function makePusher(tokens) {
  return (type, start, end) => {
    if (end > start) tokens.push({ type, start, end });
  };
}

export function readString(text, i, quote, opts = {}) {
  const L = text.length;
  let j = i + 1;
  if (opts.includePrefix) i--; // include 1-char prefix (e.g., @, $)
  while (j < L) {
    const ch = text[j];
    if (ch === '\\') {
      j += 2;
      continue;
    }
    if (ch === quote) {
      j++;
      break;
    }
    j++;
  }
  return [i, j];
}

export function readNumber(text, i) {
  let j = i;
  if (text[j] === '-') j++;
  if (text.startsWith('0x', j)) {
    j += 2;
    while (/[0-9a-fA-F_]/.test(text[j])) j++;
    return [i, j];
  }
  if (text.startsWith('0b', j)) {
    j += 2;
    while (/[01_]/.test(text[j])) j++;
    return [i, j];
  }
  if (text.startsWith('0o', j)) {
    j += 2;
    while (/[0-7_]/.test(text[j])) j++;
    return [i, j];
  }
  while (/[0-9_]/.test(text[j])) j++;
  if (text[j] === '.' && /[0-9]/.test(text[j + 1] || '')) {
    j++;
    while (/[0-9_]/.test(text[j])) j++;
  }
  if ((text[j] || '').toLowerCase() === 'e') {
    let k = j + 1;
    if (text[k] === '+' || text[k] === '-') k++;
    if (/[0-9]/.test(text[k] || '')) {
      j = k + 1;
      while (/[0-9_]/.test(text[j])) j++;
    }
  }
  while (/[a-zA-Z]/.test(text[j] || '')) j++; // suffixes
  return [i, j];
}

export function skipSpace(text, i) {
  while (/\s/.test(text[i] || '')) i++;
  return i;
}

export function isIdentStart(ch) {
  return /[A-Za-z_$]/.test(ch);
}

export function isIdent(ch) {
  return /[\w$-]/.test(ch);
}
