import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  // Entry point
  root: 'src',

  // Build output
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'src/index.html'),
        // Add other HTML pages as needed
        '404': resolve(__dirname, 'src/404.html'),
        about: resolve(__dirname, 'src/about.html'),
        playground: resolve(__dirname, 'src/playground.html'),
        search: resolve(__dirname, 'src/search.html'),
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

  // Public base path for GitHub Pages
  base: process.env.NODE_ENV === 'production' ? 'https://dout.dev' : '/',
});
