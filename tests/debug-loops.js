const path = require('path');
const fs = require('fs');

// Get the template engine
const cms = require('../scripts/template-engine/index.js');

// Simple test data
const testData = {
  title: 'Debug Test',
  posts: [
    {
      title: 'First Post',
      author: 'John Doe',
      tags: ['javascript', 'web', 'tutorial']
    },
    {
      title: 'Second Post',
      author: 'Jane Smith',
      tags: ['css', 'design']
    },
    {
      title: 'Third Post',
      author: 'Bob Wilson',
      tags: ['html', 'accessibility', 'semantic']
    }
  ]
};

console.log('🔄 Debug Loop Testing...');

// Load and process template
const templatePath = path.join(__dirname, 'debug-template.html');
const template = fs.readFileSync(templatePath, 'utf8');

console.log('✅ Template loaded');
console.log('✅ Test data ready:', testData.posts.length, 'posts');

console.log('\n🎨 Rendering template...');
const startTime = Date.now();
const rendered = cms.render(template, testData);
const renderTime = Date.now() - startTime;

console.log(`✅ Template rendered in ${renderTime}ms`);

// Save output
const outputPath = path.join(__dirname, 'debug-output.html');
fs.writeFileSync(outputPath, rendered);
console.log('💾 Output saved to:', outputPath);

console.log('\n📋 Generated HTML:');
console.log('='.repeat(50));
console.log(rendered);
console.log('='.repeat(50));
