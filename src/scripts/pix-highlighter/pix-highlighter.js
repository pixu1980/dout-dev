/**
 * <pre is="pix-highlighter" lang="js|ts|css|json|html|python|rust|c|cpp|php|csharp|go|markdown|md|yml|yaml|bash|sh"><code>...</code></pre>
 * - Evidenzia tramite CSS Custom Highlight API (::highlight(...)).
 * - NIENTE fallback DOM: se l'API non c'è, il codice resta così com'è.
 * - Lexer minimalisti e veloci (best-effort).
 */
class PixHighlighter extends HTMLPreElement {
  static _uid = 0;
  static KNOWN_TYPES = [
    'kw',
    'str',
    'num',
    'com',
    'id',
    'op',
    'tag',
    'attr',
    'key',
    'var',
    'mac',
    'pp',
    'prop',
    'type',
    // Markdown
    'mdh',
    'mde',
    'mds',
    'mdc',
    'mdl',
    'mdbq',
    'mdli',
    'mdhr',
    'mdimg',
  ];
  static get observedAttributes() {
    return ['lang'];
  }

  constructor() {
    super();
    this._id = (++PixHighlighter._uid).toString(36);
    this.dataset.pixId = this._id;
    this._names = [];
    this._mo = null;
    this._lastText = '';
    this._supportsHighlight = !!(window.CSS && CSS.highlights && 'Highlight' in window);
  }

  connectedCallback() {
    this._ensureStyleForInstance();
    this._reHighlight();
    this._observe();
  }

  disconnectedCallback() {
    this._cleanupHighlights();
    if (this._mo) this._mo.disconnect();
  }

  attributeChangedCallback(name) {
    if (name === 'lang') this._reHighlight();
  }

  _observe() {
    const code = this.querySelector('code');
    if (!code) return;
    this._mo?.disconnect();
    this._mo = new MutationObserver(() => this._reHighlight());
    this._mo.observe(code, { childList: true, characterData: true, subtree: true });
  }

  _reHighlight() {
    const code = this.querySelector('code');
    if (!code) return;

    const text = code.textContent ?? '';
    if (text === this._lastText) return;
    this._lastText = text;
    code.textContent = text; // normalizza a singolo TextNode
    const textNode = code.firstChild || code.appendChild(document.createTextNode(''));

    // se l'API non è supportata, non fare nulla (niente fallback)
    if (!this._supportsHighlight) {
      this._cleanupHighlights();
      return;
    }

    const lang = normalizeLang(this.getAttribute('lang'));
    const tokens = this._lex(lang, text);

    this._cleanupHighlights();

    // Costruisci un Highlight per tipo token
    const groups = new Map();
    for (const t of tokens) {
      if (!groups.has(t.type)) groups.set(t.type, new Highlight());
      const r = document.createRange();
      r.setStart(textNode, t.start);
      r.setEnd(textNode, t.end);
      groups.get(t.type).add(r);
    }
    for (const [type, highlight] of groups) {
      const name = `pix-${this._id}-${type}`;
      CSS.highlights.set(name, highlight);
      this._names.push(name);
    }
  }

  _cleanupHighlights() {
    if (!this._names?.length) return;
    if (this._supportsHighlight) {
      for (const n of this._names) CSS.highlights.delete(n);
    }
    this._names = [];
  }

