const { locals } = require('./.mdblogrc.js');

console.log(locals);

module.exports = {
  "plugins": {
    "posthtml-doctype": {
      "doctype": "HTML 5"
    },
    "posthtml-expressions": { locals, removeScriptLocals: true },
    "posthtml-extend": { root: './src', strict: false, expressions: { locals } },
    "posthtml-include": { root: './src', posthtmlExpressionsOptions: { locals } },
    "posthtml-modules": { root: './src', locals }
  }
}
