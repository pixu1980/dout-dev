import { TemplateRenderer } from '../scripts/template-engine/renderer.js';

const renderer = new TemplateRenderer(process.cwd());

// Test con il template post reale
try {
  const result = renderer.render('src/templates/post.html', {
    post: {
      title: 'Test Post',
      excerpt: 'Test excerpt',
      content: 'Test content',
    },
    site: {
      title: 'Test Site',
    },
  });

  console.log('Post template result (first 1000 chars):');
  console.log(result.substring(0, 1000));

  // Cerchiamo il tag script
  const scriptMatch = result.match(/<script[^>]*src="\/scripts\/main\.js"[^>]*>/);
  if (scriptMatch) {
    console.log('\nScript tag found:');
    console.log(scriptMatch[0]);
    console.log('Contains type="module":', scriptMatch[0].includes('type="module"'));
  } else {
    console.log('\nScript tag not found');
  }
} catch (error) {
  console.error('Error:', error);
}
