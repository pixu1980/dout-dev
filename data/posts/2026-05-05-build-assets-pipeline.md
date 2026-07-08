---
title: 'Build Assets Pipeline (Or: How I Turned a Simple Blog Into an Image Processing Factory)'
date: '2026-05-05'
author: 'Emiliano "pixu1980" Pisu'
author_link: "https://pixu.dev"
published: true
tags: ['making-of', 'build-assets', 'performance', 'images']
series: 'How I made it'
description: 'How dout.dev turns source assets into responsive images, stable dimensions, favicons, manifests, and cacheable build output. All at build time. No CDN.'
canonical_url: false
---

## The goal (four non-negotiable constraints)

**Every image on this blog has to satisfy four constraints.** Not "nice to have." Non-negotiable. Like my morning coffee.

1. **Correct size for the viewport.** No 2000px hero shipped to a phone.
2. **Modern format where supported.** WebP for browsers that accept it, raster fallback for the rest.
3. **Zero cumulative layout shift.** Width and height reserved BEFORE the image downloads.
4. **Lazy on-reveal.** Off-screen images do not block the main thread.

The pipeline that delivers that is entirely build-time. There is NO image CDN, no runtime resize, no magic. This post walks through each layer.

## The input: a plain markdown image (looks boring, does magic)

The markdown source looks like a normal image:

```markdown
![A keyboard on a wooden desk](../assets/images/keyboard.jpg)
```

What makes it responsive is NOT a special syntax. It's the build pipeline that sees the local path and does work behind the scenes. Magic? No. Engineering.

Optionally the author can provide a title meta string to override the default behavior:

```markdown
![Hero](../assets/images/hero.jpg 'Hero | srcset=../img/320.jpg 320w, ../img/640.jpg 640w | priority=high')
```

Segments separated by `|` let you specify custom `srcset`, `sizes`, `loading`, and `priority`. For most images I omit all of that and let the pipeline fill in the defaults. Because defaults should be smart.

## Stage 1: variants and the image manifest (sharp knives, hot takes)

Before the CMS runs, an image pipeline step generates responsive variants of every image under `src/assets/images/`:

- `image.jpg` → `image-320.jpg`, `image-640.jpg`, `image-960.jpg`, `image-1280.jpg`, NEVER upscaled;
- a WebP base (`image.webp`) and matching WebP variants at each size.

The output of that step is a manifest file (`src/assets/images-manifest.json`) with entries like:

```json
{
  "/assets/images/keyboard.jpg": {
    "width": 1920,
    "height": 1280,
    "variants": [
      { "src": "/assets/images/keyboard-320.jpg", "width": 320 },
      { "src": "/assets/images/keyboard-640.jpg", "width": 640 }
    ]
  }
}
```

Sharp does the resizing. The manifest is the contract between the image step and the markdown renderer. Contracts are good. Trust me, I've been divorced.

## Stage 2: the markdown renderer rewrites `<img>` into `<picture>` (the fun part)

When the renderer encounters an image with a local path, it looks up the manifest, computes `srcset` for WebP and raster sources, and emits a `<picture>` element:

```html
<picture>
  <source type="image/webp" data-srcset="/assets/images/keyboard-320.webp 320w, ..." />
  <source type="image/jpeg" data-srcset="/assets/images/keyboard-320.jpg 320w, ..." />
  <img src="/assets/images/keyboard.jpg" alt="A keyboard on a wooden desk"
       width="1920" height="1280" loading="lazy" decoding="async" />
  <noscript>
    <img src="/assets/images/keyboard-640.jpg" alt="A keyboard on a wooden desk" />
  </noscript>
</picture>
```

Two details worth calling out because they matter:

**Width and height come from the manifest.** The browser reserves the correct aspect-ratio box BEFORE the pixels arrive, so there is ZERO layout shift when the image loads. This is the single most impactful CLS fix on any image-heavy page. If you're not doing this, you're doing it wrong.

**`data-srcset` instead of `srcset` by default.** The real `srcset` is swapped in by a tiny script when the image enters the viewport, which is how the "lazy on-reveal" policy is enforced. The `<noscript>` fallback covers users who disable JavaScript. Because not everyone lives in a perfect world.

## Stage 3: the tiny observer that swaps `data-srcset` to `srcset` (12 lines, no framework)

The runtime piece is small. Embarrassingly small:

```js
const io = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      const source = entry.target;
      if (source.dataset.srcset) {
        source.srcset = source.dataset.srcset;
        source.removeAttribute('data-srcset');
      }
      io.unobserve(source);
    }
  },
  { rootMargin: '200px' }
);

document.querySelectorAll('source[data-srcset]').forEach((s) => io.observe(s));
```

That's the ENTIRE lazy-load layer. Everything else is declarative markup the browser understands natively. No library. No framework. No bullshit.

## Why not `loading="lazy"` alone? (the nuance part)

Native `loading="lazy"` is a good default and I use it on `<img>` elements. But it does NOT cover `<source>` elements inside `<picture>`. The IntersectionObserver swap handles the source selection path, which is where the large WebP variants are chosen.

On a page with a dozen images below the fold, the difference is measurable in bytes saved on initial load. Measurable matters.

## What I did NOT do (because engineering is about saying no)

- **No runtime image CDN.** Every variant is on disk, served by GitHub Pages, cached at the edge.
- **No AVIF yet.** AVIF support is excellent, but WebP still beats it on encode time for the gains at the sizes this blog uses. I will reconsider when AVIF encoders catch up. Not today.
- **No third-party "lazyload.js".** Twelve lines of IntersectionObserver replaces it. Twelve. Lines.

## The takeaway

Responsive images do NOT need a service. A build step that generates variants, a manifest the renderer reads, and a markdown pass that emits `<picture>` are enough. The result is small pages, correct sizes, known dimensions, and lazy behavior that respects the user.

No CDN. No runtime. No excuses.