  _ensureStyleForInstance() {
    const id = `pix-sh-style-${this._id}`;
    if (document.getElementById(id)) return;

    const s = document.createElement('style');
    s.id = id;
    s.textContent = `
/* Base */
pre[is="pix-syntax-highlighter"][data-pix-id="${this._id}"] {
  --pix-bg: #0b0d10;
  --pix-fg: #e6e6e6;

  --pix-kw: #c792ea;
  --pix-str: #ecc48d;
  --pix-num: #f78c6c;
  --pix-com: #697098;
  --pix-id:  #82aaff;
  --pix-op:  #c3e88d;

  --pix-tag:  #5ad4e6;
  --pix-attr: #f2ae49;
  --pix-key:  #ffcc66;
  --pix-var:  #d5ff80;
  --pix-mac:  #ff9dd9;
  --pix-pp:   #8bd5ff;
  --pix-prop: #9cdcfe;
  --pix-type: #7fd5a3;

  /* Markdown */
  --pix-mdh:   #5ad4e6; /* heading */
  --pix-mde:   #f2ae49; /* emphasis */
  --pix-mds:   #ffd166; /* strong */
  --pix-mdc:   #c3e88d; /* inline & fenced code lines */
  --pix-mdl:   #80cbc4; /* links */
  --pix-mdbq:  #a0a7bd; /* blockquote */
  --pix-mdli:  #b3e5fc; /* list bullets / markers */
  --pix-mdhr:  #6c7a89; /* horizontal rules */
  --pix-mdimg: #90caf9; /* images */

  --pix-tab-size: 2;

  background: var(--pix-bg);
  color: var(--pix-fg);
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, Monaco, "Liberation Mono", "DejaVu Sans Mono", "Courier New", monospace;
  line-height: 1.5;
  tab-size: var(--pix-tab-size);
  padding: 1rem;
  border-radius: .75rem;
  overflow: auto;
}

/* CSS Custom Highlight API */
${PixHighlighter.KNOWN_TYPES.map(
  (t) =>
    `pre[is="pix-syntax-highlighter"][data-pix-id="${this._id}"] ::highlight(pix-${this._id}-${t}) { ${cssForType(t)} }`
).join('\n')}
    `.trim();
    document.head.appendChild(s);

    function cssForType(t) {
      const m = {
        kw: 'color: var(--pix-kw);',
        str: 'color: var(--pix-str);',
        num: 'color: var(--pix-num);',
        com: 'color: var(--pix-com);',
        id: 'color: var(--pix-id);',
        op: 'color: var(--pix-op);',
        tag: 'color: var(--pix-tag);',
        attr: 'color: var(--pix-attr);',
        key: 'color: var(--pix-key);',
        var: 'color: var(--pix-var);',
        mac: 'color: var(--pix-mac);',
        pp: 'color: var(--pix-pp);',
        prop: 'color: var(--pix-prop);',
        type: 'color: var(--pix-type);',
        // Markdown
        mdh: 'color: var(--pix-mdh);',
        mde: 'color: var(--pix-mde);',
        mds: 'color: var(--pix-mds);',
        mdc: 'color: var(--pix-mdc);',
        mdl: 'color: var(--pix-mdl);',
        mdbq: 'color: var(--pix-mdbq);',
        mdli: 'color: var(--pix-mdli);',
        mdhr: 'color: var(--pix-mdhr);',
        mdimg: 'color: var(--pix-mdimg);',
      };
      return m[t] || '';
    }
  }

  _lex(lang, text) {
    switch (lang) {
      case 'js':
        return lexJS(text);
      case 'ts':
        return lexTS(text);
      case 'css':
        return lexCSS(text);
      case 'json':
        return lexJSON(text);
      case 'html':
        return lexHTML(text);
      case 'python':
        return lexPython(text);
      case 'rust':
        return lexRust(text);
      case 'c':
        return lexC(text);
      case 'cpp':
        return lexCPP(text);
      case 'php':
        return lexPHP(text);
      case 'csharp':
        return lexCSharp(text);
      case 'go':
        return lexGo(text);
      case 'markdown':
      case 'md':
        return lexMarkdown(text);
      case 'yml':
      case 'yaml':
        return lexYAML(text);
      case 'bash':
      case 'sh':
        return lexBash(text);
      default:
        return [];
    }
  }
}

// Safe registration (avoid errors during Node.js ESM import for tests)
if (
  typeof window !== 'undefined' &&
  window.customElements &&
  !window.customElements.get('pix-highlighter')
) {
  customElements.define('pix-highlighter', PixHighlighter, { extends: 'pre' });
}

