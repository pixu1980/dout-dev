'use strict';

const path = require('path');
const fs = require('fs');
const { slugify, dateToMonthLabel, dateToMonthKey, dateToFilterFormat } = require('./utils');

module.exports = (parser, paths) => {
  const posts = [];

  const postTemplate = fs.readFileSync(path.join(paths.templates, 'post.template.html'), 'utf8');

  fs.readdirSync(paths.posts).forEach((file, index) => {
    const fileExt = file.split('.').pop();
    const fileName = file.replace(`.${fileExt}`, '');

    if (['md', 'markdown'].includes(fileExt)) {
      const postPath = path.join(paths.posts, file);
      const postParsed = parser.parse(postPath);
      const postTags = (postParsed.data.tags || []).map((tag) => ({
        key: slugify(tag),
        label: tag,
      }));

      const postData = {
        // ...postParsed.data,
        layout: postParsed.data.layout,
        title: postParsed.data.title,
        date: new Date(postParsed.data.date),
        published: postParsed.data.published,
        tags: postTags,
        series: postParsed.data.series,
        canonicalUrl: postParsed.data.canonical_url,
        coverImage: postParsed.data.cover_image,
        description: postParsed.data.description,
        name: fileName,
        path: path.join(paths.pages.posts, `${fileName}.html`),
      };

      const postJson = JSON.stringify({
        ...postData,
        title: ' - ' + postData.title,
        path: postData.path.replaceAll(paths.src, '.'),
      });

      const postHtml = postTemplate
        .replaceAll('###LAYOUT###', postData.layout || './layouts/leaf.html')
        .replaceAll('###LOCALS###', postJson)
        .replaceAll('###CONTENT###', postParsed.html)
        .trim();

      fs.writeFileSync(postData.path, postHtml);
      console.log('post html file written in ', postData.path);

      posts.push({
        ...postData,
        path: postData.path.replaceAll(paths.src, '.'),
      });
    }
  });

  posts.sort((postA, postB) => postB.date.getTime() - postA.date.getTime());

  fs.writeFileSync(path.join(paths.data, 'posts.json'), JSON.stringify(posts, null, 2));
  console.log('posts.json file written in ', path.join(paths.data, 'posts.json'));

  return posts;
};
