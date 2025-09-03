const path = require('node:path');
const fs = require('node:fs');

// Get the DOM-based renderer
const { DOMTemplateRenderer } = require('../scripts/template-engine/index.js');

// Test data
const testData = {
  posts: [
    {
      title: 'First Post',
      tags: ['js', 'web'],
    },
    {
      title: 'Second Post',
      tags: ['css', 'design'],
    },
  ],
};

console.log('🔄 Simple Nested Loop Test...');

// Initialize renderer
const renderer = new DOMTemplateRenderer(__dirname);

// Load template
const template = fs.readFileSync(path.join(__dirname, 'simple-nested.html'), 'utf8');

console.log('Template:');
console.log(template);

console.log('\n🎨 Rendering...');
const rendered = renderer.renderString(template, testData);

console.log('\n📋 Result:');
console.log(rendered);
