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
  "baseUrl": null,
  "breaks": false,
  "extensions": null,
  "gfm": true,
  "headerIds": true,
  "headerPrefix": "",
  "highlight": function (code) {
    return require('highlight.js').highlightAuto(code).value;
  },
  "langPrefix": "language-",
  "mangle": true,
  "pedantic": false,
  "sanitize": false,
  "sanitizer": null,
  "silent": false,
  "smartLists": false,
  "smartypants": false,
  "tokenizer": null,
  "walkTokens": null,
  "xhtml": false,
  locals
}