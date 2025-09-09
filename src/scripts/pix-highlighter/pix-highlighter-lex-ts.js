import { lexJS } from './pix-highlighter-lex-js.js';

export function lexTS(text) {
  const extraKW = new Set([
    'interface',
    'type',
    'enum',
    'implements',
    'readonly',
    'public',
    'private',
    'protected',
    'abstract',
    'declare',
    'namespace',
    'keyof',
    'infer',
    'satisfies',
    'unknown',
    'never',
    'bigint',
    'asserts',
  ]);
  const base = lexJS(text);
  for (const t of base) {
    if (t.type === 'id') {
      const w = text.slice(t.start, t.end);
      if (extraKW.has(w)) t.type = 'kw';
    }
  }
  return base;
}
