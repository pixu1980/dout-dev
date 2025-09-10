import { defineConfig } from 'vite';
import { dirname, join, resolve } from 'node:path';
import { readFileSync, readdirSync, statSync } from 'node:fs';

// Function to recursively find all HTML files
function findHtmlFiles(dir, basePath = '') {
  const files = {};

  try {
    const items = readdirSync(dir);

    for (const item of items) {
      const fullPath = join(dir, item);
      const stat = statSync(fullPath);

      if (stat.isDirectory()) {
        // Recursively search subdirectories
        Object.assign(files, findHtmlFiles(fullPath, basePath ? `${basePath}/${item}` : item));
      } else if (item.endsWith('.html')) {
        // Create a unique key for the HTML file
        const key = basePath
          ? `${basePath}/${item.replace('.html', '')}`
          : item.replace('.html', '');
        files[key] = resolve(fullPath);
      }
    }
  } catch (error) {
    // Directory doesn't exist yet or other error, ignore
    console.warn(`Warning: Could not read directory ${dir}:`, error.message);
  }

  return files;
}

function bundleTextPlugin() {
  const prefix = 'bundle-text:';
  const virtualPrefix = '\0bundle-text:';

  return {
    name: 'bundle-text',
    enforce: 'pre',
    resolveId(source, importer) {
      if (!source.startsWith(prefix)) return null;

      const target = source.slice(prefix.length);
      const resolvedPath = importer
        ? resolve(dirname(importer), target)
        : resolve(__dirname, target);

      return `${virtualPrefix}${Buffer.from(resolvedPath).toString('base64')}`;
    },
    load(id) {
      if (!id.startsWith(virtualPrefix)) return null;

      const filePath = Buffer.from(id.slice(virtualPrefix.length), 'base64').toString('utf8');
      return `export default ${JSON.stringify(readFileSync(filePath, 'utf8'))};`;
    },
  };
}

export default defineConfig(({ command }) => ({
  plugins: [bundleTextPlugin()],
  // Entry point
  root: 'src',

  // Build output
  build: {
    outDir: '../dist',
    manifest: true,
    emptyOutDir: true,
    rollupOptions: {
      input: {
        // Static pages
        main: resolve(__dirname, 'src/index.html'),
        404: resolve(__dirname, 'src/404.html'),
        about: resolve(__dirname, 'src/about.html'),
        archive: resolve(__dirname, 'src/archive.html'),
        accessibility: resolve(__dirname, 'src/accessibility.html'),
        demo: resolve(__dirname, 'src/demo/index.html'),
        privacy: resolve(__dirname, 'src/privacy.html'),
        offline: resolve(__dirname, 'src/offline.html'),
        playground: resolve(__dirname, 'src/playground.html'),
        search: resolve(__dirname, 'src/search.html'),
        // Dynamically include all CMS-generated HTML files
        ...findHtmlFiles(resolve(__dirname, 'src/posts'), 'posts'),
        ...findHtmlFiles(resolve(__dirname, 'src/tags'), 'tags'),
        ...findHtmlFiles(resolve(__dirname, 'src/months'), 'months'),
        ...findHtmlFiles(resolve(__dirname, 'src/series'), 'series'),
      },
    },
  },

  // Development server
  server: {
    port: 3000,
    open: true,
  },

  // Asset handling
  assetsInclude: ['**/*.md'],

  // CSS handling
  css: {
    postcss: {
      plugins: [
        // You can add PostCSS plugins here if needed
      ],
    },
  },

  // Use relative asset URLs in production so the dist artifact does not assume a fixed server root.
  base: command === 'build' ? './' : '/',
}));
