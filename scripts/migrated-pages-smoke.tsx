import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import React, { act } from 'react';
import { JSDOM } from 'jsdom';

class Observer {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}

const requests: Array<{ path: string; eventType?: string; content?: string }> = [];
const fetchMock: typeof fetch = async (_input, init) => {
  const payload = init?.body ? JSON.parse(String(init.body)) as { path?: string; event_type?: string; content?: string } : {};
  requests.push({ path: payload.path ?? '', eventType: payload.event_type, content: payload.content });
  return {
    json: async () => ({ data: { visitor_id: 'migrated-page-smoke' } }),
  } as Response;
};

function installDom(path: string, bodyClass: string): JSDOM {
  const dom = new JSDOM(`<!doctype html><html class="js"><body class="${bodyClass}"><div id="root"></div></body></html>`, {
    url: `https://abhijeetvarghese.com${path}`,
    pretendToBeVisual: true,
  });
  const { window } = dom;
  const matchMedia = (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => undefined,
    removeListener: () => undefined,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    dispatchEvent: () => false,
  });
  const requestAnimationFrame = (callback: FrameRequestCallback) => {
    callback(Date.now());
    return 1;
  };

  Object.assign(globalThis, {
    window,
    document: window.document,
    Element: window.Element,
    Node: window.Node,
    HTMLElement: window.HTMLElement,
    HTMLButtonElement: window.HTMLButtonElement,
    HTMLAnchorElement: window.HTMLAnchorElement,
    HTMLVideoElement: window.HTMLVideoElement,
    MutationObserver: window.MutationObserver,
    Event: window.Event,
    MouseEvent: window.MouseEvent,
    KeyboardEvent: window.KeyboardEvent,
    location: window.location,
    localStorage: window.localStorage,
    navigator: window.navigator,
    IntersectionObserver: Observer,
    ResizeObserver: Observer,
    requestAnimationFrame,
    cancelAnimationFrame: () => undefined,
    fetch: fetchMock,
  });
  Object.assign(window, {
    IntersectionObserver: Observer,
    ResizeObserver: Observer,
    matchMedia,
    requestAnimationFrame,
    cancelAnimationFrame: () => undefined,
    scrollTo: () => undefined,
    fetch: fetchMock,
  });
  Object.defineProperty(window.document, 'fonts', { value: { ready: Promise.resolve() }, configurable: true });
  Object.defineProperty(window.HTMLElement.prototype, 'scrollIntoView', { value: () => undefined, configurable: true });
  Object.defineProperty(globalThis, 'IS_REACT_ACT_ENVIRONMENT', { value: true, configurable: true });
  return dom;
}

const flush = async () => {
  await Promise.resolve();
  await new Promise((resolve) => setTimeout(resolve, 20));
  await Promise.resolve();
};

function normalText(element: Element): string {
  return (element.textContent ?? '').replace(/\s+/g, ' ').trim();
}

function textsWithin(element: ParentNode, selector: string): string[] {
  return Array.from(element.querySelectorAll(selector)).map((node) => normalText(node));
}

function hrefsWithin(element: Element): string[] {
  return Array.from(element.querySelectorAll<HTMLAnchorElement>('a')).map((link) => link.getAttribute('href') ?? '');
}

const experienceDom = installDom('/experience/?utm_source=smoke', 'experience-page mobile-chrome');
const { createRoot } = await import('react-dom/client');
const { default: ExperienceApp } = await import('../src/ExperienceApp');
const { default: CaseStudiesApp } = await import('../src/CaseStudiesApp');

const experienceRootElement = document.getElementById('root');
assert(experienceRootElement, 'Experience React mount target is missing.');
const experienceRoot = createRoot(experienceRootElement);
await act(async () => {
  experienceRoot.render(<ExperienceApp />);
  await flush();
});

