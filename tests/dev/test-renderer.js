import { TemplateRenderer } from '../scripts/template-engine/_renderer.js';

const renderer = new TemplateRenderer(process.cwd());

// Test semplice con script type="module"
const testTemplate = `
<!DOCTYPE html>
<html>
<head><title>Test</title></head>
<body>
  <h1>Test</h1>
  <script src="/scripts/main.js" type="module" defer></script>
</body>
</html>
`;

console.log('Original template:');
console.log(testTemplate);

try {
  const result = renderer.renderString(testTemplate, {});
  console.log('\nRenderer result:');
  console.log(result);

  // Verifichiamo se il type="module" è presente
  const hasTypeModule = result.includes('type="module"');
  console.log('\nContains type="module":', hasTypeModule);
} catch (error) {
  console.error('Error:', error);
}
