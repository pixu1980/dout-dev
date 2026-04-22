#!/usr/bin/env node

import { createReadStream, existsSync, statSync } from 'node:fs';
import { readdir, stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { dirname, extname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { resolveConfig } from '../cms/config.js';
import { inspectUrl, renderIssues } from '../og-check/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..', '..');
const MIME_TYPES = new Map([
  ['.css', 'text/css; charset=utf-8'],
  ['.gif', 'image/gif'],
  ['.html', 'text/html; charset=utf-8'],
  ['.ico', 'image/x-icon'],
  ['.jpg', 'image/jpeg'],
  ['.jpeg', 'image/jpeg'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.png', 'image/png'],
  ['.rss', 'application/rss+xml; charset=utf-8'],
  ['.svg', 'image/svg+xml'],
  ['.txt', 'text/plain; charset=utf-8'],
  ['.webmanifest', 'application/manifest+json; charset=utf-8'],
  ['.webp', 'image/webp'],
  ['.xml', 'application/xml; charset=utf-8'],
]);

function resolveTargetDir(arg) {
  if (arg) {
    return resolve(projectRoot, arg);
  }

  return join(projectRoot, 'src');
}

async function findHtmlFiles(dir) {
  const files = [];

  try {
    const entries = await readdir(dir);

    for (const entry of entries) {
      const fullPath = join(dir, entry);
      const entryStat = await stat(fullPath);

      if (entryStat.isDirectory()) {
        if (entry.startsWith('.') || entry === 'node_modules') {
          continue;
        }

        if (entry === 'templates' || entry === 'layouts' || entry === 'components') {
          continue;
        }

        files.push(...(await findHtmlFiles(fullPath)));
        continue;
      }

      if (entryStat.isFile() && entry.endsWith('.html')) {
        files.push(fullPath);
      }
    }
  } catch {}

  return files;
}

function routeFromFile(rootDir, filePath) {
  const relativePath = relative(rootDir, filePath).split('\\').join('/');

  if (relativePath === 'index.html') {
    return '/';
  }

  if (relativePath.endsWith('/index.html')) {
    return `/${relativePath.slice(0, -'index.html'.length)}`;
  }

  return `/${relativePath}`;
}

function pickContentType(filePath) {
  return MIME_TYPES.get(extname(filePath).toLowerCase()) || 'application/octet-stream';
}

function safeDecode(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function resolveFileForRequest(rootDir, urlPath) {
  const pathname = safeDecode(urlPath.split('?', 1)[0]);
  const cleaned = pathname.replace(/^\/+/, '');
  const candidates = [];

  if (!cleaned) {
    candidates.push(join(rootDir, 'index.html'));
  } else {
    candidates.push(join(rootDir, cleaned));
    candidates.push(join(rootDir, `${cleaned}.html`));
    candidates.push(join(rootDir, cleaned, 'index.html'));
  }

  for (const candidate of candidates) {
    if (existsSync(candidate) && statSync(candidate).isFile()) {
      return candidate;
    }
  }

  return null;
}

async function startStaticServer(rootDir) {
  const server = createServer((request, response) => {
    const filePath = resolveFileForRequest(rootDir, request.url || '/');

    if (!filePath) {
      response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
      response.end('Not found');
      return;
    }

    response.setHeader('content-type', pickContentType(filePath));

    if (request.method === 'HEAD') {
      response.writeHead(200);
      response.end();
      return;
    }

    createReadStream(filePath)
      .on('error', () => {
        if (!response.headersSent) {
          response.writeHead(500, { 'content-type': 'text/plain; charset=utf-8' });
        }
        response.end('Failed to read file');
      })
      .pipe(response);
  });

  await new Promise((resolvePromise, rejectPromise) => {
    server.once('error', rejectPromise);
    server.listen(0, '127.0.0.1', () => resolvePromise());
  });

  const address = server.address();
  return {
    close: () =>
      new Promise((resolvePromise, rejectPromise) => {
        server.close((error) => (error ? rejectPromise(error) : resolvePromise()));
      }),
    origin: `http://127.0.0.1:${address.port}`,
  };
}

export const __testStartStaticServer = startStaticServer;

export async function validateOpenGraph(targetDir = resolveTargetDir(process.argv[2])) {
  console.log('🌐 Validating OpenGraph and Twitter metadata through localhost...\n');

  const htmlFiles = await findHtmlFiles(targetDir);
  if (!htmlFiles.length) {
    console.log('⚠️  No HTML files found to validate');
    return { errorCount: 0, pagesChecked: 0, success: true, warningCount: 0 };
  }

  const server = await startStaticServer(targetDir);
  const siteOrigin = new URL(resolveConfig().SITE_META.url).origin;
  const urlStatusCache = new Map();
  let errorCount = 0;
  let warningCount = 0;

  try {
    for (const filePath of htmlFiles) {
      const route = routeFromFile(targetDir, filePath);
      const localUrl = new URL(route, server.origin).toString();

      try {
        const result = await inspectUrl(localUrl, {
          checkUrlStatus: true,
          outputFormat: 'none',
          rewriteOrigins: [{ from: siteOrigin, to: server.origin }],
          timeoutMs: 5000,
          urlStatusCache,
        });

        errorCount += result.validation.errors.length;
        warningCount += result.validation.warnings.length;

        if (result.validation.issues.length) {
          const relativeFile = `./${relative(projectRoot, filePath)}`;
          const issues = renderIssues(result.validation, {
            issueFormat: process.env.GITHUB_ACTIONS === 'true' ? 'ci' : 'human',
            url: `${relativeFile} (${route})`,
          });

          if (issues) {
            const stream = result.validation.errors.length > 0 ? process.stderr : process.stdout;
            stream.write(`${issues}\n`);
          }
        }
      } catch (error) {
        errorCount += 1;
        const relativeFile = `./${relative(projectRoot, filePath)}`;
        console.error(`❌ ${relativeFile} (${route}) — ${error.message}`);
      }
    }
  } finally {
    await server.close();
  }

  if (errorCount > 0) {
    console.log(
      `\n❌ OpenGraph validation failed (${htmlFiles.length} pages checked, ${errorCount} errors, ${warningCount} warnings)`
    );
    return { errorCount, pagesChecked: htmlFiles.length, success: false, warningCount };
  }

  console.log(
    `\n✅ OpenGraph validation passed (${htmlFiles.length} pages checked, ${warningCount} warnings)`
  );
  return { errorCount, pagesChecked: htmlFiles.length, success: true, warningCount };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  validateOpenGraph()
    .then((result) => process.exit(result.success ? 0 : 1))
    .catch((error) => {
      console.error('❌ OpenGraph validation failed:', error);
      process.exit(1);
    });
}
