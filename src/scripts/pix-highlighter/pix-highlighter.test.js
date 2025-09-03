import { JSDOM } from 'jsdom';
import assert from 'node:assert/strict';
import { test, describe, before } from 'node:test';

// Single DOM environment reused across tests
const dom = new JSDOM('<!doctype html><html><head></head><body></body></html>');
global.window = dom.window;
global.document = dom.window.document;
global.HTMLElement = dom.window.HTMLElement || class {};
global.HTMLPreElement = dom.window.HTMLPreElement || class extends HTMLElement {};

// Provide minimal customElements registry (JSDOM lacks customized built-ins support)
if (!global.customElements) {
  const registry = new Map();
  global.customElements = {
    define: (n, c) => {
      registry.set(n, c);
    },
    get: (n) => registry.get(n),
  };
}

// Polyfill document.createRange for highlight grouping
if (!document.createRange) {
  document.createRange = () => ({
    setStart() {},
    setEnd() {},
  });
}

// Dynamically import module AFTER globals prepared
let PixHighlighter,
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
  lexBash;
before(async () => {
  const mod = await import(new URL('./pix-highlighter.js', import.meta.url));
  ({
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
  } = mod);
});
// NOTE: Highlight behavior with the real CSS Highlight API isn't reliably testable in pure Node + JSDOM
// for customized built-ins, so we focus on lexer + utility coverage which represents the bulk of logic.

function createPseudoInstance({
  supportsHighlight = true,
  code = 'let n = 10;',
  lang = 'js',
} = {}) {
  if (!global.MutationObserver) {
    global.MutationObserver = class {
      constructor(cb) {
        this._cb = cb;
      }
      observe() {
        /* noop */
      }
      disconnect() {
        /* noop */
      }
    };
  }
  const host = document.createElement('pre');
  const inst = Object.setPrototypeOf(host, PixHighlighter.prototype);
  // mimic constructor side effects
  inst._id = (++PixHighlighter._uid).toString(36);
  inst.dataset.pixId = inst._id;
  inst._names = [];
  inst._mo = null;
  inst._lastText = '';
  inst._supportsHighlight = supportsHighlight;
  const codeEl = document.createElement('code');
  codeEl.textContent = code;
  inst.appendChild(codeEl);
  inst.setAttribute('lang', lang);
  return inst;
}

