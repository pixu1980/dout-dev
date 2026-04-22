import { TemplateRenderer } from '../scripts/template-engine/_renderer.js';

const renderer = new TemplateRenderer(process.cwd());

// Test base layout direttamente
try {
  const result = renderer.render('src/layouts/base.html', {
    site: {
      title: 'Test Site',
      description: 'Test Description',
    },
  });

  console.log('Base layout result (searching for script):');
  const scriptMatch = result.match(/<script[^>]*src="\/scripts\/main\.js"[^>]*>/);
  if (scriptMatch) {
    console.log('Script tag found:');
    console.log(scriptMatch[0]);
    console.log('Contains type="module":', scriptMatch[0].includes('type="module"'));
  } else {
    console.log('Script tag not found');
  }
} catch (error) {
  console.error('Error:', error);
}
