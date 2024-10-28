const fs = require('fs');
const matter = require('gray-matter');
const marked = require('marked');
const prism = require("prismjs");

require("prismjs/components");
require("prismjs/components/prism-bash");
require("prismjs/components/prism-css");
require("prismjs/components/prism-css-extras");
require("prismjs/components/prism-scss");
require("prismjs/components/prism-javascript");
require("prismjs/components/prism-javascript");
require("prismjs/components/prism-js-extras");
require("prismjs/components/prism-js-templates");
// require("prismjs/components/prism-jsdoc");
require("prismjs/components/prism-json");
require("prismjs/components/prism-markdown");
// require("prismjs/components/prism-php");
require("prismjs/components/prism-regex");
// require("prismjs/components/prism-tsx");
require("prismjs/components/prism-typescript");
require("prismjs/components/prism-yaml");
require("prismjs/components/prism-toml");

module.exports = class MarkdownParser {
  renderer;

  parse(path) {
    const content = fs.readFileSync(path);
    const data = matter(content);

    const html = marked.marked(data.content, {
      breaks: false,
      gfm: true,
      headerIds: false,
      headerPrefix: '',
      langPrefix: 'line-numbers language-',
      highlight: function (code, lang) {
        // https://prismjs.com/#basic-usage
        if (prism.languages[lang]) {
          return prism.highlight(code, prism.languages[lang], lang);
        } else {
          return code;
        }
      },
      mangle: false,
      pedantic: false,
      sanitize: false,
      silent: false,
      smartLists: false,
      smartypants: false,
      xhtml: false,
      renderer: this.renderer,
    });

    return {
      data: data.data,
      html,
    };
  }

  constructor() {
    this.renderer = new marked.Renderer();
    this.renderer.link = (href, title, text) => `
      <a href="${href}" target="_blank" rel="noopener noreferrer" title="${title}">${text}</a>
    `;
  }
};
