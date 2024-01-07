// const path = require('path');
// "posthtml-extend": { root: path.resolve(__dirname), strict: false, expressions: { locals } },
// "posthtml-include": { root: path.resolve(__dirname), posthtmlExpressionsOptions: { locals } },
// "posthtml-modules": { root: path.resolve(__dirname), locals }

const posts = require('./data/posts.json').map((post) => ({ ...post, date: new Date(post.date) ?? null }));
const months = require('./data/months.json').map((month) => ({
  ...month,
  from: new Date(month.from),
  to: new Date(month.to),
}));

const tags = require('./data/tags.json');

const locals = {
  currentYear: new Date().getFullYear(),
  lastPost: posts[0],
  posts: posts,
  months: months,
  tags,
};

module.exports = {
  plugins: {
    'posthtml-expressions': { locals },
    'posthtml-extend': { root: './src', strict: false, expressions: { locals } },
    'posthtml-include': { root: './src', posthtmlExpressionsOptions: { locals } },
  },
};
