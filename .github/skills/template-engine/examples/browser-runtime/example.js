import TemplateEngine from '../../code/public/browser.js';

const templates = {
  '/components/card.html': `<article><h2>{{ post.title }}</h2><p>{{ post.summary }}</p></article>`,
};

const engine = new TemplateEngine({
  rootDir: '/',
  templates,
});

const html = engine.renderString(
  `<include src="/components/card.html" data='{"post": {{ featured | json | raw }}}'></include>`,
  {
    featured: {
      title: 'Browser Runtime',
      summary: 'Rendered from an in-memory template registry.',
    },
  },
  { currentDir: '/' }
);

document.querySelector('#app').innerHTML = html;
