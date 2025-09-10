const DEFAULT_STORAGE_KEY = 'dout:analytics:page-hits';
const DEFAULT_OPT_OUT_KEY = 'dout:analytics:opt-out';

let lastTrackedPath = '';

function getMetaContent(name) {
  return document.querySelector(`meta[name="${name}"]`)?.getAttribute('content') || '';
}

function getStorageKey() {
  return DEFAULT_STORAGE_KEY;
}

function getOptOutKey() {
  return DEFAULT_OPT_OUT_KEY;
}

function getAnalyticsConfig() {
  return {
    dashboardPath: getMetaContent('dout:analytics-dashboard') || '/privacy.html',
    endpoint: getMetaContent('dout:analytics-endpoint'),
    storageKey: getStorageKey(),
    optOutKey: getOptOutKey(),
  };
}

function readStorage(key) {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key, value) {
  try {
    window.localStorage.setItem(key, value);
  } catch {}
}

function removeStorage(key) {
  try {
    window.localStorage.removeItem(key);
  } catch {}
}

function isDoNotTrackEnabled() {
  const value =
    navigator.globalPrivacyControl === true
      ? '1'
      : navigator.doNotTrack || window.doNotTrack || navigator.msDoNotTrack || '0';

  return value === '1' || value === 'yes';
}

export function isAnalyticsOptedOut() {
  return readStorage(getOptOutKey()) === '1';
}

export function setAnalyticsOptOut(isEnabled) {
  if (isEnabled) {
    writeStorage(getOptOutKey(), '1');
    return;
  }

  removeStorage(getOptOutKey());
}

export function clearAnalyticsData() {
  removeStorage(getStorageKey());
  dispatchAnalyticsUpdate();
}

