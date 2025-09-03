#!/usr/bin/env node

/**
 * Link Validator - Validates internal links and references
 */

import { readFile, readdir, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative } from 'node:path';
import { existsSync } from 'node:fs';
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
  } catch {
    // Ignore directories that can't be read
  }

  return files;
}

function isExternalLink(href) {
  return (
    href.startsWith('http://') ||
    href.startsWith('https://') ||
    href.startsWith('//') ||
    href.startsWith('mailto:') ||
    href.startsWith('tel:')
  );
}

function resolveInternalLink(href, basePath, srcDir) {
  // Remove hash fragments and query strings
  const cleanHref = href.split('#')[0].split('?')[0];
  if (!cleanHref) return null; // Only hash fragment

  // Handle absolute paths
  if (cleanHref.startsWith('/')) {
    return join(srcDir, cleanHref.slice(1));
  }

  // Handle relative paths
  return join(dirname(basePath), cleanHref);
}

function targetExistsAt(path) {
  if (existsSync(path)) return true;
  if (path.endsWith('/')) {
  const htmlPath = `${path.slice(0, -1)}.html`;
    if (existsSync(htmlPath)) return true;
  const indexHtml = `${path}index.html`;
    if (existsSync(indexHtml)) return true;
  } else if (!path.endsWith('.html')) {
  const htmlPath = `${path}.html`;
    if (existsSync(htmlPath)) return true;
  }
  return false;
}

function checkLinks(document, filePath, srcDir) {
  const errors = [];
  const links = document.querySelectorAll('a[href]');

  links.forEach((link, index) => {
    const href = link.getAttribute('href');
    if (!href) return;
    if (isExternalLink(href)) return;
    if (
      href.includes(':') &&
      !href.startsWith('/') &&
      !href.startsWith('./') &&
      !href.startsWith('../')
    )
      return;
    const targetPath = resolveInternalLink(href, filePath, srcDir);
    if (!targetPath) return;
    if (!targetExistsAt(targetPath)) {
      errors.push(
        `Link ${index + 1}: broken internal link "${href}" -> ${relative(projectRoot, targetPath)}`
      );
    }
  });
  return errors;
}

function checkImages(document, filePath, srcDir) {
  const errors = [];
  const images = document.querySelectorAll('img[src]');
  images.forEach((img, index) => {
    const src = img.getAttribute('src');
    if (!src || isExternalLink(src)) return;
    const targetPath = resolveInternalLink(src, filePath, srcDir);
    if (!targetPath) return;
    if (!existsSync(targetPath)) {
      errors.push(
        `Image ${index + 1}: missing image file "${src}" -> ${relative(projectRoot, targetPath)}`
      );
    }
  });
  return errors;
}

function checkStylesheets(document, filePath, srcDir) {
  const errors = [];
  const stylesheets = document.querySelectorAll('link[rel="stylesheet"][href]');
  stylesheets.forEach((link, index) => {
    const href = link.getAttribute('href');
    if (!href || isExternalLink(href)) return;
    const targetPath = resolveInternalLink(href, filePath, srcDir);
    if (!targetPath) return;
    if (!existsSync(targetPath)) {
      errors.push(
        `Stylesheet ${index + 1}: missing CSS file "${href}" -> ${relative(projectRoot, targetPath)}`
      );
    }
  });
  return errors;
}

function checkScripts(document, filePath, srcDir) {
  const errors = [];
  const scripts = document.querySelectorAll('script[src]');
  scripts.forEach((script, index) => {
    const src = script.getAttribute('src');
    if (!src || isExternalLink(src)) return;
    const targetPath = resolveInternalLink(src, filePath, srcDir);
    if (!targetPath) return;
    if (!existsSync(targetPath)) {
      errors.push(
        `Script ${index + 1}: missing JS file "${src}" -> ${relative(projectRoot, targetPath)}`
      );
    }
  });
  return errors;
}

async function validateLinksInFile(filePath) {
  try {
    const content = await readFile(filePath, 'utf-8');
    const dom = new JSDOM(content);
    const document = dom.window.document;

    const errors = [];
    const warnings = [];

    const srcDir = join(projectRoot, 'src');

    // Check all links
    errors.push(...checkLinks(document, filePath, srcDir));

    // Check image sources
    errors.push(...checkImages(document, filePath, srcDir));

    // Check CSS links
    errors.push(...checkStylesheets(document, filePath, srcDir));

    // Check script sources
    errors.push(...checkScripts(document, filePath, srcDir));

    // Check for orphaned files (files not linked to)
    // const relativePath = relative(srcDir, filePath);
    // const fileName = relativePath.replace(/\\/g, '/');

    return { errors, warnings };
  } catch (error) {
    return { errors: [`Parse error: ${error.message}`], warnings: [] };
  }
}

async function validateLinks() {
  console.log('🔗 Validating links and references...\n');

  try {
    const htmlFiles = await findHTMLFiles(join(projectRoot, 'src'));

    if (htmlFiles.length === 0) {
      console.log('⚠️  No HTML files found to validate');
      return;
    }

    console.log(`📄 Checking ${htmlFiles.length} HTML files for broken links`);

    let hasErrors = false;
    let totalWarnings = 0;

    for (const file of htmlFiles) {
      const relativePath = relative(projectRoot, file);
      const { errors, warnings } = await validateLinksInFile(file, htmlFiles);

      if (errors.length > 0 || warnings.length > 0) {
        console.log(`\n📄 ${relativePath}:`);

        if (errors.length > 0) {
          console.log('  ❌ Broken links:');
          errors.forEach((error) => {
            console.log(`     • ${error}`);
          });
          hasErrors = true;
        }

        if (warnings.length > 0) {
          console.log('  ⚠️  Warnings:');
          warnings.forEach((warning) => {
            console.log(`     • ${warning}`);
          });
          totalWarnings += warnings.length;
        }
      } else {
        console.log(`✅ ${relativePath}`);
      }
    }

    console.log('\n📊 Summary:');
    console.log(`   Files checked: ${htmlFiles.length}`);
    console.log(`   Warnings: ${totalWarnings}`);

    if (hasErrors) {
      console.log('\n❌ Link validation failed - broken links found');
      return { success: false, filesChecked: htmlFiles.length, warnings: totalWarnings };
    }

    console.log('\n✅ No broken internal links found');
    if (totalWarnings > 0) {
      console.log('💡 Consider addressing warnings');
    }
    return { success: true, filesChecked: htmlFiles.length, warnings: totalWarnings };
  } catch (error) {
    console.error('❌ Link validation failed:', error);
    return { success: false, error };
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  validateLinks()
    .then((result) => {
      process.exit(result?.success ? 0 : 1);
    })
    .catch((error) => {
      console.error('❌ Link validation script failed:', error);
      process.exit(1);
    });
}

export { validateLinks };
