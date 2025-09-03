import { defineConfig } from 'vite';
import { resolve } from 'node:path';
import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

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

export default defineConfig({
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

  // Public base path for GitHub Pages — use local '/' by default to keep asset paths relative
  base: process.env.NODE_ENV === 'production' ? '/' : '/',
});
