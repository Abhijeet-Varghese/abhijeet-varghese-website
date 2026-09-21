import assert from 'node:assert/strict';
import React, { act } from 'react';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!doctype html><html class="js"><body class="home-arena home-react"><div id="root"></div></body></html>', {
  url: 'https://abhijeetvarghese.com/?utm_source=smoke',
  pretendToBeVisual: true,
});
const { window } = dom;

class Observer {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}

Object.assign(globalThis, {
  window,
  document: window.document,
  Element: window.Element,
  Node: window.Node,
  HTMLElement: window.HTMLElement,
  HTMLButtonElement: window.HTMLButtonElement || HTMLElement,
  HTMLFormElement: window.HTMLFormElement,
  HTMLInputElement: window.HTMLInputElement,
  HTMLTextAreaElement: window.HTMLTextAreaElement,
  HTMLAnchorElement: window.HTMLAnchorElement,
  MutationObserver: window.MutationObserver,
  Event: window.Event,
  MouseEvent: window.MouseEvent,
  KeyboardEvent: window.KeyboardEvent,
  location: window.location,
  localStorage: window.localStorage,
  IntersectionObserver: Observer,
  ResizeObserver: Observer,
});
Object.defineProperty(globalThis, 'navigator', { value: window.navigator, writable: true, configurable: true });

Object.assign(window, {
  IntersectionObserver: Observer,
  ResizeObserver: Observer,
  matchMedia: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => undefined,
    removeListener: () => undefined,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    dispatchEvent: () => false,
  }),
  requestAnimationFrame: () => 1,
  cancelAnimationFrame: () => undefined,
  scrollTo: () => undefined,
});

Object.defineProperty(window.document, 'fonts', { value: { ready: Promise.resolve() }, configurable: true });
Object.defineProperty(window.HTMLElement.prototype, 'scrollIntoView', { value: () => undefined, configurable: true });
Object.defineProperty(globalThis, 'requestAnimationFrame', { value: window.requestAnimationFrame, configurable: true });
Object.defineProperty(globalThis, 'cancelAnimationFrame', { value: window.cancelAnimationFrame, configurable: true });

const requests: Array<{ url: string; body: unknown }> = [];
const fetchMock: typeof fetch = async (input, init) => {
  const url = String(input);
  const body = init?.body ? JSON.parse(String(init.body)) : null;
  requests.push({ url, body });
  const result = url === '/api/public/lead'
    ? { data: { owner_email_sent: true, visitor_email_sent: true } }
    : { data: { visitor_id: 'smoke-visitor' } };
  return new Response(JSON.stringify(result), { status: 200, headers: { 'Content-Type': 'application/json' } });
};
Object.defineProperty(globalThis, 'fetch', { value: fetchMock, configurable: true });
Object.defineProperty(window, 'fetch', { value: fetchMock, configurable: true });

const flush = async () => {
  await Promise.resolve();
  await new Promise((resolve) => setTimeout(resolve, 25));
  await Promise.resolve();
};

const { createRoot } = await import('react-dom/client');
const { default: App } = await import('../src/App');

const container = document.getElementById('root');
assert(container, 'React root must exist.');
const root = createRoot(container);
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
await act(async () => {
  root.render(<App />);
  await flush();
});

assert.equal(document.querySelectorAll('main > section, main > .hp-hero').length, 9, 'all homepage sections render');
assert.equal(document.querySelectorAll('.case').length, 3, 'all Featured Work cases render');
assert.equal(document.querySelectorAll('.chapter__num, .cap__num, .essay__num, .era__index, .journey__counter, .focus__num').length, 0, 'section-number DOM is removed');
assert.equal(document.body.textContent?.includes('Final chapter'), false, 'Final Chapter label is absent');
assert(document.querySelector('footer.footer--arena'), 'real footer remains');
assert.match(document.querySelector('.case__panel picture')?.getAttribute('style') ?? '', /transform: none !important/, 'work thumbnail receives an explicit lock');

const menuToggle = document.getElementById('navToggle') as HTMLButtonElement;
const mobileMenu = document.getElementById('mobileMenu') as HTMLElement;
menuToggle.click();
await flush();
assert.equal(menuToggle.getAttribute('aria-expanded'), 'true', 'mobile navigation opens accessibly');
assert.equal(mobileMenu.hidden, false, 'mobile navigation is exposed when opened');
(document.getElementById('mobileClose') as HTMLButtonElement).click();
assert.equal(menuToggle.getAttribute('aria-expanded'), 'false', 'mobile navigation closes accessibly');

const form = document.getElementById('contactForm') as HTMLFormElement;
assert(form, 'booking form renders');
form.dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
await flush();
assert(document.getElementById('cfName')?.classList.contains('is-invalid'), 'name validation runs');
assert(document.getElementById('cfEmail')?.classList.contains('is-invalid'), 'email validation runs');
assert(document.getElementById('cfPhoneWrap')?.classList.contains('is-invalid'), 'phone validation runs');

const input = (id: string, value: string) => {
  const element = document.getElementById(id) as HTMLInputElement;
  element.value = value;
  element.dispatchEvent(new window.Event('input', { bubbles: true }));
};
input('cfName', 'Smoke Test');
input('cfEmail', 'smoke@example.com');
input('cfMobile', '9694080706');
(document.getElementById('dateTrigger') as HTMLButtonElement).click();
await flush();
const futureDate = Array.from(document.querySelectorAll<HTMLButtonElement>('#dpGrid .dp-day')).find((button) => !button.disabled);
assert(futureDate, 'calendar exposes a future selectable date');
futureDate.click();
(document.querySelector<HTMLButtonElement>('.tslot[data-slot="10:30"]') as HTMLButtonElement).click();
form.dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
await flush();

const lead = requests.find((request) => request.url === '/api/public/lead');
assert(lead, 'valid booking sends the documented lead API request');
assert.equal((lead.body as { name: string }).name, 'Smoke Test', 'lead API receives entered name');
assert.equal(document.getElementById('bookView')?.hidden, true, 'success view hides booking form');
assert.equal(document.getElementById('bookDone')?.hidden, false, 'success view is shown');

await act(async () => {
  root.unmount();
  await flush();
});
console.log(`Homepage smoke test passed: rendered content, intentional removals, thumbnail lock, validation, and lead submission (${requests.length} mocked API calls).`);
