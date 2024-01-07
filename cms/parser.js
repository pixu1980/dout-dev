const fs = require('fs');
const matter = require('gray-matter');
const highlightJS = require('highlight.js');
const marked = require('marked');
// const { gfmHeadingId: markedHeadingId } = require('marked-gfm-heading-id');
// const { markedHighlight } = require('marked-highlight');
// const { mangle: markedMangle } = require('marked-mangle');
module.exports = class MarkdownParser {
  renderer;

  parse(path) {
    const content = fs.readFileSync(path);
    const data = matter(content);

    // marked.use(markedHeadingId({ prefix: '' }));

    // marked.use(
    //   markedHighlight({
    //     langPrefix: 'hljs language-',
    //     highlight(code, lang) {
    //       const language = highlightJS.getLanguage(lang) ? lang : 'plaintext';
    //       return highlightJS.highlight(code, { language }).value;
    //       // return highlightJS.highlightAuto(code).value;
    //     },
    //   })
    // );

    // marked.use(markedMangle());

    // const html = marked.marked(data.content, {
    //   breaks: false,
    //   gfm: true,
    //   pedantic: false,
    //   sanitize: false,
    //   silent: false,
    //   smartLists: false,
    //   smartypants: false,
    //   xhtml: false,
    //   renderer: this.renderer,
    // });

    const html = marked.marked(data.content, {
      breaks: false,
      gfm: true,
      headerIds: true,
      headerPrefix: '',
      highlight: function (code, lang) {
        // https://benborgers.com/posts/marked-prism
        // https://prismjs.com/#basic-usage
        // duotone 
        return highlightJS.highlightAuto(code).value;
      },
      langPrefix: 'language-',
      mangle: true,
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
