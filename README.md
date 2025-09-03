# dout.dev

> dout.dev - Vanilla-first static blog with WCAG 2.2 AAA accessibility and zero runtime dependencies

## Overview

dout.dev is a modern static blog built with vanilla JavaScript, CSS, and HTML, focusing on performance, accessibility, and maintainability. The project follows a custom SSG approach with zero runtime dependencies.

## Features

- **🎯 Vanilla-first**: Zero runtime dependencies, pure JS/CSS/HTML
- **♿ Accessibility**: WCAG 2.2 AAA compliant with semantic markup
- **⚡ Performance**: Optimized for Core Web Vitals with PWA capabilities
- **🔍 SEO**: Complete meta tags, JSON-LD, OG images, RSS feeds
- **📱 Progressive**: Modern CSS with progressive enhancement
- **🎨 Design System**: Proprietary vanilla CSS system with design tokens
- **🔧 Developer Experience**: TypeScript support, live reload, comprehensive tooling

## Architecture

- **CMS**: Custom content management system for Markdown processing
- **Template Engine**: Proprietary template system with include/extend/blocks/expressions
- **Build Pipeline**: Vite-based bundling with PostCSS optimization
- **Deploy**: GitHub Pages with automated CI/CD pipeline
- **PWA**: Service Worker caching with offline support

## Quick Start

```bash
# Install dependencies
pnpm install

# Build content from Markdown
pnpm run cms:build

# Start development server
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview
```

## Project Structure

```
├── scripts/
│   ├── cms/                # Content management pipeline
│   │   ├── build.js        # Main CMS build script
│   │   ├── posts.js        # Post generation
│   │   ├── months.js       # Month archive generation
│   │   └── tags.js         # Tag page generation
│   └── template-engine/    # Custom template engine
├── data/                   # Markdown source files
│   └── posts/              # Blog posts in Markdown
├── src/                    # Generated static HTML files
│   ├── templates/          # HTML templates
│   │   ├── layouts/        # Base layouts
│   │   └── components/     # Reusable components
│   ├── styles/             # CSS with proprietary design system
│   ├── posts/              # Generated post pages
│   ├── months/             # Generated month archives
│   ├── tags/               # Generated tag pages
│   ├── sw.js               # Service Worker for PWA
│   ├── manifest.json       # Web App Manifest
│   └── performance-test.html # Performance testing suite
├── dist/                   # Final build output
└── .github/                # CI/CD workflows
```

## Content Management

The CMS system processes Markdown files with YAML front-matter:

```bash
# Build all content
pnpm run cms:build

# Watch for content changes (development)
pnpm run cms:watch

# Clean generated files
pnpm run cms:clean
```

### Writing Posts

Create Markdown files in `data/posts/` with this front-matter:

```yaml
---
title: 'Your Post Title'
date: '2025-08-15'
tags: ['javascript', 'css', 'performance']
description: 'Brief description for SEO and social sharing'
published: true
---
Your content here...
```

## Template Development

Templates use a custom syntax with powerful features:

```html
<extends src="./layouts/base.html">
  <block name="title">{{ title }} - dout.dev</block>
  <block name="content">
    <h1>{{ title | capitalize }}</h1>
    <p>{{ description | default:"No description available" }}</p>

    <if condition="tags.length > 0">
      <ul>
        <for each="tag in tags">
          <li><a href="/tags/{{ tag.key }}.html">{{ tag.label }}</a></li>
        </for>
      </ul>
    </if>
  </block>
</extends>
```

### Template Features

- **Inheritance**: `<extends>` and `<block>` for layout structure
- **Composition**: `<include>` for reusable components
- **Expressions**: `{{ variable | filter }}` with built-in filters
- **Control Flow**: `<if>`, `<for>`, `<switch>` statements
- **Security**: Expression sandboxing without `eval()`

### Authoring rules (mandatory)

