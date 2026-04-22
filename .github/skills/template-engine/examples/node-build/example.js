import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import TemplateEngine from '../../code/public/node.js';

const currentDir = dirname(fileURLToPath(import.meta.url));
const templatesDir = join(currentDir, 'templates');

const engine = new TemplateEngine({ rootDir: templatesDir });
const html = engine.render('page.html', {
  title: 'Portable Node Build',
});

console.log(html);
