---
title: M4 Template Test - Cover Image e Syntax Highlighting
date: 2024-12-27T10:00:00.000Z
published: true
pinned: true
tags: ['Test', 'M4', 'syntax-highlight-element', 'Cover Image']
canonical_url: false
cover_image: ../assets/images/alexandr-podvalny-220262-unsplash.jpg
description: Post di test per verificare le funzionalità M4 - cover image, pinned badge e syntax highlighting con syntax-highlight-element
---

Questo è un post di test per verificare tutte le funzionalità implementate nel **M4 - Post Page**.

## Cover Image e Pinned Badge

Questo post ha:

- ✅ **Cover Image**: Immagine di copertina caricata con `fetchpriority="high"`
- ✅ **Pinned Badge**: Badge "📌 Post in evidenza" per post in evidenza
- ✅ **Metadata avanzata**: Schema.org BlogPosting completo

## Syntax Highlighting con syntax-highlight-element

Testiamo il syntax highlighting per vari linguaggi:

### JavaScript

```javascript
// Esempio JavaScript
const blogPost = {
  title: 'M4 Template Test',
  author: 'dout.dev',
  published: true,
  tags: ['Test', 'M4', 'syntax-highlight-element'],
};

function renderPost(post) {
  console.log(`Rendering: ${post.title}`);
  return `<article>${post.title}</article>`;
}

addEventListener('DOMContentLoaded', () => {
  // highlighting is handled by the local <syntax-highlight> web component
});
```

### CSS

```css
/* Esempio CSS con design tokens */
.post-cover-image {
  width: 100%;
  height: auto;
  border-radius: var(--border-radius-md);
  box-shadow: var(--shadow-lg);
  object-fit: cover;
}

.post-badge--pinned {
  background: var(--color-accent-primary);
  color: var(--color-text-on-accent);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--border-radius-full);
  font-size: var(--text-sm);
  font-weight: var(--font-weight-medium);
}
```

### HTML

```html
<!-- Esempio HTML con Schema.org -->
<article class="post">
  <header class="post-header">
    <div class="post-badge post-badge--pinned" data-pinned="true">📌 Post in evidenza</div>
    <h1>{{ title }}</h1>
    <div class="post-meta">
      <time datetime="{{ date }}">{{ date | date:'%d %B %Y' }}</time>
    </div>
  </header>
  <div class="post-content">{{ content | raw }}</div>
</article>
```

### JSON

```json
{
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  "headline": "M4 Template Test",
  "description": "Post di test per M4",
  "datePublished": "2024-12-27T10:00:00.000Z",
  "author": {
    "@type": "Person",
    "name": "dout.dev"
  },
  "keywords": "Test,M4,syntax-highlight-element,Cover Image"
}
```

### Bash

```bash
#!/bin/bash
# Script per build e test
echo "Building CMS..."
npm run cms:build

echo "Starting dev server..."
npm run dev
```

## Funzionalità Testate

- [x] **Template post.html aggiornato** con layout hook
- [x] **Metadata completa**: title, meta description, canonical, JSON-LD BlogPosting
- [x] **Support coverImage**: immagine di copertina con attributi performance
- [x] **Support pinned badge**: badge per post in evidenza (mostrato solo in listings)
- [x] **syntax-highlight-element integrato**: syntax highlighting per tutti i linguaggi specificati

La checklist M4 dovrebbe essere completamente implementata! 🎉
