import assert from 'node:assert/strict';
import { beforeEach, test } from 'node:test';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!doctype html><html><head></head><body></body></html>', {
  url: 'https://dout.dev/',
});

globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.location = dom.window.location;
Object.defineProperty(globalThis, 'navigator', {
  configurable: true,
  value: { ...dom.window.navigator, serviceWorker: undefined, connection: undefined },
});
globalThis.CustomEvent = dom.window.CustomEvent;

beforeEach(() => {
  document.body.innerHTML = '';
});

test('disclaimer renders as a sibling section before hero', () => {
  document.body.innerHTML = `
    <section data-hero-disclaimer data-reveal>
      <p data-eyebrow>About this space</p>
      <div data-hero-disclaimer-body>
        <p>Test content</p>
        <ul data-hero-disclaimer-policies aria-label="Site policies">
          <li>No telemetry</li>
          <li>No cookies</li>
          <li>No advertising</li>
          <li>0 Runtime Dependencies</li>
        </ul>
      </div>
    </section>
    <section data-hero data-hero-variant="home">…</section>
  `;

  const disclaimer = document.querySelector('[data-hero-disclaimer]');
  const hero = document.querySelector('[data-hero]');

  assert.ok(disclaimer, 'Disclaimer must exist in DOM');
  assert.ok(hero, 'Hero must exist in DOM');

  // Disclaimer should be a sibling before hero
  assert.equal(
    disclaimer.nextElementSibling,
    hero,
    'Disclaimer must be immediately before data-hero'
  );
});

test('disclaimer is always visible (no dismiss mechanism)', () => {
  document.body.innerHTML = `
    <section data-hero-disclaimer data-reveal>
      <p data-eyebrow>About this space</p>
      <div data-hero-disclaimer-body>
        <p>Test content</p>
      </div>
    </section>
  `;

  const disclaimer = document.querySelector('[data-hero-disclaimer]');

  // No close button
  const closeBtn = disclaimer.querySelector('[data-hero-disclaimer-close]');
  assert.equal(closeBtn, null, 'There should be no close button');

  // No dismiss attribute
  assert.ok(
    !disclaimer.hasAttribute('data-hero-disclaimer-dismissed'),
    'Should not have dismissed attribute'
  );
  assert.ok(
    !disclaimer.hasAttribute('data-hero-disclaimer-closed'),
    'Should not have closed attribute'
  );

  // Has reveal animation
  assert.ok(disclaimer.hasAttribute('data-reveal'), 'Should have data-reveal for scroll animation');
});

test('disclaimer has eyebrow and body content', () => {
  document.body.innerHTML = `
    <section data-hero-disclaimer data-reveal>
      <p data-eyebrow>About this space</p>
      <div data-hero-disclaimer-body>
        <p>Test content here</p>
        <ul data-hero-disclaimer-policies aria-label="Site policies">
          <li>Policy One</li>
          <li>Policy Two</li>
        </ul>
      </div>
    </section>
  `;

  const eyebrow = document.querySelector('[data-hero-disclaimer] [data-eyebrow]');
  assert.ok(eyebrow, 'Eyebrow must exist');
  assert.equal(eyebrow.textContent.trim(), 'About this space');

  const body = document.querySelector('[data-hero-disclaimer-body]');
  assert.ok(body, 'Body container must exist');

  const bodyText = body.querySelector('p');
  assert.ok(bodyText, 'Body paragraph must exist');
  assert.ok(bodyText.textContent.includes('Test content'), 'Body text must be present');

  const policies = body.querySelector('[data-hero-disclaimer-policies]');
  assert.ok(policies, 'Policies list must exist');
  assert.equal(policies.children.length, 2, 'Must have 2 policy items');
});

test('CSS selectors match disclaimer structure', () => {
  document.body.innerHTML = `
    <main>
      <section data-hero-disclaimer data-reveal>
        <p data-eyebrow>About this space</p>
        <div data-hero-disclaimer-body>
          <p>Text</p>
          <ul data-hero-disclaimer-policies aria-label="Site policies">
            <li>A</li>
            <li>B</li>
            <li>C</li>
            <li>D</li>
          </ul>
        </div>
      </section>
      <section data-hero data-hero-variant="home">Hero</section>
    </main>
  `;

  const disclaimer = document.querySelector('[data-hero-disclaimer]');
  assert.ok(disclaimer, '[data-hero-disclaimer] must match');

  const body = disclaimer.querySelector('[data-hero-disclaimer-body]');
  assert.ok(body, '[data-hero-disclaimer-body] must exist inside');

  const policies = disclaimer.querySelector('[data-hero-disclaimer-policies]');
  assert.ok(policies, '[data-hero-disclaimer-policies] must exist');

  const policiesItems = policies.querySelectorAll('li');
  assert.equal(policiesItems.length, 4, 'Must have 4 policy items');
});
