'use strict';

const path = require('path');
const fs = require('fs');
const { slugify, dateToMonthLabel, dateToMonthKey, dateToFilterFormat } = require('./utils');

module.exports = (parser, paths, posts) => {
  let months = [];

  months = [
    ...new Map(
      posts
        .reduce(
          (months, post) => [
            ...months,
            {
              key: dateToMonthKey(post.date),
              label: dateToMonthLabel(post.date),
            },
          ],
          []
        )
        .map((month) => {
          const from = new Date(`${month.key}-01`);
          let to = new Date(from);
          to.setMonth(to.getMonth() + 1);
          to.setTime(to.getTime() - 24 * 3600000);

          return [
            month.key,
            {
              ...month,
              from,
              to,
              path: path.join(paths.pages.months, `${month.key}.html`),
            },
          ];
        })
    ).values(),
  ];

  fs.writeFileSync(
    path.join(paths.data, 'months.json'),
    JSON.stringify(
      months.map((month) => ({
        ...month,
        path: month.path.replaceAll(paths.src, '.'),
      })),
      null,
      2
    )
  );
  console.log('months.json file written in ', path.join(paths.data, 'months.json'));

  const monthTemplate = fs.readFileSync(path.join(paths.templates, 'month.template.html'), 'utf8');

  months.forEach((month) => {
    const monthFileContent = monthTemplate
      .replaceAll('###LABEL###', month.label)
      .replaceAll('###FROM###', dateToFilterFormat(month.from))
      .replaceAll('###TO###', dateToFilterFormat(month.to));

    fs.writeFileSync(month.path, monthFileContent);
    console.log('month html file written in ', month.path);
  });

  return months;
};
