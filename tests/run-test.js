#!/usr/bin/env node
/**
 * Template Engine - Example Test Script
 * Testa tutte le funzionalità del template engine generando un file HTML completo
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

// Import del template engine
import { TemplateEngine } from '../scripts/template-engine/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Valida la struttura HTML per assicurarsi che sia corretta
 * @param {string} html - HTML da validare
 * @returns {object} Risultato della validazione
 */
const SELF_CLOSING_TAGS = [
  'img',
  'br',
  'hr',
  'input',
  'meta',
  'link',
  'area',
  'base',
  'col',
  'embed',
  'source',
  'track',
  'wbr',
];

function collectUnbalancedTagErrors(html) {
  const errors = [];
  const tagRegex = /<\/?([a-zA-Z][a-zA-Z0-9]*)[^>]*>/g;
  const tagStack = [];
  let match;

  while ((match = tagRegex.exec(html)) !== null) {
    const fullTag = match[0];
    const tagName = match[1].toLowerCase();
    if (fullTag.startsWith('</')) {
      if (tagStack.length === 0) {
        errors.push(`Unexpected closing tag: ${fullTag}`);
      } else {
        const lastOpenTag = tagStack.pop();
        if (lastOpenTag !== tagName) {
          errors.push(`Mismatched tag: expected ${lastOpenTag}, found ${tagName}`);
        }
      }
    } else if (!fullTag.endsWith('/>') && !SELF_CLOSING_TAGS.includes(tagName)) {
      tagStack.push(tagName);
    }
  }

  if (tagStack.length > 0) {
    errors.push(`Unclosed tags: ${tagStack.join(', ')}`);
  }
  return errors;
}

function collectTemplateArtifactErrors(html) {
  const errors = [];
  const templateArtifacts = [
    /<else-if/,
    /<else(?:\s|>)/,
    /<\/else-if>/,
    /<\/else>/,
    /<for\s/,
    /<\/for>/,
    /<if\s/,
    /<\/if>/,
    /<switch\s/,
    /<\/switch>/,
    /<case\s/,
    /<\/case>/,
    /<default>/,
    /<\/default>/,
    /<include\s/,
    /<\/include>/,
    /<extends\s/,
    /<\/extends>/,
    /<block\s/,
    /<\/block>/,
  ];
  for (const artifact of templateArtifacts) {
    if (artifact.test(html)) {
      errors.push(`Template engine artifact found: ${artifact.source}`);
    }
  }
  return errors;
}

function collectMalformedTagErrors(html) {
  return /<\s*\/?\s*>/.test(html) ? ['Empty or malformed tags found'] : [];
}

function validateHTMLStructure(html) {
  const errors = [];
  errors.push(...collectUnbalancedTagErrors(html));
  errors.push(...collectTemplateArtifactErrors(html));
  errors.push(...collectMalformedTagErrors(html));
  return { isValid: errors.length === 0, errors };
}

console.log('🚀 Starting Template Engine Complete Test...\n');

try {
  // Carica i dati di test
  console.log('📖 Loading test data...');
  const testDataPath = join(__dirname, 'test-data.json');
  const testData = JSON.parse(readFileSync(testDataPath, 'utf8'));

  // Aggiungi dati dinamici generati al runtime
  testData.generatedAt = new Date().toISOString();
  testData.buildTime = Date.now();
  testData.nodeVersion = process.version;

  console.log('✅ Test data loaded successfully');
  console.log(`   - ${testData.posts.length} posts`);
  console.log(`   - ${testData.teamMembers.length} team members`);
  console.log(`   - ${testData.features.length} features`);
  console.log(`   - ${testData.categories.length} categories\n`);

  // Inizializza il template engine
  console.log('⚙️  Initializing Template Engine...');
  const engine = new TemplateEngine({
    rootDir: __dirname,
  });
  console.log('✅ Template Engine initialized\n');

  // Testa il rendering del template
  console.log('🎨 Rendering template...');
  const startTime = Date.now();

  const result = engine.render('example.html', testData);

  const renderTime = Date.now() - startTime;
  console.log(`✅ Template rendered successfully in ${renderTime}ms\n`);

  // Salva il risultato
  const outputPath = join(__dirname, 'output.html');
  writeFileSync(outputPath, result, 'utf8');
  console.log(`💾 Output saved to: ${outputPath}`);

  // Validazione HTML con Prettier
  console.log('\n🔧 Validating HTML with Prettier...');
  try {
    execSync(`npx prettier --check "${outputPath}"`, {
      cwd: join(__dirname, '../..'),
      stdio: 'pipe',
    });
    console.log('✅ HTML is properly formatted');
  } catch (_prettierError) {
    console.log('⚠️  HTML formatting issues detected, attempting to fix...');
    try {
      execSync(`npx prettier --write "${outputPath}"`, {
        cwd: join(__dirname, '../..'),
        stdio: 'pipe',
      });
      console.log('✅ HTML has been formatted with Prettier');
  } catch (_fixError) {
      console.error('❌ Prettier could not format the HTML file');
      console.error('   This indicates serious HTML structure issues');
      throw new Error('HTML formatting validation failed');
    }
  }

  // Validazione struttura HTML
  console.log('\n🔍 Validating HTML structure...');
  const htmlValidation = validateHTMLStructure(result);
  if (htmlValidation.isValid) {
    console.log('✅ HTML structure is valid');
  } else {
    console.error('❌ HTML structure issues found:');
    htmlValidation.errors.forEach((error) => {
      console.error(`   - ${error}`);
    });
    throw new Error('HTML structure validation failed');
  }

  // Statistiche del risultato
  const lines = result.split('\n').length;
  const chars = result.length;
  const words = result.split(/\s+/).length;

  console.log('\n📊 Generation Statistics:');
  console.log(`   - Output size: ${chars} characters`);
  console.log(`   - Lines: ${lines}`);
  console.log(`   - Words: ${words}`);
  console.log(`   - Render time: ${renderTime}ms`);

  // Verifica che tutte le funzionalità siano state processate
  console.log('\n🔍 Feature Verification:');

  const checks = [
    { name: 'Template inheritance (extends)', test: () => result.includes('<!DOCTYPE html>') },
    { name: 'Block replacement', test: () => result.includes('Template Engine Complete Demo') },
    { name: 'Variable interpolation', test: () => result.includes(testData.site.name) },
    { name: 'Conditional statements', test: () => result.includes('Welcome back, John') },
    { name: 'For loops', test: () => result.includes('Getting Started with Template Engine') },
    { name: 'Include directives', test: () => result.includes('user-card') },
    { name: 'Filter functions', test: () => result.includes('DEVELOPMENT') }, // environment | upper
    { name: 'Switch statements', test: () => result.includes('User is active') },
    { name: 'Mathematical expressions', test: () => result.includes('2 + 3 = 5') },
    { name: 'Nested object access', test: () => result.includes('Tech Innovations Inc.') },
    { name: 'Dynamic attributes', test: () => result.includes('data-category=') },
  ];

  let passedChecks = 0;
  for (const check of checks) {
    const passed = check.test();
    console.log(`   ${passed ? '✅' : '❌'} ${check.name}`);
    if (passed) passedChecks++;
  }

  console.log(`\n🎯 Test Results: ${passedChecks}/${checks.length} features verified`);

  if (passedChecks === checks.length) {
    console.log('🎉 All features working correctly!');
    process.exit(0);
  } else {
    console.log('⚠️  Some features may need attention');
    process.exit(1);
  }
} catch (error) {
  console.error('❌ Test failed:', error.message);
  console.error(error.stack);
  process.exit(1);
}
