---
title: 'Honest Lazy Loading: IntersectionObserver vs Native `loading="lazy"`'
date: '2026-07-28'
published: false
tags: ['performance', 'frontend', 'vanilla-js']
description: 'When native lazy loading is enough, when IntersectionObserver is the right tool, and the specific cases where mixing both is the only correct answer.'
canonical_url: false
---

## The two tools, in one paragraph

Native `loading="lazy"` on `<img>` and `<iframe>` is a browser-managed hint. The browser decides when to load based on its own heuristics, and it usually does a good job. IntersectionObserver is a programmable primitive that tells your code exactly when an element enters a viewport band. Both are useful. They are not the same thing, and treating them as interchangeable is how you end up with images that load too late or scripts that fire too early.

This post is the mental model I use to pick between them.

## The happy path: native lazy on images below the fold

For most images on a blog, native lazy loading is correct and sufficient.

```html
<img src="keyboard.jpg"
     alt="A keyboard on a wooden desk"
     width="1920"
     height="1280"
     loading="lazy"
     decoding="async" />
```

What this gets you, for free:

- The image does not download until the browser predicts it is needed.
- No JavaScript required.
- The `decoding="async"` hint tells the browser it can decode off the main thread.
- `width` and `height` reserve the aspect-ratio box so there is no layout shift when the image eventually arrives.

The browser's heuristic is not perfect, but it is tuned for the 80% case of scrolling pages. If your images are content images on a standard reading flow, `loading="lazy"` does the job.

## Where native lazy is wrong

Three situations where you should not use `loading="lazy"`, or where you have to combine it with IntersectionObserver.

### 1. LCP candidates above the fold

The image that is going to be your Largest Contentful Paint should load eagerly. Setting `loading="lazy"` on an LCP image delays the one number that most affects your page quality metric.

```html
<img src="hero.jpg"
     alt="Hero image"
     width="1200" height="800"
     loading="eager"
     fetchpriority="high" />
```

`fetchpriority="high"` tells the browser this resource should be prioritized over others. Use it sparingly — if everything is "high", nothing is. One LCP candidate per page.

### 2. `<source>` inside `<picture>`

`loading="lazy"` on an `<img>` inside a `<picture>` applies to the image as a whole. But the `<source>` elements inside the picture have already been evaluated by the time the browser decides whether to defer the image. The browser will still download a WebP variant even if the fallback `<img>` is lazy.

For large below-the-fold `<picture>` blocks, the fix is to store the `srcset` in `data-srcset` and swap it with IntersectionObserver when the element is near the viewport.

```html
<picture>
  <source type="image/webp"
          data-srcset="/img/hero-320.webp 320w, /img/hero-640.webp 640w"
          sizes="(max-width: 640px) 100vw, 640px" />
  <img src="/img/hero.jpg" alt="…" width="1920" height="1280" loading="lazy" />
</picture>
```

```js
const io = new IntersectionObserver((entries) => {
  for (const entry of entries) {
    if (!entry.isIntersecting) continue;
    const source = entry.target;
    source.srcset = source.dataset.srcset;
    source.removeAttribute('data-srcset');
    io.unobserve(source);
  }
}, { rootMargin: '200px' });

document.querySelectorAll('source[data-srcset]').forEach((s) => io.observe(s));
```

This is the only reliable way I have found to avoid eager downloads of large WebP variants for below-the-fold pictures.

### 3. Iframes from third parties

Giscus, CodePen embeds, video embeds: these are expensive third-party resources that you do not want to load on every page view. `loading="lazy"` on the iframe helps, but you often want stricter control — load only when the user scrolls close, or only when a "Show comments" button is pressed.

```html
<div class="comments-shell"
     data-giscus-src="https://giscus.app/client.js"
     data-giscus-attrs='{ "data-repo": "…" }'>
  <button type="button" class="load-comments">Load comments</button>
</div>
```

```js
document.querySelector('.load-comments')?.addEventListener('click', (e) => {
  const shell = e.target.closest('.comments-shell');
  const attrs = JSON.parse(shell.dataset.giscusAttrs);
  const script = document.createElement('script');
  script.src = shell.dataset.giscusSrc;
  for (const [k, v] of Object.entries(attrs)) script.setAttribute(k, v);
  script.crossOrigin = 'anonymous';
  script.async = true;
  shell.appendChild(script);
  e.target.remove();
});
```

The cost of opting into "click to load" for comments is one button and a 20-line handler. The benefit is a significantly smaller critical path for readers who do not engage with comments.

On dout.dev I ship the Giscus embed lazily via `data-loading="lazy"` and do not hide it behind a button, because comments are part of the editorial experience. On a page with heavier embeds, the button pattern is the right default.

## The mental model

- Is the element above the fold and likely the LCP? → `loading="eager"` + `fetchpriority="high"`.
- Is it an image or plain iframe below the fold? → `loading="lazy"`.
- Is it a `<source>` inside a `<picture>` below the fold? → IntersectionObserver with `data-srcset` swap.
- Is it a heavy third-party embed? → IntersectionObserver with a bigger root margin, or a click-to-load button.

Everything else is a variation.

## What I do not do

I do not reinvent native lazy for plain images. I do not ship a "lazyload.js" dependency. I do not observe scroll events. IntersectionObserver is already in every target browser and has been for years.

## The takeaway

Native lazy is a good default. Use it first. Reach for IntersectionObserver when the browser's heuristic is not under your control (nested picture sources, third-party iframes, expensive runtime costs). The two tools complement each other; they do not compete.

## References

- [`loading` attribute — MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/loading)
- [`fetchpriority` — MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/fetchpriority)
- [IntersectionObserver — MDN](https://developer.mozilla.org/en-US/docs/Web/API/IntersectionObserver)
- [Browser-level image lazy loading — web.dev](https://web.dev/articles/browser-level-image-lazy-loading)
- [Lazy-loading iframes — web.dev](https://web.dev/articles/iframe-lazy-loading)
