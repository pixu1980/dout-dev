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
            url: path.join(paths.pages.tags, `${tag.key}.html`),
          },
        ])
    ).values(),
  ];

  fs.writeFileSync(
    path.join(paths.data, 'tags.json'),
    JSON.stringify(
      tags.map((tag) => ({
        ...tag,
        url: tag.url.replaceAll(paths.src, '.'),
      })),
      null,
      2
    )
  );

  console.log(`tags.json file written in ${path.join(paths.data, 'tags.json')}`);

  const tagTemplate = fs.readFileSync(path.join(paths.templates, 'tag.template.html'), 'utf8');

  tags.forEach((tag) => {
    const tagFileContent = tagTemplate.replaceAll('###LABEL###', tag.label).replaceAll('###KEY###', tag.key);
    fs.writeFileSync(tag.url, tagFileContent);
    // console.log('tag html file written in ', tag.url);
  });

  console.log(`tags html files created in ${paths.pages.tags}`);

  return tags;
};
