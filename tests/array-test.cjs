const path = require('node:path');
const fs = require('node:fs');

// Get the template engine
const { TemplateRenderer } = require('../scripts/template-engine/renderer.js');

// Simple test data
const testData = {
  posts: [
    {
      title: 'First Post',
      author: 'John Doe',
      tags: ['javascript', 'web', 'tutorial'],
    },
    {
      title: 'Second Post',
      author: 'Jane Smith',
      tags: ['css', 'design'],
    },
  ],
};

console.log('🔄 Array Access Testing...');

// Initialize renderer
const renderer = new TemplateRenderer(__dirname);

// Load and process template
const templatePath = path.join(__dirname, 'array-test.html');
const template = fs.readFileSync(templatePath, 'utf8');

console.log('✅ Template loaded');

console.log('\n🎨 Rendering template...');
// Use processContent method for direct template processing
const rendered = renderer.processContent(template, testData);

console.log('\n📋 Generated HTML:');
console.log('='.repeat(50));
console.log(rendered);
console.log('='.repeat(50));