// Expose internals for test coverage (tree-shaken out in production bundling)
// eslint-disable-next-line import/no-unused-modules
export {
  PixHighlighter,
  normalizeLang,
  lexJS,
  lexTS,
  lexCSS,
  lexJSON,
  lexHTML,
  lexPython,
  lexRust,
  lexC,
  lexCPP,
  lexPHP,
  lexCSharp,
  lexGo,
  lexMarkdown,
  lexYAML,
  lexBash,
};

/* ---------- Utilities comuni ---------- */
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

function makePusher(tokens) {
  return (type, start, end) => {
    if (end > start) tokens.push({ type, start, end });
  };
}

function readString(text, i, quote, opts = {}) {
  const L = text.length;
  let j = i + 1;
  if (opts.includePrefix) i--; // includi prefisso di 1 char (es. @, $)
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

function readNumber(text, i) {
  const L = text.length;
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
  while (/[a-zA-Z]/.test(text[j] || '')) j++; // suffissi
  return [i, j];
}

function skipSpace(text, i) {
  while (/\s/.test(text[i] || '')) i++;
  return i;
}

function isIdentStart(ch) {
  return /[A-Za-z_$]/.test(ch);
}

function isIdent(ch) {
  return /[\w$-]/.test(ch);
}

/* ---------- JavaScript ---------- */
function lexJS(text) {
  const KW = new Set([
    'break',
    'case',
    'catch',
    'class',
    'const',
    'continue',
    'debugger',
    'default',
    'delete',
    'do',
    'else',
    'export',
    'extends',
    'finally',
    'for',
    'function',
    'if',
    'import',
    'in',
    'instanceof',
    'let',
    'new',
    'return',
    'super',
    'switch',
    'this',
    'throw',
    'try',
    'typeof',
    'var',
    'void',
    'while',
    'with',
    'yield',
    'await',
    'of',
    'as',
    'from',
  ]);
  const three = new Set(['===', '!==', '>>>']);
  const two = new Set([
    '++',
    '--',
    '=>',
    '==',
    '!=',
    '<=',
    '>=',
    '&&',
    '||',
    '??',
    '**',
    '<<',
    '>>',
    '?.',
    '??',
  ]);
  const one = new Set('(){}[];:.,+-*/%&|^!~?=<>'.split(''));
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
    if (ch === '/' && i + 1 < L) {
      const n = text[i + 1];
      if (n === '/') {
        let j = i + 2;
        while (j < L && text[j] !== '\n') j++;
        push('com', i, j);
        i = j;
        continue;
      }
      if (n === '*') {
        let j = i + 2;
        while (j < L && !(text[j] === '*' && text[j + 1] === '/')) j++;
        j = Math.min(L, j + 2);
        push('com', i, j);
        i = j;
        continue;
      }
    }
    if (ch === "'" || ch === '"' || ch === '`') {
      const [s, e] = readString(text, i, ch);
      push('str', s, e);
      i = e;
      continue;
    }
    if (/\d|-/.test(ch)) {
      const [s, e] = readNumber(text, i);
      if (e > i) {
        push('num', s, e);
        i = e;
        continue;
      }
    }
    if (isIdentStart(ch)) {
      let j = i + 1;
      while (isIdent(text[j] || '')) j++;
      const word = text.slice(i, j);
      push(KW.has(word) ? 'kw' : 'id', i, j);
      i = j;
      continue;
    }
    const t3 = text.slice(i, i + 3),
      t2 = text.slice(i, i + 2);
    if (three.has(t3)) {
      push('op', i, i + 3);
      i += 3;
      continue;
    }
    if (two.has(t2)) {
      push('op', i, i + 2);
      i += 2;
      continue;
    }
    if (one.has(ch)) {
      push('op', i, i + 1);
      i += 1;
      continue;
    }
    i++;
  }
  return tokens;
}

