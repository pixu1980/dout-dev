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
    posts: path.join(__dirname, '../src/pages/posts'),
    months: path.join(__dirname, '../src/pages/months'),
    tags: path.join(__dirname, '../src/pages/tags'),
  },
  templates: path.join(__dirname, '../src/templates')
}

const posts = [];
let months = [];
let tags = [];

const postTemplate = fs.readFileSync(path.join(paths.templates, 'post.template.html'), 'utf8');

fs.readdirSync(paths.posts).forEach((file) => {
  const fileExt = file.split('.').pop();
  const fileName = file.replace(`.${fileExt}`, '');

  if (['md', 'markdown'].includes(fileExt)) {
    const postPath = path.join(paths.posts, file);
    const postParsed = parser.parse(postPath);
    const postTags = (postParsed.data.tags || []).map(tag => ({
      key: slugify(tag), label: tag,
    }));

    tags.push(...postTags);

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
      path: postData.path.replaceAll(paths.src, '.')
    });

    const postHtml = postTemplate
      .replaceAll('###LAYOUT###', postData.layout || './layouts/leaf.html')
      .replaceAll('###LOCALS###', postJson)
      .replaceAll('###CONTENT###', postParsed.html).trim();

    fs.writeFileSync(postData.path, postHtml);

    posts.push({
      ...postData,
      path: postData.path.replaceAll(paths.src, '.')
    });
  }
});

posts.sort((postA, postB) => (new Date(postB.date)).getTime() - (new Date(postA.date)).getTime());

fs.writeFileSync(path.join(paths.data, 'posts.json'), JSON.stringify(posts));

tags = [...new Map(tags.map(tag => [tag.key, {
  ...tag,
  path: path.join(paths.pages.tags, `${tag.key}.html`)
}])).values()];

fs.writeFileSync(path.join(paths.data, 'tags.json'), JSON.stringify(tags.map(tag => ({
  ...tag,
  path: tag.path.replaceAll(paths.src, '.')
}))));

const tagTemplate = fs.readFileSync(path.join(paths.templates, 'tag.template.html'), 'utf8');

tags.forEach(tag => {
  const tagFileContent = tagTemplate.replaceAll('###LABEL###', tag.label).replaceAll('###KEY###', tag.key);
  fs.writeFileSync(tag.path, tagFileContent);
});

months = [...new Map(posts.reduce((months, post) => [...months, {
  key: dateToMonthKey(post.date),
  label: dateToMonthLabel(post.date),
}], []).map(month => {
  const from = new Date(`${month.key}-01`);
  let to = new Date(from);
  to.setMonth(to.getMonth() + 1);
  to.setTime(to.getTime() - 24 * 3600000);

  return [month.key, {
    ...month,
    from,
    to,
    path: path.join(paths.pages.months, `${month.key}.html`)
  }]
})).values()];

fs.writeFileSync(path.join(paths.data, 'months.json'), JSON.stringify(months.map(month => ({
  ...month,
  path: month.path.replaceAll(paths.src, '.')
}))));

const monthTemplate = fs.readFileSync(path.join(paths.templates, 'month.template.html'), 'utf8');

months.forEach(month => {
  const monthFileContent = monthTemplate
    .replaceAll('###LABEL###', month.label)
    .replaceAll('###FROM###', dateToFilterFormat(month.from))
    .replaceAll('###TO###', dateToFilterFormat(month.to));

  fs.writeFileSync(month.path, monthFileContent);
});
