// Lazy Images with IntersectionObserver
function reveal(img) {
  if (!img) return;
  // If within a <picture>, first promote any <source data-srcset>
  const picture =
    img.parentElement && img.parentElement.tagName === 'PICTURE' ? img.parentElement : null;
  if (picture) {
    const sources = picture.querySelectorAll('source[data-srcset]');
    sources.forEach((s) => {
      const ss = s.getAttribute('data-srcset');
      if (ss) {
        s.setAttribute('srcset', ss);
        s.removeAttribute('data-srcset');
      }
    });
  }
  const src = img.getAttribute('data-src');
  const srcset = img.getAttribute('data-srcset');
  const sizes = img.getAttribute('data-sizes');
  if (src) img.src = src;
  if (srcset) img.srcset = srcset;
  if (sizes) img.sizes = sizes;
  img.removeAttribute('data-src');
  img.removeAttribute('data-srcset');
  img.removeAttribute('data-sizes');
  img.classList.add('is-revealed');
}

export function initLazyImages() {
  const lazyImgs = document.querySelectorAll('img[data-src], img[data-srcset], img[data-sizes]');
  if (lazyImgs.length === 0) return;

  // Ensure base perf attributes
  lazyImgs.forEach((img) => {
    if (!img.hasAttribute('loading')) img.setAttribute('loading', 'lazy');
    if (!img.hasAttribute('decoding')) img.setAttribute('decoding', 'async');
  });

  if (!('IntersectionObserver' in window)) {
    lazyImgs.forEach((img) => {
      reveal(img);
    });
    return;
  }

  const io = new IntersectionObserver(
    (entries, observer) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          const img = entry.target;
          reveal(img);
          observer.unobserve(img);
        }
      }
    },
    { rootMargin: '200px 0px', threshold: 0.01 }
  );

  lazyImgs.forEach((img) => {
    io.observe(img);
  });
}

// Auto-init if imported as module and DOM already interactive
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => initLazyImages());
  } else {
    initLazyImages();
  }
}

export default initLazyImages;
