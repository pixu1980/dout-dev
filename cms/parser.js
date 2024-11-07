const fs = require('fs');
const matter = require('gray-matter');
const marked = require('marked');
const prism = require("prismjs");

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

    this.renderer.code = function ({ text, lang, escaped }) {
      const highlightedCode = prism.languages[lang] ? prism.highlight(text, prism.languages[lang], lang): text;
      const highlightedCodeLines = highlightedCode.split(/\r\n|\r|\n/);
      
      return `<pre><code class="${lang ? `language-${lang}` : ''}">${highlightedCodeLines.map((line) => `<span code-line>${line}</span>`).join('\n')}</code></pre>`;
    
    };

    this.renderer.link = ({ href, title, text }) => {
      return `<a href="${href}" target="_blank" rel="noopener noreferrer" title="${title}">${text}</a>`;
    }
  }
};
