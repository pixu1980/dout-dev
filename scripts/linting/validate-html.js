#!/usr/bin/env node

/**
 * HTML Validator - Validates HTML markup using html-validate
 */

import { readFile, readdir, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { JSDOM } from 'jsdom';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..', '..');

async function findHTMLFiles(dir) {
  const files = [];

  try {
    const entries = await readdir(dir);

    for (const entry of entries) {
      const fullPath = join(dir, entry);
      const stats = await stat(fullPath);

      if (stats.isDirectory() && !entry.startsWith('.') && entry !== 'node_modules') {
        // Skip template and component directories - they contain partial HTML files
        if (entry !== 'templates' && entry !== 'components' && entry !== 'layouts') {
          files.push(...(await findHTMLFiles(fullPath)));
        }
      } else if (stats.isFile() && entry.endsWith('.html')) {
        files.push(fullPath);
      }
    }
  } catch (_error) {
    // Ignore directories that can't be read
  }

  return files;
}

function collectStructuralErrors(content, document) {
  const errors = [];
  if (!content.trim().toLowerCase().startsWith('<!doctype html>')) {
    errors.push('Missing or invalid DOCTYPE declaration');
  }

  const html = document.querySelector('html');
  if (!html) {
    errors.push('Missing <html> element');
  } else if (!html.getAttribute('lang')) {
    errors.push('Missing lang attribute on <html> element');
  }

  const head = document.querySelector('head');
  if (!head) {
    errors.push('Missing <head> element');
  } else {
    if (!document.querySelector('meta[charset]')) {
      errors.push('Missing charset meta tag');
    }
    if (!document.querySelector('meta[name="viewport"]')) {
      errors.push('Missing viewport meta tag');
    }
    if (!document.querySelector('title')) {
      errors.push('Missing <title> element');
    }
  }

  const body = document.querySelector('body');
  if (!body) {
    errors.push('Missing <body> element');
  }
  return errors;
}

function collectContentErrors(document) {
  const errors = [];
  const images = document.querySelectorAll('img');
  images.forEach((img, index) => {
    if (!img.hasAttribute('alt')) {
      errors.push(`Image ${index + 1} missing alt attribute`);
    }
  });

  const links = document.querySelectorAll('a');
  links.forEach((link, index) => {
    if (!link.textContent.trim() && !link.querySelector('img[alt]')) {
      errors.push(`Link ${index + 1} has no accessible text`);
    }
  });
  return errors;
}

async function validateHTMLFile(filePath) {
  try {
    const content = await readFile(filePath, 'utf-8');
    const dom = new JSDOM(content);
    const document = dom.window.document;

    const errors = [];
    const isTemplateSource = /<\s*(extends|block|include|if|for|switch|raw)\b/i.test(content);

    if (!isTemplateSource) {
      errors.push(...collectStructuralErrors(content, document));
    }
    errors.push(...collectContentErrors(document));

    return errors;
  } catch (error) {
    return [`Parse error: ${error.message}`];
  }
}

async function validateHTML() {
  console.log('🔍 Validating HTML files...\n');

  const htmlFiles = await findHTMLFiles(join(projectRoot, 'src'));

  if (htmlFiles.length === 0) {
    console.log('⚠️  No HTML files found to validate');
    return [];
  }

  console.log(`📄 Validating ${htmlFiles.length} HTML files`);

  let hasErrors = false;

  for (const file of htmlFiles) {
    const relativePath = file.replace(projectRoot, '.');
    const errors = await validateHTMLFile(file);

    if (errors.length > 0) {
      console.log(`\n❌ ${relativePath}:`);
      errors.forEach((error) => {
        console.log(`   • ${error}`);
      });
      hasErrors = true;
    } else {
      console.log(`✅ ${relativePath}`);
    }
  }

  if (hasErrors) {
    console.log('\n❌ HTML validation failed');
    // Throw an object/array so tests can catch and inspect
    throw new Error('HTML validation failed');
  }

  console.log('\n✅ All HTML files are valid');
  return [];
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  validateHTML()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('❌ HTML validation script failed:', error);
      process.exit(1);
    });
}

export { validateHTML };