- Do NOT place `<if>` elements inside an opening tag to conditionally add attributes.
  - Instead, use JavaScript expressions (ternary or logical OR) inside attribute values.
  - Examples:
    - width="{{ post.coverWidth ? post.coverWidth : '' }}"
    - height="{{ post.coverHeight || '' }}"
    - Avoid: `<img <if condition="post.coverWidth">width="{{ post.coverWidth }}"</if> />`

## Performance Features

- **PWA Ready**: Service Worker with caching strategies
- **Critical CSS**: Inlined above-the-fold styles
- **Lazy Loading**: Images and below-the-fold content
- **Code Splitting**: Per-page CSS and JavaScript bundles
- **Compression**: Gzip optimization and minification

### Responsive Images (Markdown) + <picture>

The Markdown renderer supports responsive images with lazy loading, `<picture>` with WebP+raster sources, and `<noscript>` fallback.

- Title meta syntax (segments separated by `|`):
  - `srcset=...` candidates list (`path 320w, path 640w`)
  - `sizes=...` sizes descriptor (`(max-width: 640px) 100vw, 640px`)
  - `loading=eager|lazy` (default: lazy)
  - `priority=high|low` sets `fetchpriority` (default: low).
    If `priority=high` or `loading=eager`, lazy/noscript are disabled and attributes are inlined for LCP.

Example:

`![Alt](../assets/images/example.jpg "Hero | srcset=../img/320.jpg 320w, ../img/640.jpg 640w | sizes=(max-width: 640px) 100vw, 640px")`

Notes:
- For local PNG/JPEG assets the engine tries to add `width`/`height` to reduce CLS.
- If `srcset` isn’t provided, it’s built automatically from `src/assets/images-manifest.json`.
- Output uses `<picture>`: WebP `<source>` + raster `<source>`; eager mode emits real `srcset`, lazy uses `data-srcset` and a `<noscript>` `<img>` fallback.
- For LCP images (e.g., covers) prefer `loading=eager | priority=high`.

### Theme, dark mode and accent color (M9)

- Theme modes: auto (default), light, dark. The toggle in the header cycles through Auto → Dark → Light → Auto.
- Persistence: user choice is stored in localStorage under `theme` and applied by setting `documentElement.dataset.theme`.
- System preference: when set to Auto, `prefers-color-scheme` decides between light/dark; switching OS theme updates the site live.
- Accent: choose among Default, Violet, Green. Stored as `accent` in localStorage and applied as `body[data-accent]`.
- A11y: header menu is keyboard accessible with a focus trap when open; Escape closes it; outside click closes it on touch/mouse.

### Image Pipeline

Run `pnpm -s images:generate` to create responsive variants for images under `src/assets/images`:

- Resized variants for JPG/PNG: `-320`, `-640`, `-960`, `-1280` (no upscaling)
- WebP base and matching WebP variants
- A manifest written to `src/assets/images-manifest.json`

The `pnpm build` script runs this step automatically before CMS and Vite.

### Pagination & archives

- URL scheme:
  - Page 1 flat: `/tags/slug.html`, `/months/YYYY-MM.html` (and `/series/<name>.html`)
  - Pages 2+: subfolder with `index.html`: `/tags/slug/2/`, `/months/YYYY-MM/2/`
- A11y/SEO:
  - `rel="prev"/"next"`, `aria-current="page"`, ellipses non-clickable
- Archives generated:
  - Tags: `src/tags/<slug>.html` + RSS `src/tags/<slug>.xml`
  - Months: `src/months/<YYYY-MM>.html` + RSS `src/months/<YYYY-MM>.xml`
  - Series: `src/series/<slug>.html`

Quick use:
- In a listing template, include the shared UI:
  - `<include src="../components/pagination.html"></include>`
- Expose `pagination` from your generator to drive the component.
- Add RSS link in `<head>` of tag/month pages:
  - `<link rel="alternate" type="application/rss+xml" href="{{ canonicalUrl.replace('.html', '.xml') }}" />`

### Code highlighting

