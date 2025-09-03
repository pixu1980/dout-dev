const { JSDOM } = require('jsdom');

// Test completo del processo JSDOM
const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <title>Test</title>
</head>
<body>
  <h1>Test</h1>
  <script src="/scripts/main.js" type="module" defer></script>
</body>
</html>
`;

console.log('Original HTML:');
console.log(html);

const dom = new JSDOM(html);
console.log('\n1. After JSDOM parsing (documentElement.outerHTML):');
console.log(dom.window.document.documentElement.outerHTML);

console.log('\n2. After dom.serialize():');
console.log(dom.serialize());

const scriptEl = dom.window.document.querySelector('script');
console.log('\n3. Script element attributes:');
console.log('- src:', scriptEl.getAttribute('src'));
console.log('- type:', scriptEl.getAttribute('type'));
console.log('- defer:', scriptEl.getAttribute('defer'));
console.log('- outerHTML:', scriptEl.outerHTML);