function readHits() {
  const raw = readStorage(getStorageKey());

  if (!raw) {
    return {};
  }

  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writeHits(value) {
  writeStorage(getStorageKey(), JSON.stringify(value));
}

function buildTrackingPath(urlValue = window.location.href) {
  const url = new URL(urlValue, window.location.origin);
  const path = `${url.pathname}${url.search}`;
  return path === '/index.html' ? '/' : path;
}

function emitBeacon(endpoint, payload) {
  if (!endpoint) return;

  const body = JSON.stringify(payload);

  if (typeof navigator.sendBeacon === 'function') {
    try {
      navigator.sendBeacon(endpoint, new Blob([body], { type: 'application/json' }));
      return;
    } catch {}
  }

  void fetch(endpoint, {
    method: 'POST',
    credentials: 'omit',
    keepalive: true,
    headers: { 'content-type': 'application/json' },
    body,
  }).catch(() => {});
}

export function getAnalyticsSnapshot() {
  return Object.values(readHits())
    .filter((entry) => entry && typeof entry === 'object')
    .map((entry) => ({
      count: Number(entry.count || 0),
      lastVisited: entry.lastVisited || '',
      path: entry.path || '/',
      title: entry.title || entry.path || '/',
    }))
    .sort((left, right) => right.count - left.count || left.path.localeCompare(right.path));
}

function dispatchAnalyticsUpdate() {
  document.dispatchEvent(
    new CustomEvent('dout:analytics-updated', {
      detail: {
        optedOut: isAnalyticsOptedOut(),
        snapshot: getAnalyticsSnapshot(),
      },
    })
  );
}

export function trackPageView({ title = document.title, url = window.location.href } = {}) {
  if (isDoNotTrackEnabled()) {
    return { reason: 'dnt', tracked: false };
  }

  if (isAnalyticsOptedOut()) {
    return { reason: 'opt-out', tracked: false };
  }

  const path = buildTrackingPath(url);
  if (path === lastTrackedPath) {
    return { reason: 'duplicate', tracked: false };
  }

  lastTrackedPath = path;

  const hits = readHits();
  const previous = hits[path] || { count: 0, path };
  const nextEntry = {
    count: Number(previous.count || 0) + 1,
    lastVisited: new Date().toISOString(),
    path,
    title: title || previous.title || path,
  };

  hits[path] = nextEntry;
  writeHits(hits);
  dispatchAnalyticsUpdate();

  const { endpoint } = getAnalyticsConfig();
  if (endpoint) {
    emitBeacon(endpoint, {
      path: nextEntry.path,
      recordedAt: nextEntry.lastVisited,
      title: nextEntry.title,
    });
  }

  return { path, tracked: true };
}

function formatTimestamp(value) {
  if (!value) return 'Never';

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Unknown' : date.toLocaleString('en-US');
}

function buildCsv(snapshot) {
  const rows = ['path,title,count,lastVisited'];

  snapshot.forEach((entry) => {
    const values = [entry.path, entry.title, String(entry.count), entry.lastVisited].map(
      (value) => `"${String(value || '').replace(/"/g, '""')}"`
    );
    rows.push(values.join(','));
  });

  return `${rows.join('\n')}\n`;
}

function updateDownloadLink(link, type, snapshot) {
  const previousUrl = link.dataset.downloadUrl;
  if (previousUrl) {
    URL.revokeObjectURL(previousUrl);
  }

  const content = type === 'csv' ? buildCsv(snapshot) : `${JSON.stringify(snapshot, null, 2)}\n`;
  const mimeType = type === 'csv' ? 'text/csv;charset=utf-8' : 'application/json;charset=utf-8';
  const url = URL.createObjectURL(new Blob([content], { type: mimeType }));

  link.dataset.downloadUrl = url;
  link.href = url;
  link.download = `dout-dev-page-hits.${type}`;
}

function renderDashboard(container, snapshot) {
  if (!snapshot.length) {
    container.innerHTML = '<p class="muted">No local analytics data recorded yet.</p>';
    return;
  }

  const rows = snapshot
    .map(
      (entry) => `
        <tr>
          <th scope="row"><a href="${entry.path}">${entry.title}</a></th>
          <td>${entry.count}</td>
          <td>${formatTimestamp(entry.lastVisited)}</td>
        </tr>
      `
    )
    .join('');

  container.innerHTML = `
    <table class="analytics-table">
      <caption class="visually-hidden">Local page-hit counts stored in this browser</caption>
      <thead>
        <tr>
          <th scope="col">Page</th>
          <th scope="col">Hits</th>
          <th scope="col">Last recorded</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

function renderStatus(statusElement) {
  const { endpoint } = getAnalyticsConfig();

  if (isDoNotTrackEnabled()) {
    statusElement.textContent =
      'Tracking is disabled because your browser is signaling Do Not Track or Global Privacy Control.';
    return;
  }

  if (isAnalyticsOptedOut()) {
    statusElement.textContent = 'Tracking is disabled for this browser.';
    return;
  }

  statusElement.textContent = endpoint
    ? 'Tracking is enabled. Local counts are stored in this browser and page hits can also be forwarded to the configured endpoint.'
    : 'Tracking is enabled in local-only mode. Page-hit counts stay in this browser unless a remote endpoint is configured later.';
}

function updateToggleLabel(button) {
  button.textContent = isAnalyticsOptedOut()
    ? 'Enable page-hit tracking'
    : 'Disable page-hit tracking';
}

export function initAnalyticsDashboard() {
  const dashboard = document.querySelector('[data-analytics-dashboard]');
  const status = document.querySelector('[data-analytics-status]');
  const toggle = document.querySelector('[data-analytics-toggle]');
  const clear = document.querySelector('[data-analytics-clear]');
  const downloadLinks = Array.from(document.querySelectorAll('[data-analytics-download]'));

  if (!dashboard || !status || !toggle || !clear) {
    return;
  }

  const render = () => {
    const snapshot = getAnalyticsSnapshot();
    renderDashboard(dashboard, snapshot);
    renderStatus(status);
    updateToggleLabel(toggle);
    downloadLinks.forEach((link) => {
      updateDownloadLink(link, link.dataset.analyticsDownload || 'json', snapshot);
    });
  };

  if (!toggle.dataset.analyticsBound) {
    toggle.dataset.analyticsBound = 'true';
    toggle.addEventListener('click', () => {
      setAnalyticsOptOut(!isAnalyticsOptedOut());
      dispatchAnalyticsUpdate();
      render();
    });
  }

  if (!clear.dataset.analyticsBound) {
    clear.dataset.analyticsBound = 'true';
    clear.addEventListener('click', () => {
      clearAnalyticsData();
      render();
    });
  }

  if (!dashboard.dataset.analyticsBound) {
    dashboard.dataset.analyticsBound = 'true';
    document.addEventListener('dout:analytics-updated', render);
  }

  render();
}

export { getAnalyticsConfig, isDoNotTrackEnabled };
