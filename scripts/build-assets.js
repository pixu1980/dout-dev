#!/usr/bin/env node

/**
 * Build Assets Script - Processes and optimizes static assets
 * Handles favicon generation, image optimization, and asset copying
 */

import { readFile, writeFile, mkdir, copyFile, readdir, stat, unlink } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join, extname, basename } from 'node:path';
import { existsSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');
const srcDir = join(projectRoot, 'src');
const distDir = join(projectRoot, 'dist');

async function ensureDir(dir) {
  try {
    await mkdir(dir, { recursive: true });
  } catch (error) {
    if (error.code !== 'EEXIST') throw error;
  }
}

// Helpers for favicon processing moved to module-level to reduce nested complexity
async function readMarkupsFromFile(faviconDataPath) {
  const raw = await readFile(faviconDataPath, 'utf-8');
  const data = JSON.parse(raw);
  return Array.isArray(data.markups) ? data.markups : [];
}

function extractAssetPathsFromMarkups(markups) {
  const re = /href="([^"]+)"|src="([^"]+)"/g;
  const paths = new Set();
  for (const markup of markups) {
    let m;
    while ((m = re.exec(markup)) !== null) {
      const candidate = m[1] || m[2];
      if (!candidate) continue;
      if (candidate.startsWith('http://') || candidate.startsWith('https://')) continue;
      paths.add(candidate.replace(/^\//, ''));
    }
  }
  return Array.from(paths);
}

async function copyIfExistsAndReport(projectRoot, distDir, relPath) {
  // Prefer files placed in src/assets per project convention
  const srcAssetsPath = join(srcDir, 'assets', basename(relPath));
  const destAssetsDir = join(distDir, 'assets');
  const destPath = join(destAssetsDir, basename(relPath));

  if (existsSync(srcAssetsPath)) {
    // ensure dist/assets exists and copy there as well
    await ensureDir(destAssetsDir);
    await copyFile(srcAssetsPath, destPath);
    return { path: relPath, copied: true };
  }

  // Fallback: check project root (legacy layout)
  const srcPath = join(projectRoot, relPath);
  if (existsSync(srcPath)) {
    await ensureDir(destAssetsDir);
    await copyFile(srcPath, destPath);
    return { path: relPath, copied: true };
  }

  return { path: relPath, copied: false };
}

// Generate simple placeholder assets for missing favicons so dist contains files
async function generatePlaceholder(distDir, relPath) {
  const ext = extname(relPath).toLowerCase();
  // Write placeholder into src/assets so it will be part of the normal assets copy
  const placeholderSrcDir = join(srcDir, 'assets');
  const destAssetsDir = join(distDir, 'assets');
  const srcDestPath = join(placeholderSrcDir, basename(relPath));
  const distDestPath = join(destAssetsDir, basename(relPath));
  // 1x1 transparent PNG base64
  const pngBase64 =
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=';
  try {
    await ensureDir(placeholderSrcDir);
    await ensureDir(destAssetsDir);
    if (ext === '.svg') {
      const svg =
        '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48"><rect width="100%" height="100%" fill="#ddd"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-size="10" fill="#444">favicon</text></svg>';
      await writeFile(srcDestPath, svg, 'utf8');
      await writeFile(distDestPath, svg, 'utf8');
    } else if (ext === '.png' || ext === '.ico') {
      const buf = Buffer.from(pngBase64, 'base64');
      await writeFile(srcDestPath, buf);
      await writeFile(distDestPath, buf);
    } else if (ext === '.webmanifest' || ext === '.json') {
      const manifest = {
        name: 'dout.dev (placeholder)',
        short_name: 'dout',
        start_url: '/',
        icons: [],
      };
      await writeFile(srcDestPath, JSON.stringify(manifest, null, 2), 'utf8');
      await writeFile(distDestPath, JSON.stringify(manifest, null, 2), 'utf8');
    } else {
      await writeFile(srcDestPath, 'placeholder', 'utf8');
      await writeFile(distDestPath, 'placeholder', 'utf8');
    }
    console.log('  Created placeholder for:', relPath);
    return true;
  } catch (err) {
    console.warn('  Failed to create placeholder for', relPath, err.message);
    return false;
  }
}

async function copyAssets() {
  console.log('📁 Copying static assets...');

  const assetsDir = join(srcDir, 'assets');
  const distAssetsDir = join(distDir, 'assets');

  if (!existsSync(assetsDir)) {
    console.log('⚠️  No assets directory found, skipping...');
    return;
  }

  await ensureDir(distAssetsDir);
  await copyDirectoryRecursive(assetsDir, distAssetsDir);
  console.log('✅ Static assets copied');
}

async function copyDirectoryRecursive(src, dest) {
  await ensureDir(dest);

  const entries = await readdir(src);

  for (const entry of entries) {
    const srcPath = join(src, entry);
    const destPath = join(dest, entry);

    const stats = await stat(srcPath);

    if (stats.isDirectory()) {
      await copyDirectoryRecursive(srcPath, destPath);
    } else {
      await copyFile(srcPath, destPath);
    }
  }
}

async function processFavicons() {
  console.log('🌟 Processing favicons...');

  const faviconConfigPath = join(projectRoot, 'favicon.config.json');
  const faviconDataPath = join(projectRoot, 'favicon.data.json');

  if (!existsSync(faviconConfigPath) || !existsSync(faviconDataPath)) {
    console.log('⚠️  Favicon config not found, skipping...');
    return;
  }

  try {
    const missing = await findMissingFaviconAssets(faviconDataPath);
    if (missing.length > 0) {
      await handleMissingFavicons(missing, faviconConfigPath);
    }
    console.log('✅ Favicons processed');
  } catch (error) {
    console.warn('⚠️  Favicon processing failed:', error.message);
    throw error; // fail the build_assets step
  }
}

async function findMissingFaviconAssets(faviconDataPath) {
  const markups = await readMarkupsFromFile(faviconDataPath);
  const assetPaths = extractAssetPathsFromMarkups(markups);
  const results = await Promise.all(
    assetPaths.map((p) => copyIfExistsAndReport(projectRoot, distDir, p))
  );
  return results.filter((r) => !r.copied).map((r) => r.path);
}

async function handleMissingFavicons(missing, faviconConfigPath) {
  console.error('❌ Missing favicon assets referenced in favicon.data.json:');
  for (const m of missing) console.error('  -', m);

  let generated = [];
  const outDir = join(srcDir, 'assets');
  const logoSrc = join(projectRoot, 'design', 'icons', 'logo.svg');

  if (existsSync(logoSrc)) {
    const logoDest = join(srcDir, 'assets', 'logo.svg');
    await ensureDir(join(srcDir, 'assets'));
    await copyFile(logoSrc, logoDest);
    console.log('✅ Copied logo to src/assets/logo.svg');
  }

  const logoDest = join(srcDir, 'assets', 'logo.svg');
  let config = {};
  try {
    const rawCfg = await readFile(faviconConfigPath, 'utf8');
    config = JSON.parse(rawCfg);
  } catch {}

  const iconsPath = config.path || '/';
  const appName = config.icon?.webAppManifest?.name || 'dout.dev';
  const themeColor = config.icon?.webAppManifest?.themeColor || '#ffffff';

  const desc = {
    masterPicture: existsSync(logoDest) ? logoDest : join(projectRoot, 'design', 'icons', 'logo.svg'),
    iconsPath,
    design: {
      ios: { pictureAspect: 'noChange' },
      windows: { pictureAspect: 'noChange', backgroundColor: themeColor },
      androidChrome: {
        pictureAspect: 'noChange',
        manifest: { name: appName, display: 'standalone', orientation: 'notSet' },
      },
      safariPinnedTab: { pictureAspect: 'silhouette', themeColor },
    },
    settings: { scalingAlgorithm: 'Mitchell', errorOnImageTooSmall: false },
  };

  const generatedFromCli = await generateFaviconsWithCli(desc, outDir);
  if (generatedFromCli) {
    const recheck = await Promise.all(
      missing.map((p) => copyIfExistsAndReport(projectRoot, distDir, p))
    );
    generated = recheck.filter((r) => r.copied).map((r) => r.path);
  }

  const stillMissing = missing.filter((m) => !generated.includes(m));
  if (stillMissing.length > 0) {
    for (const m of stillMissing) await generatePlaceholder(distDir, m);

    const strict = !(process.env.FAVICON_STRICT === '0' || process.env.FAVICON_STRICT === 'false');
    if (strict) throw new Error(`Missing favicon assets: ${stillMissing.join(', ')}`);
    console.warn('⚠️ Favicon strict mode disabled via FAVICON_STRICT; continuing despite missing assets.');
  }
}

async function generateFaviconsWithCli(desc, outDir) {
  try {
    await ensureDir(outDir);
    const tmpDescPath = join(outDir, 'faviconDescription.json');

    // If masterPicture is an absolute path under projectRoot, convert to src/assets/<basename>
    if (desc.masterPicture?.startsWith(projectRoot)) {
      desc.masterPicture = join('src', 'assets', basename(desc.masterPicture));
    }

    await writeFile(tmpDescPath, JSON.stringify(desc, null, 2), 'utf8');

    const args = [
      'real-favicon',
      'generate',
      tmpDescPath,
      join(outDir, 'faviconData.json'),
      outDir,
    ];
    console.log('🔁 Attempting to generate favicons using cli-real-favicon...');

    await new Promise((resolve, reject) => {
      const p = spawn('npx', args, { stdio: 'inherit', shell: true, cwd: outDir });
      p.on('close', (code) =>
        code === 0 ? resolve() : reject(new Error(`cli-real-favicon failed with code ${code}`))
      );
      p.on('error', (err) => reject(err));
    });

    console.log('✅ cli-real-favicon completed');

    // clean up tmp file
    try {
      await unlink(tmpDescPath);
    } catch {}
    return true;
  } catch (err) {
    console.warn('⚠️ cli-real-favicon generation failed:', err.message);
    return false;
  }
}

async function generateManifest() {
  console.log('📱 Generating web manifest...');

  const manifest = {
    name: 'dout.dev',
    short_name: 'dout.dev',
    description: 'The DoUtDev Blog - Development insights and tutorials',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#3b82f6',
    orientation: 'portrait-primary',
    icons: [
      {
        src: '/android-chrome-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/android-chrome-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };

  await writeFile(join(distDir, 'manifest.json'), JSON.stringify(manifest, null, 2));

  console.log('✅ Web manifest generated');
}

async function generateRobotsTxt() {
  console.log('🤖 Generating robots.txt...');

  const robots = `User-agent: *
Allow: /

Sitemap: https://dout.dev/sitemap.xml
`;

  await writeFile(join(distDir, 'robots.txt'), robots);
  console.log('✅ robots.txt generated');
}

async function buildAssets() {
  console.log('🏗️  Building assets...\n');

  try {
    await ensureDir(distDir);
    // Ensure favicons exist in src/assets (create placeholders if necessary) before copying
    await processFavicons();
    await copyAssets();
    await generateManifest();
    await generateRobotsTxt();

    console.log('\n✅ Assets build completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Assets build failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  buildAssets().catch((error) => {
    console.error('❌ Build assets script failed:', error);
    process.exit(1);
  });
}

export { buildAssets };
