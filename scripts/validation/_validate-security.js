#!/usr/bin/env node

import { existsSync } from 'node:fs';
import { readFile, readdir, stat } from 'node:fs/promises';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..', '..');
const ALLOWED_SCRIPT_ORIGINS = new Set(['https://dout.dev', 'https://giscus.app']);
const ALLOWED_IFRAME_HOSTS = new Set(['codepen.io', 'giscus.app']);

function resolveTargetDir(arg) {
  if (arg) {
    return resolve(projectRoot, arg);
  }

  const distDir = join(projectRoot, 'dist');
  return existsSync(distDir) ? distDir : join(projectRoot, 'src');
}

function isAllowedInlineScript(script) {
  const content = script.textContent?.trim() || '';
  return (
    content.includes("location.protocol === 'file:'") &&
    content.includes("document.documentElement.dataset.previewMode = 'file'")
  );
}

async function findHTMLFiles(dir) {
  const files = [];

  try {
    const entries = await readdir(dir);

    for (const entry of entries) {
      const fullPath = join(dir, entry);
      const stats = await stat(fullPath);

      if (stats.isDirectory() && !entry.startsWith('.') && entry !== 'node_modules') {
        files.push(...(await findHTMLFiles(fullPath)));
      } else if (stats.isFile() && entry.endsWith('.html')) {
        files.push(fullPath);
      }
    }
  } catch {}

  return files;
}

async function validateSecurityFile(filePath) {
  const content = await readFile(filePath, 'utf8');
  const dom = new JSDOM(content);
  const { document } = dom.window;
  const errors = [];
  const warnings = [];

  const isTemplateSource = /<\s*(extends|block|include|if|for|switch|raw)\b/i.test(content);
  if (!isTemplateSource) {
    const csp = document
      .querySelector('meta[http-equiv="Content-Security-Policy"]')
      ?.getAttribute('content');
    if (!csp) {
      errors.push('Missing Content-Security-Policy meta tag');
    } else {
      ['default-src', 'object-src', 'script-src'].forEach((directive) => {
        if (!csp.includes(directive)) {
          errors.push(`CSP is missing ${directive}`);
        }
      });

      if (csp.includes('frame-ancestors')) {
        warnings.push(
          'frame-ancestors in a CSP meta tag is ignored by browsers; enforce it via headers'
        );
      }

      if (csp.includes('upgrade-insecure-requests')) {
        warnings.push(
          'upgrade-insecure-requests in a CSP meta tag can break local HTTP preview, especially in Safari'
        );
      }
    }

    const referrerPolicy = document.querySelector('meta[name="referrer"]')?.getAttribute('content');
    if (referrerPolicy !== 'strict-origin-when-cross-origin') {
      errors.push('Referrer policy should be strict-origin-when-cross-origin');
    }
  }

  if (/\son[a-z]+\s*=/i.test(content)) {
    errors.push('Inline event handlers are not allowed in built HTML');
  }

  if (/(href|src)\s*=\s*["'][^"']*javascript:/i.test(content)) {
    errors.push('javascript: URLs are not allowed in built HTML');
  }

  document.querySelectorAll('script').forEach((script, index) => {
    const src = script.getAttribute('src');
    const type = script.getAttribute('type') || '';

    if (!src && type !== 'application/ld+json') {
      if (isAllowedInlineScript(script)) {
        return;
      }
      errors.push(`Inline script ${index + 1} is not allowed unless it is JSON-LD`);
      return;
    }

    if (!src) return;

    try {
      const url = new URL(src, 'https://dout.dev');
      if (url.origin !== 'https://dout.dev' && !ALLOWED_SCRIPT_ORIGINS.has(url.origin)) {
        errors.push(`Script ${index + 1} loads from an unapproved origin: ${url.origin}`);
      }
    } catch {
      errors.push(`Script ${index + 1} has an invalid source URL`);
    }
  });

  document.querySelectorAll('iframe[src]').forEach((iframe, index) => {
    try {
      const url = new URL(iframe.getAttribute('src'), 'https://dout.dev');
      if (!ALLOWED_IFRAME_HOSTS.has(url.hostname)) {
        errors.push(`Iframe ${index + 1} uses an unapproved host: ${url.hostname}`);
      }
    } catch {
      errors.push(`Iframe ${index + 1} has an invalid source URL`);
    }
  });

  if (!document.querySelector('meta[name="dout:analytics-dashboard"]')) {
    warnings.push('Analytics dashboard metadata is missing');
  }

  return { errors, warnings };
}

export async function validateSecurity(targetDir = resolveTargetDir(process.argv[2])) {
  console.log('🔐 Validating security policies...\n');

  const htmlFiles = await findHTMLFiles(targetDir);
  let hasErrors = false;
  let warningCount = 0;

  for (const file of htmlFiles) {
    const relativePath = `./${relative(projectRoot, file)}`;
    const { errors, warnings } = await validateSecurityFile(file);

    if (errors.length || warnings.length) {
      console.log(`\n📄 ${relativePath}:`);

      if (errors.length) {
        console.log('  ❌ Errors:');
        for (const error of errors) {
          console.log(`     • ${error}`);
        }
        hasErrors = true;
      }

      if (warnings.length) {
        console.log('  ⚠️  Warnings:');
        for (const warning of warnings) {
          console.log(`     • ${warning}`);
        }
        warningCount += warnings.length;
      }
    }
  }

  const headersPath = join(targetDir, '_headers');
  if (!existsSync(headersPath)) {
    console.log('\n❌ Missing deploy headers file: _headers');
    hasErrors = true;
  } else {
    const headers = await readFile(headersPath, 'utf8');
    ['Content-Security-Policy', 'Permissions-Policy', 'Referrer-Policy'].forEach((header) => {
      if (!headers.includes(header)) {
        console.log(`\n❌ _headers is missing ${header}`);
        hasErrors = true;
      }
    });
  }

  if (hasErrors) {
    console.log('\n❌ Security validation failed');
    return { success: false, warnings: warningCount };
  }

  console.log(
    `\n✅ Security validation passed (${htmlFiles.length} HTML files checked, ${warningCount} warnings)`
  );
  return { success: true, warnings: warningCount };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  validateSecurity()
    .then((result) => process.exit(result.success ? 0 : 1))
    .catch((error) => {
      console.error('❌ Security validation failed:', error);
      process.exit(1);
    });
}
