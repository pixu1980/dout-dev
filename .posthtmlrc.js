const path = require('path');

const posts = require('./data/posts.json');
const postsPublished = posts.filter((post) => post.published);

const months = require('./data/months.json').map((month) => ({
  ...month,
  from: new Date(month.from),
  to: new Date(month.to),
}));

const tags = require('./data/tags.json');

const locals = {
  currentYear: new Date().getFullYear(),
  lastPost: { ...postsPublished[0] },
  posts: postsPublished,
  months,
  tags,
};

module.exports = {
  plugins: {
    'posthtml-expressions': { locals },
    'posthtml-extend': { root: './src', strict: false, locals },
    'posthtml-include': { root: './src', posthtmlExpressionsOptions: { locals } },
  },
};
