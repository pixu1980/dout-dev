let cleanupArticleNavigation = null;

function setCurrentLink(links, activeId) {
  links.forEach((link) => {
    const isCurrent = link.hash === `#${activeId}`;

    if (isCurrent) {
      link.setAttribute('aria-current', 'location');
    } else {
      link.removeAttribute('aria-current');
    }
  });
}

function findActiveHeading(headings) {
  const threshold = window.innerHeight * 0.28;
  let candidate = headings[0];

  for (const heading of headings) {
    if (heading.getBoundingClientRect().top <= threshold) {
      candidate = heading;
      continue;
    }

    break;
  }

  return candidate;
}

function initArticleNavigation() {
  cleanupArticleNavigation?.();

  if (typeof document === 'undefined' || typeof window === 'undefined') {
    return;
  }

  const toc = document.querySelector('.post-toc');
  const prose = document.querySelector('.prose');

  if (!toc || !prose) {
    return;
  }

  const headings = Array.from(prose.querySelectorAll('[data-toc-anchor="true"]'));

  if (!headings.length) {
    return;
  }

  const links = headings
    .map((heading) => toc.querySelector(`a[href="#${heading.id}"]`))
    .filter((link) => link instanceof HTMLAnchorElement);

  if (!links.length) {
    return;
  }

  const syncCurrentHeading = () => {
    const activeHeading = findActiveHeading(headings);

    if (activeHeading) {
      setCurrentLink(links, activeHeading.id);
    }
  };

  let observer = null;
  let removeScrollListener = null;

  if ('IntersectionObserver' in window) {
    observer = new IntersectionObserver(syncCurrentHeading, {
      rootMargin: '0% 0% -68% 0%',
      threshold: [0, 1],
    });

    headings.forEach((heading) => {
      observer.observe(heading);
    });
  } else {
    window.addEventListener('scroll', syncCurrentHeading, { passive: true });
    removeScrollListener = () => {
      window.removeEventListener('scroll', syncCurrentHeading);
    };
  }

  const handleTocClick = (event) => {
    const link = event.target.closest('a[href^="#"]');

    if (!(link instanceof HTMLAnchorElement)) {
      return;
    }

    const target = document.getElementById(link.hash.slice(1));

    if (target instanceof HTMLElement) {
      setCurrentLink(links, target.id);
    }
  };

  toc.addEventListener('click', handleTocClick);
  window.addEventListener('hashchange', syncCurrentHeading);
  syncCurrentHeading();

  cleanupArticleNavigation = () => {
    observer?.disconnect();
    removeScrollListener?.();
    toc.removeEventListener('click', handleTocClick);
    window.removeEventListener('hashchange', syncCurrentHeading);
    cleanupArticleNavigation = null;
  };
}

function destroyArticleNavigation() {
  cleanupArticleNavigation?.();
}

export { destroyArticleNavigation, initArticleNavigation };
