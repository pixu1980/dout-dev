import { refreshPostFeedLayouts } from './post-feed-layout.js';

const FEED_SELECTOR = '[data-load-more-feed="true"]';
const DEFAULT_STEP = 10;

function parsePositiveInteger(value, fallback) {
  const parsed = Number.parseInt(String(value ?? ''), 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function formatRemainingLabel(baseLabel, remaining, step) {
  if (remaining <= 0) {
    return baseLabel;
  }

  if (remaining < step) {
    return `Load last ${remaining} ${remaining === 1 ? 'post' : 'posts'}`;
  }

  return baseLabel;
}

function getFeedItems(feed) {
  return Array.from(feed.children).filter((item) =>
    item.matches('[data-post-feed-item], .post-feed__item')
  );
}

function updateFeed(state) {
  const visibleCount = Math.min(state.visibleCount, state.items.length);
  const remainingCount = Math.max(state.items.length - visibleCount, 0);

  state.items.forEach((item, index) => {
    item.hidden = index >= visibleCount;
  });

  state.status.textContent = `Showing ${visibleCount} of ${state.items.length} posts`;
  state.button.hidden = remainingCount === 0;
  state.button.textContent = formatRemainingLabel(state.baseLabel, remainingCount, state.step);

  refreshPostFeedLayouts();
}

function createControls(feed, baseLabel) {
  const controls = document.createElement('div');
  controls.dataset.postFeedActions = '';

  const status = document.createElement('p');
  status.dataset.postFeedStatus = '';
  status.setAttribute('aria-live', 'polite');

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'button button--ghost';
  button.textContent = baseLabel;

  controls.append(status, button);
  feed.insertAdjacentElement('afterend', controls);

  return { button, status };
}

function initLoadMoreFeed(feed) {
  if (!(feed instanceof HTMLElement) || feed.dataset.loadMoreReady === 'true') {
    return;
  }

  const items = getFeedItems(feed);
  const initialCount = parsePositiveInteger(feed.dataset.loadMoreInitial, DEFAULT_STEP);
  const step = parsePositiveInteger(feed.dataset.loadMoreStep, DEFAULT_STEP);

  feed.dataset.loadMoreReady = 'true';

  if (items.length <= initialCount) {
    return;
  }

  const baseLabel = feed.dataset.loadMoreLabel || `Load ${step} more posts`;
  const { button, status } = createControls(feed, baseLabel);
  const state = {
    items,
    button,
    status,
    baseLabel,
    step,
    visibleCount: initialCount,
  };

  button.addEventListener('click', () => {
    state.visibleCount = Math.min(state.visibleCount + state.step, state.items.length);
    updateFeed(state);
  });

  updateFeed(state);
}

function initPostFeedLoadMore(root = document) {
  if (typeof document === 'undefined') {
    return;
  }

  const scope = root && typeof root.querySelectorAll === 'function' ? root : document;
  scope.querySelectorAll(FEED_SELECTOR).forEach((feed) => {
    initLoadMoreFeed(feed);
  });
}

export { initPostFeedLoadMore };
