const { JSDOM } = require('jsdom');

// Test JSDOM with script type module
const html = `
<!DOCTYPE html>
<html>
<head><title>Test</title></head>
<body>
  <h1>Test</h1>
  <script src="/scripts/main.js" type="module" defer></script>
</body>
</html>
`;

console.log('Original HTML:');
console.log(html);

const dom = new JSDOM(html);
console.log('\nAfter JSDOM parsing:');
console.log(dom.window.document.documentElement.outerHTML);

const scriptElement = dom.window.document.querySelector('script');
console.log('\nScript element attributes:');
console.log('- src:', scriptElement.getAttribute('src'));
console.log('- type:', scriptElement.getAttribute('type'));
console.log('- defer:', scriptElement.getAttribute('defer'));
console.log('- hasAttribute(type):', scriptElement.hasAttribute('type'));
