---
title: 'Responsive Images With `<picture>`, WebP and Zero CLS'
date: '2026-06-16'
published: false
tags: ['performance', 'html', 'css', 'architecture']
description: 'The image pipeline on dout.dev: how a single markdown image becomes a responsive `<picture>` with WebP sources, lazy loading, known dimensions, and no layout shift.'
canonical_url: false
---

## The goal

Every image on this blog has to satisfy four non-negotiable constraints:

1. **Correct size for the viewport.** No 2000px hero shipped to a phone.
2. **Modern format where supported.** WebP for browsers that accept it, raster fallback for the rest.
3. **Zero cumulative layout shift.** Width and height reserved before the image downloads.
4. **Lazy on-reveal.** Off-screen images do not block the main thread.

The pipeline that delivers that is entirely build-time. There is no image CDN, no runtime resize, no magic. This post walks through each layer.

## The input: a plain markdown image

The markdown source looks like a normal image:

```markdown
![A keyboard on a wooden desk](../assets/images/keyboard.jpg)
```

What makes it responsive is not a special syntax. It is the build pipeline that sees the local path and does work behind the scenes.

Optionally the author can provide a title meta string to override the default behavior:

```markdown
![Hero](../assets/images/hero.jpg "Hero | srcset=../img/320.jpg 320w, ../img/640.jpg 640w | sizes=(max-width: 640px) 100vw, 640px | priority=high | loading=eager")
```

Segments separated by `|` let you specify custom `srcset`, `sizes`, `loading`, and `priority`. For most images I omit all of that and let the pipeline fill in the defaults.

## Stage 1: variants and the image manifest

Before the CMS runs, an image pipeline step generates responsive variants of every image under `src/assets/images/`:

- `image.jpg` → `image-320.jpg`, `image-640.jpg`, `image-960.jpg`, `image-1280.jpg`, never upscaled;
- a WebP base (`image.webp`) and matching WebP variants at each size.

The output of that step is a manifest file (`src/assets/images-manifest.json`) with entries like:

```json
{
  "/assets/images/keyboard.jpg": {
    "width": 1920,
    "height": 1280,
    "variants": [
      { "src": "/assets/images/keyboard-320.jpg", "width": 320 },
      { "src": "/assets/images/keyboard-640.jpg", "width": 640 },
      { "src": "/assets/images/keyboard-960.jpg", "width": 960 },
      { "src": "/assets/images/keyboard-1280.jpg", "width": 1280 }
    ],
    "webp": [
      { "src": "/assets/images/keyboard-320.webp", "width": 320 }
    ]
  }
}
```

Sharp does the resizing. The manifest is the contract between the image step and the markdown renderer.

## Stage 2: the markdown renderer rewrites `<img>` into `<picture>`

When the renderer encounters an image with a local path, it looks up the manifest, computes `srcset` for WebP and raster sources, and emits a `<picture>` element:

```html
<picture>
  <source
    type="image/webp"
    data-srcset="/assets/images/keyboard-320.webp 320w,
                 /assets/images/keyboard-640.webp 640w,
                 /assets/images/keyboard-960.webp 960w,
                 /assets/images/keyboard-1280.webp 1280w"
    sizes="(max-width: 640px) 100vw, 640px"
  />
  <source
    type="image/jpeg"
    data-srcset="/assets/images/keyboard-320.jpg 320w, …"
    sizes="(max-width: 640px) 100vw, 640px"
  />
  <img
    src="/assets/images/keyboard.jpg"
    alt="A keyboard on a wooden desk"
    width="1920"
    height="1280"
    loading="lazy"
    decoding="async"
  />
  <noscript>
    <img src="/assets/images/keyboard-640.jpg" alt="A keyboard on a wooden desk" />
  </noscript>
</picture>
```

Two details worth calling out.

**Width and height come from the manifest.** The browser reserves the correct aspect-ratio box before the pixels arrive, so there is no layout shift when the image loads. This is the single most impactful CLS fix on any image-heavy page.

**`data-srcset` instead of `srcset` by default.** The real `srcset` is swapped in by a tiny script when the image enters the viewport, which is how the "lazy on-reveal" policy is enforced. The `<noscript>` fallback covers users who disable JavaScript.

For LCP-critical images (covers, above-the-fold hero), the author sets `priority=high` or `loading=eager`, and the renderer inlines real `srcset` attributes instead of `data-srcset`. No waiting, no flash.

## Stage 3: the tiny observer that swaps `data-srcset` to `srcset`

The runtime piece is small:

```js
const io = new IntersectionObserver((entries) => {
  for (const entry of entries) {
    if (!entry.isIntersecting) continue;
    const source = entry.target;
    if (source.dataset.srcset) {
      source.srcset = source.dataset.srcset;
      source.removeAttribute('data-srcset');
    }
    io.unobserve(source);
  }
}, { rootMargin: '200px' });

document.querySelectorAll('source[data-srcset]').forEach((s) => io.observe(s));
```

That is the entire lazy-load layer. Everything else is declarative markup the browser understands natively.

## Why not `loading="lazy"` alone?

Native `loading="lazy"` is a good default and I use it on `<img>` elements. But it does not cover `<source>` elements inside `<picture>`. The IntersectionObserver swap handles the source selection path, which is where the large WebP variants are chosen.

On a page with a dozen images below the fold, the difference is measurable in bytes saved on initial load.

## What I did not do

- **No runtime image CDN.** Every variant is on disk, served by GitHub Pages, cached at the edge.
- **No AVIF yet.** AVIF support is excellent, but WebP still beats it on encode time for the gains at the sizes this blog uses. I will reconsider when AVIF encoders catch up on the CPU side.
- **No third-party "lazyload.js".** Twelve lines of IntersectionObserver replaces it.

## The takeaway

Responsive images do not need a service. A build step that generates variants, a manifest the renderer reads, and a markdown pass that emits `<picture>` are enough. The result is small pages, correct sizes, known dimensions, and lazy behavior that respects the user.

## References

- [`<picture>` — MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/picture)
- [Responsive images — MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Guides/Responsive_images)
- [Optimize Cumulative Layout Shift — web.dev](https://web.dev/articles/optimize-cls)
- [Sharp image processing library](https://sharp.pixelplumbing.com/)
- [IntersectionObserver — MDN](https://developer.mozilla.org/en-US/docs/Web/API/IntersectionObserver)
