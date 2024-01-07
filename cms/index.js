'use strict';

const path = require('path');
const fs = require('fs');
const MarkdownParser = require('./parser');
const { slugify, dateToMonthLabel, dateToMonthKey, dateToFilterFormat } = require('./utils');

const parser = new MarkdownParser();

const paths = {
  root: path.join(__dirname, '..'),
  src: path.join(__dirname, '../src'),
  data: path.join(__dirname, '../data'),
  posts: path.join(__dirname, '../data/posts'),
  pages: {
    posts: path.join(__dirname, '../src/posts'),
    months: path.join(__dirname, '../src/months'),
    tags: path.join(__dirname, '../src/tags'),
  },
  templates: path.join(__dirname, '../src/templates'),
};

const postsParser = require('./posts');
const posts = postsParser(parser, paths);

const monthsParser = require('./months');
const months = monthsParser(parser, paths, posts);

const tagsParser = require('./tags');
const tags = tagsParser(parser, paths, posts);
