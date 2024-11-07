const path = require('path');

const posts = require('./data/posts.json').map((post) => ({ ...post, date: new Date(post.date) ?? null }));

const months = require('./data/months.json').map((month) => ({
  ...month,
  from: new Date(month.from),
  to: new Date(month.to),
}));

const tags = require('./data/tags.json');

const locals = {
  currentYear: new Date().getFullYear(),
  lastPost: { ...posts[0], dateString: posts[0].date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }), tags: posts[0].tags.map((tag) => ({ ...tag, url: `./tags/${tag.key}.html` })) },
  posts: posts,
  months: months,
  tags: tags,
};

module.exports = {
  plugins: {
    'posthtml-expressions': { locals },
    "posthtml-extend": { root: './src', strict: false, locals },
    "posthtml-include": { root: './src', posthtmlExpressionsOptions: { locals } }
  },
};
