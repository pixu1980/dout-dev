import assert from 'node:assert/strict';
import { beforeEach, test } from 'node:test';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!doctype html><html><head></head><body></body></html>', {
  url: 'https://dout.dev/',
});

global.window = dom.window;
global.document = dom.window.document;
Object.defineProperty(globalThis, 'navigator', {
  configurable: true,
  value: dom.window.navigator,
});
global.CustomEvent = dom.window.CustomEvent;

function installMeta(name, content) {
  const meta = document.createElement('meta');
  meta.setAttribute('name', name);
  meta.setAttribute('content', content);
  document.head.appendChild(meta);
}

async function loadModule() {
  return import(new URL(`./analytics.js?test=${Date.now()}-${Math.random()}`, import.meta.url));
}

beforeEach(() => {
  document.head.innerHTML = '';
  document.body.innerHTML = '';
  window.localStorage.clear();
  window.history.replaceState({}, '', '/');
  document.title = 'Home';
  installMeta('dout:analytics-dashboard', '/privacy.html');
  installMeta('dout:analytics-endpoint', '');
});

test('trackPageView stores local page-hit counts', async () => {
  const { getAnalyticsSnapshot, trackPageView } = await loadModule();

  const result = trackPageView({ title: 'Home', url: 'https://dout.dev/' });
  const snapshot = getAnalyticsSnapshot();

  assert.equal(result.tracked, true);
  assert.equal(snapshot.length, 1);
  assert.equal(snapshot[0].path, '/');
  assert.equal(snapshot[0].count, 1);
  assert.equal(snapshot[0].title, 'Home');
});

test('trackPageView respects local opt-out', async () => {
  const { getAnalyticsSnapshot, setAnalyticsOptOut, trackPageView } = await loadModule();

  setAnalyticsOptOut(true);
  const result = trackPageView({ title: 'Archive', url: 'https://dout.dev/archive.html' });

  assert.equal(result.tracked, false);
  assert.equal(result.reason, 'opt-out');
  assert.equal(getAnalyticsSnapshot().length, 0);
});

test('initAnalyticsDashboard renders local counts and toggles state', async () => {
  const { initAnalyticsDashboard, trackPageView } = await loadModule();

  document.body.innerHTML = `
    <p data-analytics-status></p>
    <button type="button" data-analytics-toggle></button>
    <button type="button" data-analytics-clear></button>
    <a data-analytics-download="json" href="#">JSON</a>
    <a data-analytics-download="csv" href="#">CSV</a>
    <div data-analytics-dashboard></div>
  `;

  trackPageView({ title: 'Privacy', url: 'https://dout.dev/privacy.html' });
  initAnalyticsDashboard();

  assert.match(
    document.body.innerHTML,
    /Local page-hit summary|Local page-hit counts stored in this browser/
  );
  assert.match(document.body.innerHTML, /Privacy/);
  assert.match(
    document.querySelector('[data-analytics-status]').textContent,
    /Tracking is enabled/
  );

  document.querySelector('[data-analytics-toggle]').click();
  assert.match(
    document.querySelector('[data-analytics-status]').textContent,
    /disabled for this browser/
  );
});