/* ---------- TypeScript ---------- */
function lexTS(text) {
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

/* ---------- JSON ---------- */
function lexJSON(text) {
  const tokens = [];
  const push = makePusher(tokens);
  let i = 0,
    L = text.length;
  const stack = [];
  while (i < L) {
    i = skipSpace(text, i);
    const ch = text[i];
    if (!ch) break;

    if (ch === '{') {
      push('op', i, i + 1);
      stack.push(true);
      i++;
      continue;
    }
    if (ch === '[') {
      push('op', i, i + 1);
      stack.push(false);
      i++;
      continue;
    }
    if (ch === '}' || ch === ']') {
      push('op', i, i + 1);
      stack.pop();
      i++;
      continue;
    }
    if (ch === ',') {
      push('op', i, i + 1);
      i++;
      continue;
    }
    if (ch === ':') {
      push('op', i, i + 1);
      i++;
      continue;
    }

    if (ch === '"') {
      let [s, e] = readString(text, i, '"');
      let j = skipSpace(text, e);
      const isKey = stack[stack.length - 1] === true && text[j] === ':';
      push(isKey ? 'key' : 'str', s, e);
      i = e;
      continue;
    }
    if (/\d|-/.test(ch)) {
      const [s, e] = readNumber(text, i);
      push('num', s, e);
      i = e;
      continue;
    }
    if (text.startsWith('true', i) || text.startsWith('false', i) || text.startsWith('null', i)) {
      const m = text.startsWith('true', i)
        ? 'true'
        : text.startsWith('false', i)
          ? 'false'
          : 'null';
      push('kw', i, i + m.length);
      i += m.length;
      continue;
    }
    i++;
  }
  return tokens;
}

/* ---------- HTML ---------- */
function lexHTML(text) {
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
      let tnStart = j;
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

/* ---------- CSS ---------- */
function lexCSS(text) {
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

/* ---------- Python ---------- */
function lexPython(text) {
  const KW = new Set([
    'False',
    'None',
    'True',
    'and',
    'as',
    'assert',
    'async',
    'await',
    'break',
    'class',
    'continue',
    'def',
    'del',
    'elif',
    'else',
    'except',
    'finally',
    'for',
    'from',
    'global',
    'if',
    'import',
    'in',
    'is',
    'lambda',
    'nonlocal',
    'not',
    'or',
    'pass',
    'raise',
    'return',
    'try',
    'while',
    'with',
    'yield',
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
    if (ch === '#') {
      let j = i + 1;
      while (j < L && text[j] !== '\n') j++;
      push('com', i, j);
      i = j;
      continue;
    }
    if (text.startsWith("'''", i) || text.startsWith('"""', i)) {
      const q = text[i];
      let j = i + 3;
      while (j < L && !text.startsWith(q + q + q, j)) j++;
      j = Math.min(L, j + 3);
      push('str', i, j);
      i = j;
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
    if (isIdentStart(ch)) {
      let j = i + 1;
      while (/[A-Za-z0-9_]/.test(text[j] || '')) j++;
      const w = text.slice(i, j);
      push(KW.has(w) ? 'kw' : 'id', i, j);
      i = j;
      continue;
    }
    if ("(){}[]:.,+-*/%&|^~=<>'`".includes(ch)) {
      push('op', i, i + 1);
      i++;
      continue;
    }
    i++;
  }
  return tokens;
}

/* ---------- Rust ---------- */
function lexRust(text) {
  const KW = new Set([
    'as',
    'break',
    'const',
    'continue',
    'crate',
    'else',
    'enum',
    'extern',
    'false',
    'fn',
    'for',
    'if',
    'impl',
    'in',
    'let',
    'loop',
    'match',
    'mod',
    'move',
    'mut',
    'pub',
    'ref',
    'return',
    'self',
    'Self',
    'static',
    'struct',
    'super',
    'trait',
    'true',
    'type',
    'unsafe',
    'use',
    'where',
    'while',
    'async',
    'await',
    'dyn',
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
    if (ch === '/' && text[i + 1] === '*') {
      let j = i + 2;
      while (j < L && !(text[j] === '*' && text[j + 1] === '/')) j++;
      j = Math.min(L, j + 2);
      push('com', i, j);
      i = j;
      continue;
    }
    if (ch === '"') {
      const [s, e] = readString(text, i, '"');
      push('str', s, e);
      i = e;
      continue;
    }
    if (ch === 'r' && text[i + 1] === '"') {
      const [s, e] = readString(text, i + 1, '"', { includePrefix: true });
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
      if (text[j] === '!') {
        push('mac', i, j + 1);
        i = j + 1;
        continue;
      }
      const w = text.slice(i, j);
      push(KW.has(w) ? 'kw' : 'id', i, j);
      i = j;
      continue;
    }
    if ('(){}[]:.,+-*/%&|^!~?=<>'.includes(ch)) {
      push('op', i, i + 1);
      i++;
      continue;
    }
    i++;
  }
  return tokens;
}

/* ---------- C / C++ ---------- */
function lexC(text) {
  return lexCBase(text, false);
}
function lexCPP(text) {
  return lexCBase(text, true);
}
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
    ]) {
      KW.add(k);
    }
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

/* ---------- PHP ---------- */
function lexPHP(text) {
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

/* ---------- C# ---------- */
function lexCSharp(text) {
  const KW = new Set([
    'abstract',
    'as',
    'base',
    'bool',
    'break',
    'byte',
    'case',
    'catch',
    'char',
    'checked',
    'class',
    'const',
    'continue',
    'decimal',
    'default',
    'delegate',
    'do',
    'double',
    'else',
    'enum',
    'event',
    'explicit',
    'extern',
    'false',
    'finally',
    'fixed',
    'float',
    'for',
    'foreach',
    'goto',
    'if',
    'implicit',
    'in',
    'int',
    'interface',
    'internal',
    'is',
    'lock',
    'long',
    'namespace',
    'new',
    'null',
    'object',
    'operator',
    'out',
    'override',
    'params',
    'private',
    'protected',
    'public',
    'readonly',
    'ref',
    'return',
    'sbyte',
    'sealed',
    'short',
    'sizeof',
    'stackalloc',
    'static',
    'string',
    'struct',
    'switch',
    'this',
    'throw',
    'true',
    'try',
    'typeof',
    'uint',
    'ulong',
    'unchecked',
    'unsafe',
    'ushort',
    'using',
    'virtual',
    'void',
    'volatile',
    'while',
    'var',
    'dynamic',
    'async',
    'await',
    'record',
    'nint',
    'nuint',
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
    if (ch === '/' && text[i + 1] === '*') {
      let j = i + 2;
      while (j < L && !(text[j] === '*' && text[j + 1] === '/')) j++;
      j = Math.min(L, j + 2);
      push('com', i, j);
      i = j;
      continue;
    }
    if (ch === '"') {
      const [s, e] = readString(text, i, '"');
      push('str', s, e);
      i = e;
      continue;
    }
    if ((ch === '@' || ch === '$') && text[i + 1] === '"') {
      const [s, e] = readString(text, i + 1, '"', { includePrefix: true });
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

/* ---------- Go ---------- */
function lexGo(text) {
  const KW = new Set([
    'break',
    'case',
    'chan',
    'const',
    'continue',
    'default',
    'defer',
    'else',
    'fallthrough',
    'for',
    'func',
    'go',
    'goto',
    'if',
    'import',
    'interface',
    'map',
    'package',
    'range',
    'return',
    'select',
    'struct',
    'switch',
    'type',
    'var',
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
    if (ch === '/' && text[i + 1] === '*') {
      let j = i + 2;
      while (j < L && !(text[j] === '*' && text[j + 1] === '/')) j++;
      j = Math.min(L, j + 2);
      push('com', i, j);
      i = j;
      continue;
    }
    if (ch === '"') {
      const [s, e] = readString(text, i, '"');
      push('str', s, e);
      i = e;
      continue;
    }
    if (ch === '`') {
      const [s, e] = readString(text, i, '`');
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

/* ---------- Markdown ---------- */
function lexMarkdown(text) {
  const tokens = [];
  const push = makePusher(tokens);
  const lines = text.split('\n');
  let offset = 0;
  let inFence = false;
  let fenceChar = null;

  for (const line of lines) {
    const L = line.length;
    const trimmed = line.trim();
    // Fenced code block start/end
    if (/^(```|~~~)/.test(trimmed)) {
      push('mdc', offset, offset + L); // linea recinzione
      const ch = trimmed[0];
      if (!inFence) {
        inFence = true;
        fenceChar = ch;
      } else if (inFence && ch === fenceChar) {
        inFence = false;
        fenceChar = null;
      }
      offset += L + 1; // +\n
      continue;
    }

    if (inFence) {
      // evidenzia il contenuto del blocco come codice
      push('mdc', offset, offset + L);
      offset += L + 1;
      continue;
    }

    // Heading
    if (/^#{1,6}\s+/.test(line)) {
      push('mdh', offset, offset + L);
      offset += L + 1;
      continue;
    }

    // Horizontal rule
    if (/^(\s*)([-*_]\s*){3,}$/.test(line)) {
      push('mdhr', offset, offset + L);
      offset += L + 1;
      continue;
    }

    // Blockquote
    if (/^\s*>\s?/.test(line)) {
      push('mdbq', offset, offset + L);
      offset += L + 1;
      continue;
    }

    // List marker (ul/ol)
    if (/^\s*([-*+])\s+/.test(line) || /^\s*\d+\.\s+/.test(line)) {
      const m = line.match(/^\s*((?:[-*+])|\d+\.)\s+/);
      if (m) push('mdli', offset + line.indexOf(m[1]), offset + line.indexOf(m[1]) + m[1].length);
    }

    // Inline code `...`
    scanInline(line, /`([^`]+)`/g, (s, e) => push('mdc', offset + s, offset + e));

    // Strong **...** o __...__
    scanInline(line, /\*\*([^*]+)\*\*/g, (s, e) => push('mds', offset + s, offset + e));
    scanInline(line, /__([^_]+)__/g, (s, e) => push('mds', offset + s, offset + e));

    // Emphasis *...* o _..._
    scanInline(line, /(?:^|[^\*])\*([^*\n]+)\*(?!\*)/g, (s, e) =>
      push('mde', offset + s + (/^\*/.test(line.slice(s)) ? 0 : 0), offset + e)
    );
    scanInline(line, /(?:^|[^_])_([^_\n]+)_(?!_)/g, (s, e) => push('mde', offset + s, offset + e));

    // Link / Image
    scanInline(line, /!\[[^\]]*\]\([^)]+\)/g, (s, e) => push('mdimg', offset + s, offset + e));
    scanInline(line, /\[[^\]]+\]\([^)]+\)/g, (s, e) => push('mdl', offset + s, offset + e));

    offset += L + 1;
  }
  return tokens;

  function scanInline(line, re, cb) {
    let m;
    while ((m = re.exec(line))) {
      cb(m.index, m.index + m[0].length);
    }
  }
}

/* ---------- YAML ---------- */
function lexYAML(text) {
  const tokens = [];
  const push = makePusher(tokens);
  const bools = /^(true|false|null|yes|no|on|off)$/i;

  let i = 0,
    L = text.length;
  while (i < L) {
    const lineStart = i;
    // vai a fine linea
    let j = i;
    while (j < L && text[j] !== '\n') j++;
    const line = text.slice(i, j);

    // doc sep
    if (/^\s*(---|\.\.\.)\s*$/.test(line)) {
      push('op', lineStart, lineStart + line.length);
      i = j + 1;
      continue;
    }

    // comment fuori da stringhe
    let k = 0;
    while (k < line.length) {
      const ch = line[k];
      if (ch === "'" || ch === '"') {
        const [s, e] = readString(line, k, ch);
        // offset globale:
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

    // chiave semplice: key:
    const keyMatch = line.match(/^(\s*)([A-Za-z0-9_.-]+)\s*:/);
    if (keyMatch) {
      const keyStart = lineStart + keyMatch[1].length;
      const keyEnd = keyStart + keyMatch[2].length;
      push('key', keyStart, keyEnd);
    }

    // anchor & alias &name / *name
    let m;
    const anchorRe = /[&*][A-Za-z0-9_-]+/g;
    while ((m = anchorRe.exec(line))) {
      push('var', lineStart + m.index, lineStart + m.index + m[0].length);
    }

    // tag !!type
    const tagRe = /!![^\s]+/g;
    while ((m = tagRe.exec(line))) {
      push('type', lineStart + m.index, lineStart + m.index + m[0].length);
    }

    // numeri e bool "sciolti" (approssimato)
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

    // list marker "-"
    const listM = line.match(/^(\s*)-\s+/);
    if (listM) {
      const p = lineStart + listM[1].length;
      push('op', p, p + 1);
    }

    i = j + 1;
  }
  return tokens;
}

/* ---------- Bash / sh ---------- */
function lexBash(text) {
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

    // shebang
    if (i === 0 && text.startsWith('#!', 0)) {
      let j = 0;
      while (j < L && text[j] !== '\n') j++;
      push('pp', 0, j);
      i = j;
      continue;
    }

    // comment (se non in stringa)
    if (ch === '#') {
      let j = i + 1;
      while (j < L && text[j] !== '\n') j++;
      push('com', i, j);
      i = j;
      continue;
    }

    // strings: ' " `...`
    if (ch === "'" || ch === '"' || ch === '`') {
      const [s, e] = readString(text, i, ch);
      push('str', s, e);
      i = e;
      continue;
    }

    // variables: $VAR o ${...}
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

    // numbers
    if (/\d|-/.test(ch)) {
      const [s, e] = readNumber(text, i);
      if (e > i) {
        push('num', s, e);
        i = e;
        continue;
      }
    }

    // words / keywords / commands (approssimato)
    if (/[A-Za-z_]/.test(ch)) {
      let j = i + 1;
      while (/[A-Za-z0-9_.-]/.test(text[j] || '')) j++;
      const w = text.slice(i, j);
      push(KW.has(w) ? 'kw' : 'id', i, j);
      i = j;
      continue;
    }

    // operators
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

/* <pre is="pix-highlighter" lang="markdown">
  <code>
    # Hello **world**!

    > Quote
    - Item 1
    - Item 2

    \`inline code\` and a [link](https://example.com).

    ```js
    console.log("fenced code");
    ````
  </code>
</pre>

<pre is="pix-highlighter" lang="yml">
  <code>
    ---
    name: Pixu
    features:
      - vanilla
      - no-deps
    enabled: true
    image: "avatar.png" # comment
  </code>
</pre>

<pre is="pix-highlighter" lang="bash">
  <code>
    #!/usr/bin/env bash
    if [ -f "file.txt" ]; then
      echo "Found: $PWD"
    fi
  </code>
</pre> */

// ### Nota
// - Nessun fallback DOM: se `CSS.highlights` non è disponibile, non viene fatto nulla (contenuto “plain”).
// - Puoi continuare a personalizzare i colori con le CSS custom properties già presenti (incluse quelle per Markdown). Vuoi che aggiunga **regex literal per JS/TS**, **heredoc PHP** o **raw strings con # in Rust**? Dimmi cosa priorizzare e lo metto subito.