- Use fenced code blocks in Markdown (```js, ```css, ```html, etc.).
- Renderer outputs `<pre is="pix-highlighter" lang="..."><code>…</code></pre>`.
- Supported lexers: js, ts, css, html, json, md, bash, python, go, rust, c, cpp, php, csharp, yaml.

### Post front-matter (fields)

- `title`, `date`, `description`, `tags`, `published`
- Optional: `coverImage`, `pinned`, `series`, `keywords`, `layout`
- `coverImage` local (PNG/JPG): width/height inferred automatically when possible; benefits responsive pipeline.

## Design System

Built with proprietary vanilla CSS system and custom design tokens:

```css
/* Spacing system */
padding: var(--space-4);
margin: var(--space-6);

/* Typography scale */
font-size: var(--text-lg);
line-height: var(--font-lineheight-3);

/* Color system */
color: var(--text-primary);
background: var(--surface-1);
```

## Testing

Performance testing suite available at `/performance-test.html`:

- PWA functionality validation
- Service Worker cache testing
- Performance metrics monitoring
- Design system verification

## Browser Support

- **Modern Browsers**: Chrome 90+, Firefox 90+, Safari 14+, Edge 90+
- **Progressive Enhancement**: Graceful degradation for older browsers
- **Accessibility**: Screen reader compatible, keyboard navigation

## Deployment

Automated deployment to GitHub Pages:

1. Push to `main` branch
2. GitHub Actions runs build process
3. Deploys to `https://dout.dev`

Manual deployment:

```bash
pnpm build
# Upload dist/ to your hosting provider
```

## Favicons e build (importante)

Il processo di build si aspetta che alcuni asset di favicon/manife­st siano presenti alla radice del progetto. I nomi attesi (come riferiti in `favicon.data.json`) sono, ad esempio:

- `favicon-96x96.png`
- `favicon.svg`
- `favicon.ico`
- `apple-touch-icon.png` (180x180 consigliato)
- `site.webmanifest` (web manifest)

Dove posizionarli

- Copia i file nella root del repository (stesso livello di `package.json`). Lo script `scripts/build-assets.js` cercherà i percorsi esattamente come indicati in `favicon.data.json`.

Cosa fa lo script di build

- Se i file sono mancanti, lo script ora **genera dei placeholder** (file PNG/SVG/manifest minimi) dentro `dist/` in modo da permettere preview e debug.
- Nonostante i placeholder vengano creati, la build è comunque progettata per **fallire** quando mancano i file reali: questo provoca un errore chiaro in CI così da prevenire pubblicazioni incomplete.

Test locale

- Per verificare localmente:
  - Installa dipendenze: `pnpm install`
  - Esegui: `pnpm build`
  - Se mancano i favicon reali, vedrai un errore come `Missing favicon assets` e i placeholder saranno comunque creati in `dist/`.

Come risolvere il fallimento

- Aggiungi i file reali nella root con i nomi attesi.
- In alternativa (temporaneo) puoi creare dei file vuoti con i nomi corretti prima di eseguire la build:

```bash
touch favicon-96x96.png favicon.svg favicon.ico apple-touch-icon.png site.webmanifest
```

- Se preferisci cambiare il comportamento (es. trasformare il fallimento in warning), modifica `scripts/build-assets.js` nella funzione `processFavicons` rimuovendo il `throw` dopo la creazione dei placeholder.

Suggerimenti

- For production usa immagini reali (PNG/SVG/ICO) alle risoluzioni consigliate: 48–512px per PNG, SVG per scalabilità e `apple-touch-icon` a 180x180.
- Aggiorna `favicon.data.json` se cambi i nomi o i percorsi.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test with `pnpm build`
5. Submit a pull request

## License

MIT License - see [LICENSE](LICENSE) for details.

---

**Live Site**: [https://dout.dev](https://dout.dev)  
**Repository**: [https://github.com/pixu1980/dout-dev](https://github.com/pixu1980/dout-dev)
