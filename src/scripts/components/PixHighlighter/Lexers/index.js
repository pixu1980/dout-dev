import { lexBash } from './_Bash.js';
import { lexC, lexCPP } from './_C.js';
import { lexCSharp } from './_Csharp.js';
import { lexCSS } from './_CSS.js';
import { lexGo } from './_Go.js';
import { lexHTML } from './_HTML.js';
import { lexJS } from './_JavaScript.js';
import { lexJSON } from './_JSON.js';
import { lexMarkdown } from './_Markdown.js';
import { lexPHP } from './_Php.js';
import { lexPython } from './_Python.js';
import { lexRust } from './_Rust.js';
import { lexTS } from './_TypeScript.js';
import { TOKEN_TYPES, normalizeLanguage, normalizeLang } from './_Utils.js';
import { lexYAML } from './_YAML.js';

const LEXERS = new Map([
  ['js', lexJS],
  ['ts', lexTS],
  ['css', lexCSS],
  ['json', lexJSON],
  ['html', lexHTML],
  ['python', lexPython],
  ['rust', lexRust],
  ['c', lexC],
  ['cpp', lexCPP],
  ['php', lexPHP],
  ['csharp', lexCSharp],
  ['go', lexGo],
  ['markdown', lexMarkdown],
  ['md', lexMarkdown],
  ['yml', lexYAML],
  ['yaml', lexYAML],
  ['bash', lexBash],
  ['sh', lexBash],
]);

export function getLexer(language) {
  return LEXERS.get(normalizeLanguage(language)) ?? null;
}

export {
  TOKEN_TYPES,
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
  normalizeLanguage,
  normalizeLang,
};