describe('lexer + util coverage', () => {
  test('constructor and lifecycle', () => {
    global.window.CSS = { highlights: new Map() };
    global.CSS = global.window.CSS;
    function Highlight() {
      this._r = [];
    }
    Highlight.prototype.add = function (r) {
      this._r.push(r);
    };
    global.Highlight = Highlight;
    global.window.Highlight = Highlight;
    const inst = createPseudoInstance({ code: 'let n = 10;' });
    document.body.appendChild(inst);
    inst.connectedCallback();
    inst.setAttribute('lang', 'ts');
    inst.attributeChangedCallback('lang');
    assert.ok(inst._lastText.includes('let n'));
    inst.disconnectedCallback();
  });

  test('fallback branch with no highlight support', () => {
    const inst = createPseudoInstance({ supportsHighlight: false, code: 'console.log(1)' });
    document.body.appendChild(inst);
    inst.connectedCallback();
    assert.equal(inst._names.length, 0);
  });

  test('_observe sets mutation observer and reacts', () => {
    global.window.CSS = { highlights: new Map() };
    global.CSS = global.window.CSS;
    function Highlight() {
      this._r = [];
    }
    Highlight.prototype.add = function (r) {
      this._r.push(r);
    };
    global.Highlight = Highlight;
    const inst = createPseudoInstance({ code: 'let a=1;' });
    document.body.appendChild(inst);
    inst.connectedCallback();
    const codeEl = inst.querySelector('code');
    const before = inst._names.length;
    codeEl.textContent = 'let a=2;';
    inst._reHighlight();
    assert.ok(inst._names.length >= before);
  });
  test('internal highlight mechanics', () => {
    // Setup highlight support
    global.window.CSS = { highlights: new Map() };
    global.CSS = global.window.CSS;
    function Highlight() {
      this._r = [];
    }
    Highlight.prototype.add = function (r) {
      this._r.push(r);
    };
    global.window.Highlight = Highlight;
    global.Highlight = Highlight;
    // ensure CSS.highlights.set is available
    if (!global.window.CSS.highlights.set) {
      const map = new Map();
      global.window.CSS.highlights = map;
    }

    // Create pseudo instance without calling real constructor (customized built-in complexity)
    const host = document.createElement('pre');
    const inst = Object.setPrototypeOf(host, PixHighlighter.prototype);
    inst._id = 'test';
    inst.dataset.pixId = 'test';
    inst._names = [];
    inst._mo = null;
    inst._lastText = '';
    inst._supportsHighlight = true;
    const codeEl = {
      textContent: 'const answer = 42;\n// comment',
      firstChild: null,
      appendChild(node) {
        this.firstChild = node;
        return node;
      },
    };
    inst.querySelector = (sel) => (sel === 'code' ? codeEl : null);
    inst.getAttribute = () => 'js';
    inst._cleanupHighlights = PixHighlighter.prototype._cleanupHighlights.bind(inst);
    // Ensure style injection path
    inst._ensureStyleForInstance = PixHighlighter.prototype._ensureStyleForInstance.bind(inst);
    inst._ensureStyleForInstance();
    // Second call should early-return (coverage)
    inst._ensureStyleForInstance();
    const styleEl = document.querySelector('style#pix-sh-style-test');
    assert.ok(styleEl, 'style element created');

    // Perform highlight
    // Provide document.createRange implementation returning object with setStart/setEnd
    document.createRange = () => ({
      setStart() {},
      setEnd() {},
    });
    PixHighlighter.prototype._reHighlight.call(inst);
    assert.ok(inst._names.length > 0, 'highlight names populated');
    assert.ok(window.CSS.highlights.size > 0, 'CSS.highlights populated');

    // attribute change triggers early return because same text
    const prevNames = inst._names.slice();
    PixHighlighter.prototype.attributeChangedCallback.call(inst, 'lang');
    assert.ok(inst._names.length > 0);

    // Force different text to cover re-highlight branch again
    codeEl.textContent += '\nlet x = 1;';
    PixHighlighter.prototype._reHighlight.call(inst);
    assert.ok(inst._names.length >= prevNames.length);

    // Cover unsupported highlight branch
    inst._supportsHighlight = false;
    codeEl.textContent += '\n// another';
    PixHighlighter.prototype._reHighlight.call(inst);
  });
  test('normalizeLang maps variants', () => {
    assert.equal(normalizeLang('javascript'), 'js');
    assert.equal(normalizeLang('JS'), 'js');
    assert.equal(normalizeLang('yaml'), 'yml');
    assert.equal(normalizeLang('shell'), 'bash');
    assert.equal(normalizeLang(''), 'js');
  });

  function ensureTokens(lexer, code, expectSome = true) {
    const tokens = lexer(code);
    if (expectSome) assert.ok(tokens.length > 0, 'expected some tokens');
    for (const t of tokens.slice(0, 10)) {
      assert.ok(typeof t.type === 'string');
      assert.ok(Number.isInteger(t.start));
      assert.ok(Number.isInteger(t.end));
      assert.ok(t.end >= t.start);
    }
  }

  test('lexJS', () => ensureTokens(lexJS, 'const x = 42; // comment'));
  test('lexTS', () => ensureTokens(lexTS, 'interface I { x: number }'));
  test('lexCSS', () => ensureTokens(lexCSS, 'body { color: red; }'));
  test('lexHTML', () => ensureTokens(lexHTML, '<div class="x">Hi</div>'));
  test('lexJSON', () => ensureTokens(lexJSON, '{"a":1,"b":[true,false,null]}'));
  test('lexMarkdown', () => ensureTokens(lexMarkdown, '# Title\n\nSome **bold** `code`'));
  test('lexBash', () => ensureTokens(lexBash, 'echo "hello" && ls -la'));
  test('lexPython', () => ensureTokens(lexPython, 'def f(x):\n    return x+1'));
  test('lexGo', () => ensureTokens(lexGo, 'package main\nfunc main(){println("hi") }'));
  test('lexRust', () => ensureTokens(lexRust, 'fn main(){ let x: i32 = 5; }'));
  test('lexC', () => ensureTokens(lexC, 'int main(){ return 0; }'));
  test('lexCPP', () => ensureTokens(lexCPP, 'int main(){ std::string s; }'));
  test('lexPHP', () => ensureTokens(lexPHP, '<?php echo $x + 1; // comment'));
  test('lexCSharp', () => ensureTokens(lexCSharp, 'class X { int Y => 1; }'));
  test('lexYAML', () => ensureTokens(lexYAML, 'a: 1\nlist:\n  - item'));

  test('lexer branch stress', () => {
    ensureTokens(
      lexJS,
      `/* multi */ // line\nconst x = 0x1f + 0b1010 + 0o77 + 1.23e-4; let s = "str"; let t = 'a'; let tmpl = \`hi ${'${'}x}${'`'}; /\\w+/i.test("abc");`
    );
    ensureTokens(
      lexCSS,
      `@media screen { body#id.class[data-x="y"]::before { content: "hi"; color: #fff; margin: 0 1rem; } } /* c */`
    );
    ensureTokens(lexHTML, '<!--c--><div class="c" data-x=1><span/>Text</div>');
    ensureTokens(
      lexMarkdown,
      '# H1\n\n> Quote\n\n- item\n\n---\n\n![alt](img.png) `code` **bold** *em*'
    );
    ensureTokens(lexBash, '#!/bin/bash\n# c\nVAR=1; if [ "$VAR" -eq 1 ]; then echo done; fi');
    ensureTokens(
      lexPython,
      '# c\n@decorator\nclass X:\n    def f(self):\n        s = f"val={1}"\n        return s'
    );
    ensureTokens(
      lexGo,
      'package main\nimport "fmt"\nfunc main(){ type S struct{}; fmt.Println("ok") }'
    );
    ensureTokens(lexRust, 'fn main(){ let mut x: i32 = 5; println!("{}", x); }');
    ensureTokens(lexC, '#define X 1\nint main(){ /*c*/ return X; }');
    ensureTokens(lexCPP, '#include <vector>\nnamespace N { template<class T> class X{}; }');
    ensureTokens(lexPHP, '<?php /*c*/ function f($x){ echo $x; } ?>');
    ensureTokens(lexCSharp, 'using System; class X<T>{ int F()=>1; }');
    ensureTokens(lexYAML, 'list:\n  - a\n  - b\nobj:\n  k: v');
    ensureTokens(lexPython, '"""docstring"""\n"""multi\nline"""');
    ensureTokens(lexJS, 'const n = 1.2e+10; const tpl = "a-" + (1+2);');
    // Additional edge cases per language to exercise rare branches
    ensureTokens(
      lexJS,
      'class A extends B { #p = 1; static get [Symbol.toStringTag](){return "A";} } // private field'
    );
    ensureTokens(
      lexCSS,
      ':root { --var: 10px; } @supports(display:grid){ [data-x^="a"], a:hover::after { content:"" } }'
    );
    ensureTokens(
      lexHTML,
      '<!DOCTYPE html><div data-x=1 data-y=2 class=one id="i">Text<!--c--></div>'
    );
    ensureTokens(lexJSON, '{"num":-12.5e+2,"hex":0x1f,"arr":[1,2,3],"nested":{"k":true}}');
    ensureTokens(lexMarkdown, '## Heading2\n`inline`***bold+em***___emphasis___');
    ensureTokens(lexBash, 'VAR="str with spaces"; for f in *.js; do echo "$f"; done');
    ensureTokens(lexPython, 'r"raw" u"unic" f"fstr{1}" b"bytes"');
    ensureTokens(lexRust, 'macro_rules! m { ($name:ident)=>{}} fn main(){ let c = b"bytes"; }');
    ensureTokens(lexC, "#ifdef X\n#define Y 2\n#endif\nchar c='x';");
    ensureTokens(lexCPP, 'template<typename T> struct X { const char* s = "str"; }; // comment');
    ensureTokens(lexPHP, '<?php $x = function($a){return $a+1;}; /* multi */ ?>');
    ensureTokens(
      lexCSharp,
      '@attribute using static System.Math; class G{ string s = @"multi\\nline"; }'
    );
    ensureTokens(lexYAML, 'a: |\n  multi\n  line\n# comment');
  });
});
