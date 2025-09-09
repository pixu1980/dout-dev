/**
 * <pre is="pix-highlighter" lang="js|ts|css|json|html|python|rust|c|cpp|php|csharp|go|markdown|md|yml|yaml|bash|sh"><code>...</code></pre>
 * - Evidenzia tramite CSS Custom Highlight API (::highlight(...)).
 * - NIENTE fallback DOM: se l'API non c'è, il codice resta così com'è.
 * - Lexer modulari (uno per file) e veloci (best-effort).
 */
import { lexBash } from './pix-highlighter-lex-bash.js';
import { lexC, lexCPP } from './pix-highlighter-lex-c.js';
import { lexCSharp } from './pix-highlighter-lex-csharp.js';
import { lexCSS } from './pix-highlighter-lex-css.js';
import { lexGo } from './pix-highlighter-lex-go.js';
import { lexHTML } from './pix-highlighter-lex-html.js';
import { lexJS } from './pix-highlighter-lex-js.js';
import { lexJSON } from './pix-highlighter-lex-json.js';
import { lexMarkdown } from './pix-highlighter-lex-markdown.js';
import { lexPHP } from './pix-highlighter-lex-php.js';
import { lexPython } from './pix-highlighter-lex-python.js';
import { lexRust } from './pix-highlighter-lex-rust.js';
import { lexTS } from './pix-highlighter-lex-ts.js';
import { lexYAML } from './pix-highlighter-lex-yaml.js';

import { normalizeLang } from './pix-highlighter-lex-utils.js';

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
  lexBash,
  lexC,
  lexCPP,
  lexCSharp,
  lexCSS,
  lexGo,
  lexHTML,
  lexJS,
  lexJSON,
  lexMarkdown,
  lexPHP,
  lexPython,
  lexRust,
  lexTS,
  lexYAML,
  normalizeLang,
  PixHighlighter,
};

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