assert.equal(document.querySelectorAll('#main > section').length, 3, 'Experience retains its hero, role record, and closing sections.');
assert.equal(document.querySelectorAll('h1').length, 1, 'Experience must retain exactly one H1.');
assert.equal(document.querySelectorAll('.exp-job').length, 6, 'Experience must retain all six roles.');
assert.equal(document.querySelectorAll('.exp-job--lead').length, 1, 'Experience leading role marker drifted.');
assert.equal(document.querySelectorAll('.exp-job--last').length, 1, 'Experience final role marker drifted.');
assert.equal(document.querySelectorAll('#main img, #main figure').length, 0, 'Experience must not retain image elements or media wrappers.');
assert.equal(document.querySelector('.nav-links a[href="/experience/"]')?.getAttribute('aria-current'), 'page', 'Experience active desktop navigation is missing.');
assert.equal(document.querySelector('.mobile-menu a[href="/experience/"]')?.getAttribute('aria-current'), 'page', 'Experience active mobile navigation is missing.');
const legacyExperienceDocument = new JSDOM(readFileSync(new URL('../abhijeetvarghese/experience/index.html', import.meta.url), 'utf8')).window.document;
for (const selector of ['.exp-hero__title', '.exp-hero__lede', '.exp-hero__meta', '.exp-closing h2', '.exp-closing p']) {
  assert.deepEqual(textsWithin(document, `#main ${selector}`), textsWithin(legacyExperienceDocument, `main ${selector}`), `Experience text drifted at ${selector}.`);
}
const renderedJobs = Array.from(document.querySelectorAll('#main .exp-job'));
const legacyJobs = Array.from(legacyExperienceDocument.querySelectorAll('main .exp-job'));
assert.equal(renderedJobs.length, legacyJobs.length, 'Experience role count drifted from the golden master.');
for (const [index, legacyJob] of legacyJobs.entries()) {
  const renderedJob = renderedJobs[index];
  for (const selector of ['.exp-job__date', '.exp-job__role', '.exp-job__role-sub', '.exp-job__company', '.exp-job__summary', '.exp-job__disc', '.exp-job__list']) {
    assert.deepEqual(textsWithin(renderedJob, selector), textsWithin(legacyJob, selector), `Experience role ${index + 1} drifted at ${selector}.`);
  }
}
assert.deepEqual(hrefsWithin(document.getElementById('main') as Element), hrefsWithin(legacyExperienceDocument.getElementById('main') as Element), 'Experience crawlable links drifted from the golden master.');
assert.equal(document.querySelectorAll('#main [data-reveal]').length, legacyExperienceDocument.querySelectorAll('main [data-reveal]').length - 2, 'Experience should remove only the two former image reveal targets.');

const firstMore = document.querySelector<HTMLButtonElement>('.exp-job__more');
const firstMoreList = document.getElementById('exp-more-0');
assert(firstMore && firstMoreList, 'Experience first responsibility expansion is missing.');
assert.equal(firstMore.textContent?.replace(/\s+/g, ' ').trim(), 'View all 12 responsibilities +', 'Experience responsibility count label drifted.');
firstMore.click();
await flush();
assert.equal(firstMore.getAttribute('aria-expanded'), 'true', 'Experience responsibilities do not expose expanded state.');
assert.equal(firstMoreList.hidden, false, 'Experience expanded responsibilities remain hidden.');
assert.equal(firstMore.textContent?.replace(/\s+/g, ' ').trim(), 'Show fewer responsibilities +', 'Experience expanded label drifted.');
firstMore.click();
await flush();
assert.equal(firstMore.getAttribute('aria-expanded'), 'false', 'Experience responsibilities do not restore collapsed state.');
assert.equal(firstMoreList.hidden, true, 'Experience collapsed responsibilities remain visible.');

const experienceMenuToggle = document.getElementById('navToggle') as HTMLButtonElement;
const experienceMenu = document.getElementById('mobileMenu');
experienceMenuToggle.click();
await flush();
assert.equal(experienceMenuToggle.getAttribute('aria-expanded'), 'true', 'Experience shared mobile menu does not open.');
assert.equal(experienceMenu?.hidden, false, 'Experience shared mobile menu stays hidden when opened.');
experienceMenuToggle.click();
await flush();
assert.equal(experienceMenuToggle.getAttribute('aria-expanded'), 'false', 'Experience shared mobile menu does not close.');
assert(requests.some((request) => request.path === '/experience/' && request.eventType === 'project_view'), 'Experience analytics lost its project-view event.');

await act(async () => {
  experienceRoot.unmount();
  await flush();
});
experienceDom.window.close();

