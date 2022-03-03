const { locals } = require('./.mdblogrc.js');

module.exports = {
  "plugins": {
    "posthtml-doctype": {
      "doctype": "HTML 5"
    },
    "posthtml-expressions": { locals: locals },
    "posthtml-extend": { root: './src', strict: false },
    "posthtml-include": { root: './src' },
    "posthtml-modules": {}
  }
}
