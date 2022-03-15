const fs = require('fs');
const matter = require('gray-matter');
const highlightJS = require('highlight.js');
const marked = require('marked');

module.exports = class MarkdownParser {
  renderer;

  parse(path) {
    const content = fs.readFileSync(path);
    const data = matter(content);
    const html = marked.marked(data.content, {
      breaks: false,
      gfm: true,
      headerIds: true,
      headerPrefix: "",
      highlight: function (code) {
        return highlightJS.highlightAuto(code).value;
      },
      langPrefix: "language-",
      mangle: true,
      pedantic: false,
      sanitize: false,
      silent: false,
      smartLists: false,
      smartypants: false,
      xhtml: false,
      renderer: this.renderer
    });

    return {
      data: data.data,
      html
    }
  }

  constructor() {
    this.renderer = new marked.Renderer();
    this.renderer.link = (href, title, text) => `
      <a href="${href}" target="_blank" rel="noopener noreferrer" title="${title}">${text}</a>
    `;
  }
}
