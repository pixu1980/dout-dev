'use strict';

const path = require('path');
const fs = require('fs');
const { slugify, dateToMonthLabel, dateToMonthKey, dateToFilterFormat } = require('./utils');

module.exports = (parser, paths, posts) => {
  let tags = [
    ...new Map(
      posts
        .reduce((tags, post) => {
          return [...new Set([...tags, ...post.tags])];
        }, [])
        .map((tag) => [
          tag.key,
          {
            ...tag,
            path: path.join(paths.pages.tags, `${tag.key}.html`),
          },
        ])
    ).values(),
  ];

  fs.writeFileSync(
    path.join(paths.data, 'tags.json'),
    JSON.stringify(
      tags.map((tag) => ({
        ...tag,
        path: tag.path.replaceAll(paths.src, '.'),
      }))
    )
  );

  console.log('tags.json file written in ', path.join(paths.data, 'tags.json'));

  const tagTemplate = fs.readFileSync(path.join(paths.templates, 'tag.template.html'), 'utf8');

  tags.forEach((tag) => {
    const tagFileContent = tagTemplate.replaceAll('###LABEL###', tag.label).replaceAll('###KEY###', tag.key);
    fs.writeFileSync(tag.path, tagFileContent);
    console.log('tag html file written in ', tag.path);
  });

  return tags;
};