const caseDom = installDom('/case-studies/?utm_medium=smoke', 'mobile-chrome');
const caseRootElement = document.getElementById('root');
assert(caseRootElement, 'Case Studies React mount target is missing.');
const caseRoot = createRoot(caseRootElement);
await act(async () => {
  caseRoot.render(<CaseStudiesApp />);
  await flush();
});

assert.equal(document.querySelectorAll('#main > section').length, 2, 'Case Studies retains its hero and ordered listing sections.');
assert.equal(document.querySelectorAll('h1').length, 1, 'Case Studies must retain exactly one H1.');
assert.equal(document.querySelectorAll('.cx-item').length, 3, 'Case Studies must retain all three cards.');
assert.equal(document.querySelectorAll('.cx-fig picture source[type="image/avif"]').length, 3, 'Case Studies AVIF source pairs drifted.');
assert.equal(document.querySelectorAll('#main [data-parallax]').length, 0, 'Case Studies thumbnails must not opt into shared image translation.');
assert(Array.from(document.querySelectorAll<HTMLElement>('#main .cx-par img')).every((image) => image.style.transform === '' && image.style.scale === ''), 'Case Studies thumbnails received an inline motion transform.');
assert.deepEqual(
  Array.from(document.querySelectorAll<HTMLAnchorElement>('.cx-fig')).map((link) => link.getAttribute('href')),
  ['/case-studies/orange-business/', '/case-studies/bharat-petroleum-corporation-limited/', '/case-studies/indian-army/'],
  'Case Studies detail-page links drifted.',
);
assert.equal(document.querySelector('.nav-links a[href="/case-studies/"]')?.getAttribute('aria-current'), 'page', 'Case Studies active desktop navigation is missing.');
assert.equal(document.querySelector('.mobile-menu a[href="/case-studies/"]')?.getAttribute('aria-current'), 'page', 'Case Studies active mobile navigation is missing.');
assert.equal(document.querySelector<HTMLAnchorElement>('.cx-close__actions a[href^="mailto:"]')?.textContent?.trim(), 'Request a deeper look', 'Case Studies closing email CTA drifted.');
const legacyCaseStudiesDocument = new JSDOM(readFileSync(new URL('../abhijeetvarghese/case-studies/index.html', import.meta.url), 'utf8')).window.document;
for (const selector of ['.page-hero__title', '.page-hero__lede', '.hero-notes li', '.cx-hinge__tag', '.cx-hinge__q', '.cx-hinge__p', '.cx-close__eyebrow', '.cx-close__head', '.cx-close__copy p']) {
  assert.deepEqual(textsWithin(document, `#main ${selector}`), textsWithin(legacyCaseStudiesDocument, `main ${selector}`), `Case Studies text drifted at ${selector}.`);
}
const renderedStudies = Array.from(document.querySelectorAll('#main .cx-item'));
const legacyStudies = Array.from(legacyCaseStudiesDocument.querySelectorAll('main .cx-item'));
assert.equal(renderedStudies.length, legacyStudies.length, 'Case Studies card count drifted from the golden master.');
for (const [index, legacyStudy] of legacyStudies.entries()) {
  const renderedStudy = renderedStudies[index];
  for (const selector of ['.cx-cat', '.cx-name', '.cx-project', '.cx-statement', '.cx-desc', '.cx-work']) {
    assert.deepEqual(textsWithin(renderedStudy, selector), textsWithin(legacyStudy, selector), `Case Studies card ${index + 1} drifted at ${selector}.`);
  }
}
assert.deepEqual(hrefsWithin(document.getElementById('main') as Element), hrefsWithin(legacyCaseStudiesDocument.getElementById('main') as Element), 'Case Studies crawlable links drifted from the golden master.');
assert.equal(document.querySelectorAll('#main [data-reveal]').length, legacyCaseStudiesDocument.querySelectorAll('main [data-reveal]').length, 'Case Studies reveal target count drifted.');
assert(requests.some((request) => request.path === '/case-studies/' && request.eventType === 'case_study_view' && request.content === '/case-studies/'), 'Case Studies analytics lost its listing-view event.');

await act(async () => {
  caseRoot.unmount();
  await flush();
});
caseDom.window.close();

console.log(`Migrated-page smoke test passed: Experience timeline/expansion/chrome and Case Studies cards/parallax/links/analytics rendered (${requests.length} mocked analytics calls).`);
