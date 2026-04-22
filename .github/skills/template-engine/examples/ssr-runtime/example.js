import TemplateEngine from '../../code/public/ssr.js';

const templates = {
  '/partials/card.html': `<article><h2>{{ post.title }}</h2></article>`,
  '/pages/home.html': `<include src="../partials/card.html" data='{"post": {{ featured | json | raw }}}'></include>`,
};

const engine = new TemplateEngine({
  rootDir: '/pages',
  templates,
});

const html = engine.render('home.html', {
  featured: { title: 'SSR Runtime' },
});

console.log(html);
