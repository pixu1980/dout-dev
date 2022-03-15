const posts = require('./data/posts.json');
const months = require('./data/months.json');
const tags = require('./data/tags.json');

const locals = {
  currentYear: (new Date()).getFullYear(),
  posts: posts.map(post => ({ ...post, date: new Date(post.date) ?? null })),
  months: months.map(month => ({ ...month, from: new Date(month.from), to: new Date(month.to) })),
  tags
}

module.exports = {
  "plugins": {
    "posthtml-expressions": { removeScriptLocals: true, locals },
    "posthtml-extend": { root: './src', strict: false, expressions: { locals } },
    "posthtml-include": { root: './src', posthtmlExpressionsOptions: { locals } },
    "posthtml-modules": { root: './src', locals }
  }
}
