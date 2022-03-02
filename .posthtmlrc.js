//requiring path and fs modules
const path = require('path');
const fs = require('fs');
//joining path of directory 
const dir = '/src/posts';
const dirPath = path.join(__dirname, dir);
const posts = [];

fs.readdirSync(dirPath).forEach((file) => {
  file.endsWith('.md') && posts.push({
    name: file.split('.').slice(0, -1).join('.'),
    path: [dir, file].join('/').replace('/src', '.'),
  });
});

const locals = {
  posts
}

module.exports = {
  "plugins": {
    "posthtml-doctype": {
      "doctype": "HTML 5"
    },
    "posthtml-expressions": { locals: locals },
    "posthtml-extend": { root: './src/layouts', strict: false },
    "posthtml-include": {},
    "posthtml-modules": {},
    "posthtml-prism": {}
  }
}
