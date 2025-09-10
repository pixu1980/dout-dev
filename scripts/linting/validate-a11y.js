#!/usr/bin/env node

/**
 * Accessibility Validator - Validates HTML for accessibility issues
 */

import { readFile, readdir, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve, relative } from 'node:path';
import { JSDOM } from 'jsdom';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..', '..');

function resolveTargetDir(arg) {
  if (arg) {
    return resolve(projectRoot, arg);
  }

  return join(projectRoot, 'src');
}

async function findHTMLFiles(dir) {
  const files = [];

  try {
    const entries = await readdir(dir);

    for (const entry of entries) {
      const fullPath = join(dir, entry);
      const stats = await stat(fullPath);

      if (stats.isDirectory() && !entry.startsWith('.') && entry !== 'node_modules') {
        // Skip components/templates/layouts directories - fragments, not full pages
        if (entry !== 'components' && entry !== 'templates' && entry !== 'layouts') {
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

async function validateA11yFile(filePath) {
  try {
    const content = await readFile(filePath, 'utf-8');
    const dom = new JSDOM(content);
    const document = dom.window.document;

    const errors = [];
    const warnings = [];

    // Detect template-engine source files (partials extending a base layout)
    const isTemplateSource = /<\s*(extends|block|include|if|for|switch|raw)\b/i.test(content);

    // Document-level checks (only for full HTML documents)
    if (!isTemplateSource) {
      // Check for lang attribute
      const html = document.querySelector('html');
      if (!html?.getAttribute('lang')) {
        errors.push('Missing or empty lang attribute on <html> element');
      }

      // Check for skip links
      const skipLink = document.querySelector(
        'a[href="#main"], a[href="#content"], a[href="#main-content"]'
      );
      if (!skipLink) {
        warnings.push('Consider adding a skip link for keyboard navigation');
      }

      const announcer = document.getElementById('page-announcer');
      if (!announcer || announcer.getAttribute('aria-live') !== 'polite') {
        warnings.push('Consider adding a polite live region for enhanced navigation updates');
      }
    }

    // Check images for alt text
    const images = document.querySelectorAll('img');
    images.forEach((img, index) => {
      if (!img.hasAttribute('alt')) {
        errors.push(`Image ${index + 1} missing alt attribute`);
      } else if (img.getAttribute('alt') === '' && !img.hasAttribute('role')) {
        // Empty alt is okay for decorative images, but should be intentional
        warnings.push(`Image ${index + 1} has empty alt text - ensure it's decorative`);
      }
    });

    // Check form inputs for labels
    const inputs = document.querySelectorAll('input, textarea, select');
    inputs.forEach((input, index) => {
      const id = input.getAttribute('id');
      const ariaLabel = input.getAttribute('aria-label');
      const ariaLabelledby = input.getAttribute('aria-labelledby');

      if (id) {
        const label = document.querySelector(`label[for="${id}"]`);
        if (!label && !ariaLabel && !ariaLabelledby) {
          errors.push(`Form input ${index + 1} missing associated label`);
        }
      } else if (!ariaLabel && !ariaLabelledby) {
        errors.push(`Form input ${index + 1} missing id and label association`);
      }
    });

    // Check buttons for accessible text
    const buttons = document.querySelectorAll('button');
    buttons.forEach((button, index) => {
      const text = button.textContent.trim();
      const ariaLabel = button.getAttribute('aria-label');
      const ariaLabelledby = button.getAttribute('aria-labelledby');

      if (!text && !ariaLabel && !ariaLabelledby) {
        errors.push(`Button ${index + 1} has no accessible text`);
      }
    });

    // Check links for accessible text
    const links = document.querySelectorAll('a');
    links.forEach((link, index) => {
      const text = link.textContent.trim();
      const ariaLabel = link.getAttribute('aria-label');
      const img = link.querySelector('img[alt]');

      if (!text && !ariaLabel && !img) {
        errors.push(`Link ${index + 1} has no accessible text`);
      }

      // Check for generic link text
      if (text.toLowerCase().match(/^(click here|read more|more|link)$/)) {
        warnings.push(`Link ${index + 1} has generic text: "${text}"`);
      }
    });

    // Check headings for proper hierarchy
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    let previousLevel = 0;
    let hasH1 = false;

    headings.forEach((heading, index) => {
      const level = parseInt(heading.tagName.charAt(1), 10);

      if (level === 1) {
        if (hasH1) {
          warnings.push(`Multiple H1 elements found (heading ${index + 1})`);
        }
        hasH1 = true;
      }

      if (previousLevel > 0 && level > previousLevel + 1) {
        warnings.push(
          `Heading hierarchy skip: H${previousLevel} to H${level} (heading ${index + 1})`
        );
      }

      previousLevel = level;
    });

    if (!hasH1 && !isTemplateSource) {
      warnings.push('Page should have exactly one H1 element');
    }

    // Check for ARIA landmarks
    if (!isTemplateSource) {
      const main = document.querySelector('main, [role="main"]');
      if (!main) {
        warnings.push('Consider adding a main landmark');
      } else {
        if (main.getAttribute('id') !== 'main') {
          warnings.push(
            'Main landmark should expose id="main" for skip links and focus restoration'
          );
        }

        if (main.getAttribute('tabindex') !== '-1') {
          warnings.push('Main landmark should be programmatically focusable with tabindex="-1"');
        }
      }

      const nav = document.querySelector('nav, [role="navigation"]');
      if (!nav) {
        warnings.push('Consider adding navigation landmarks');
      }
    }

    const searchSummary = document.getElementById('results-summary');
    if (searchSummary && searchSummary.getAttribute('aria-live') !== 'polite') {
      errors.push('Search results summary should use aria-live="polite"');
    }

    document.querySelectorAll('nav.pagination, #search-pagination').forEach((pagination, index) => {
      if (!pagination.getAttribute('aria-label')) {
        warnings.push(`Pagination ${index + 1} should have an accessible label`);
      }

      pagination.querySelectorAll('a').forEach((link, linkIndex) => {
        if (!link.getAttribute('aria-label') && !link.textContent.trim()) {
          errors.push(
            `Pagination link ${linkIndex + 1} in pagination ${index + 1} needs accessible text`
          );
        }
      });
    });

    // Check color contrast (basic check for inline styles)
    const elementsWithStyle = document.querySelectorAll('[style]');
    elementsWithStyle.forEach((element, index) => {
      const style = element.getAttribute('style');
      if (style.includes('color:') && !style.includes('background')) {
        warnings.push(`Element ${index + 1} has color styling without background - check contrast`);
      }
    });

    return { errors, warnings };
  } catch (error) {
    return { errors: [`Parse error: ${error.message}`], warnings: [] };
  }
}

async function validateA11y(targetDir = resolveTargetDir(process.argv[2])) {
  console.log('♿ Validating accessibility...\n');

  try {
    const htmlFiles = await findHTMLFiles(targetDir);

    if (htmlFiles.length === 0) {
      console.log('⚠️  No HTML files found to validate');
      return { success: true, message: 'No HTML files found' };
    }

    console.log(`📄 Checking ${htmlFiles.length} HTML files for accessibility`);

    let hasErrors = false;
    let totalWarnings = 0;

    for (const file of htmlFiles) {
      const relativePath = `./${relative(projectRoot, file)}`;
      const { errors, warnings } = await validateA11yFile(file);

      if (errors.length > 0 || warnings.length > 0) {
        console.log(`\n📄 ${relativePath}:`);

        if (errors.length > 0) {
          console.log('  ❌ Errors:');
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
      console.log('\n❌ Accessibility validation failed - critical issues found');
      return {
        success: false,
        message: 'Critical accessibility issues found',
        errors: hasErrors,
        warnings: totalWarnings,
      };
    } else {
      console.log('\n✅ No critical accessibility issues found');
      if (totalWarnings > 0) {
        console.log('💡 Consider addressing warnings to improve accessibility');
      }
      return {
        success: true,
        message: 'No critical accessibility issues found',
        errors: 0,
        warnings: totalWarnings,
      };
    }
  } catch (error) {
    console.error('❌ Accessibility validation failed:', error);
    return { success: false, message: 'Accessibility validation failed', error };
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  validateA11y()
    .then((result) => {
      process.exit(result.success ? 0 : 1);
    })
    .catch((error) => {
      console.error('❌ A11y validation script failed:', error);
      process.exit(1);
    });
}

export { validateA11y };
