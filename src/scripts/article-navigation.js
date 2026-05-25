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

function getHeadingActivationOffset(heading) {
  const fallback = window.innerHeight * 0.28;

  if (!(heading instanceof HTMLElement)) {
    return fallback;
  }

  const scrollMarginTop = Number.parseFloat(window.getComputedStyle(heading).scrollMarginTop);
  return Number.isFinite(scrollMarginTop) ? scrollMarginTop : fallback;
}

function findActiveHeading(headings) {
  const threshold = getHeadingActivationOffset(headings[0]);
  let candidate = headings[0];

  for (const heading of headings) {
    if (heading.getBoundingClientRect().top <= threshold + 1) {
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

  const main = document.body?.querySelector(':scope > [data-site-main]') || document;
  const toc = main.querySelector('[data-post-toc]');
  const prose = main.querySelector('[data-prose]');

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
  const handleViewportChange = () => {
    syncCurrentHeading();
  };

  if ('IntersectionObserver' in window) {
    observer = new IntersectionObserver(handleViewportChange, {
      rootMargin: '0% 0% -68% 0%',
      threshold: [0, 1],
    });

    headings.forEach((heading) => {
      observer.observe(heading);
    });
  }

  window.addEventListener('scroll', handleViewportChange, { passive: true });
  window.addEventListener('resize', handleViewportChange);

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
    window.removeEventListener('scroll', handleViewportChange);
    window.removeEventListener('resize', handleViewportChange);
    toc.removeEventListener('click', handleTocClick);
    window.removeEventListener('hashchange', syncCurrentHeading);
    cleanupArticleNavigation = null;
  };
}

function destroyArticleNavigation() {
  cleanupArticleNavigation?.();
}

export { destroyArticleNavigation, initArticleNavigation };
