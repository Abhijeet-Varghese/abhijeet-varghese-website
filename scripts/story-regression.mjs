import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { chromium } from 'playwright-core';

const baseUrl = new URL(process.env.STORY_TEST_URL ?? 'http://127.0.0.1:4173/story/');
const chromiumPath = process.env.CHROMIUM_PATH ?? '/usr/bin/chromium';

if (!existsSync(chromiumPath)) {
  throw new Error(`Chromium was not found at ${chromiumPath}. Set CHROMIUM_PATH to a Chromium executable.`);
}

const wait = (milliseconds) => new Promise((resolveWait) => setTimeout(resolveWait, milliseconds));

async function previewIsReady() {
  try {
    const response = await fetch(baseUrl, { signal: AbortSignal.timeout(1500) });
    return response.ok;
  } catch {
    return false;
  }
}

async function ensurePreview() {
  if (await previewIsReady()) return null;
  if (process.env.STORY_TEST_URL) throw new Error(`Story test server is unavailable at ${baseUrl.href}`);
  if (!existsSync(resolve('dist/story/index.html'))) throw new Error('Build output is missing. Run npm run build before test:story.');

  const viteCli = resolve('node_modules/vite/bin/vite.js');
  const preview = spawn(process.execPath, [viteCli, 'preview', '--host', '127.0.0.1', '--port', '4173', '--strictPort'], {
    cwd: process.cwd(),
    stdio: 'ignore',
  });
  for (let attempt = 0; attempt < 50; attempt += 1) {
    if (await previewIsReady()) return preview;
    await wait(100);
  }
  preview.kill('SIGTERM');
  throw new Error('Timed out while starting the production preview for Story regression.');
}

async function waitForStory(page) {
  await page.waitForFunction(() => document.getElementById('avLoader') === null, undefined, { timeout: 5000 });
  await page.waitForFunction(() => document.querySelectorAll('.about-evo3d__card').length === 8, undefined, { timeout: 5000 });
}

async function instantScroll(page, top) {
  await page.evaluate((nextTop) => {
    const root = document.scrollingElement;
    if (!root) return;
    const previous = root.style.scrollBehavior;
    root.style.scrollBehavior = 'auto';
    root.scrollTop = nextTop;
    root.style.scrollBehavior = previous;
  }, top);
  await page.waitForTimeout(300);
}

async function testDesktop(browser) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  const page = await context.newPage();
  const analytics = [];
  const pageErrors = [];
  page.on('request', (request) => {
    if (request.url().includes('/api/analytics/track')) analytics.push(request.postDataJSON());
  });
  page.on('pageerror', (error) => pageErrors.push(error.message));

  const response = await page.goto(baseUrl.href, { waitUntil: 'networkidle' });
  assert.equal(response?.status(), 200, 'Story direct navigation did not return 200');
  await waitForStory(page);
  await page.waitForTimeout(80);

  const initial = await page.evaluate(() => ({
    body: document.body.className,
    title: document.title,
    canonical: document.querySelector('link[rel="canonical"]')?.getAttribute('href'),
    h1: document.querySelectorAll('h1').length,
    cards: document.querySelectorAll('.about-evo3d__card').length,
    images: document.querySelectorAll('.about-evo3d__image').length,
    rootWidth: document.documentElement.scrollWidth,
    viewportWidth: window.innerWidth,
    legacyRuntime: Array.from(document.scripts).some((script) => /\/js\/(?:main|elevate|mobile-chrome)\.js/.test(script.src)),
    brandCurrent: document.querySelector('.brand')?.getAttribute('aria-current'),
    storyCurrent: document.querySelector('.nav-links a[href="/story/"]')?.getAttribute('aria-current'),
  }));
  assert.equal(initial.body, 'about-page about-films mobile-chrome', 'Story body class contract drifted');
  assert.equal(initial.title, 'About — Abhijeet Varghese, Experience Designer', 'Story title drifted');
  assert.equal(initial.canonical, 'https://abhijeetvarghese.com/story/', 'Story canonical is not clean-route canonical');
  assert.equal(initial.h1, 1, 'Story must retain exactly one H1');
  assert.deepEqual({ cards: initial.cards, images: initial.images }, { cards: 8, images: 6 }, 'Story evolution content drifted');
  assert.equal(initial.rootWidth, initial.viewportWidth, 'Story has desktop horizontal overflow');
  assert.equal(initial.legacyRuntime, false, 'Story still loads the legacy runtime');
  assert.equal(initial.brandCurrent, null, 'Story incorrectly marks the home brand as current');
  assert.equal(initial.storyCurrent, 'page', 'Story desktop navigation has no active item');
  assert.equal(analytics.filter((entry) => entry?.event_type === 'pageview').length, 1, 'Story emitted duplicate initial page views');

  const runway = await page.evaluate(() => {
    const element = document.querySelector('.about-evo3d__scroll');
    if (!(element instanceof HTMLElement)) return null;
    return { top: element.getBoundingClientRect().top + window.scrollY, scrollable: element.offsetHeight - window.innerHeight };
  });
  assert(runway, 'Story evolution runway is missing');
  await instantScroll(page, runway.top + runway.scrollable * 0.54);
  await page.waitForTimeout(850);
  const motion = await page.evaluate(() => {
    const card = document.querySelector('.about-evo3d__card[data-act="05"]');
    return {
      active: Array.from(document.querySelectorAll('.about-evo3d__card.is-front')).map((element) => element.getAttribute('data-act')),
      transform: card instanceof HTMLElement ? card.style.transform : '',
      atmosphere: Array.from(document.querySelectorAll('#aboutAtmo .is-on')).map((layer) => layer instanceof HTMLElement ? layer.dataset.atmo : ''),
    };
  });
  assert.deepEqual(motion.active, ['05'], 'Story evolution did not activate the expected act at runway progress');
  assert.match(motion.transform, /^translate3d\(/, 'Story evolution has no direct 3D transform choreography');
  assert.deepEqual(motion.atmosphere, ['people'], 'Story atmosphere did not follow the active act');

  await page.evaluate(() => document.getElementById('aboutCompassBtn')?.dispatchEvent(new MouseEvent('click', { bubbles: true })));
  await page.waitForTimeout(70);
  const compassOpen = await page.evaluate(() => ({
    expanded: document.getElementById('aboutCompassBtn')?.getAttribute('aria-expanded'),
    hidden: document.getElementById('aboutCompassList')?.hidden,
  }));
  assert.deepEqual(compassOpen, { expanded: 'true', hidden: false }, 'Story compass did not open accessibly');
  await page.evaluate(() => document.querySelector('#aboutCompassList button[data-act="04"]')?.click());
  await page.waitForTimeout(900);
  const compassSelection = await page.evaluate(() => ({
    expanded: document.getElementById('aboutCompassBtn')?.getAttribute('aria-expanded'),
    label: document.getElementById('aboutCompassBtn')?.textContent?.replace(/\s+/g, ''),
    active: Array.from(document.querySelectorAll('.about-evo3d__card.is-front')).map((card) => card.getAttribute('data-act')),
  }));
  assert.equal(compassSelection.expanded, 'false', 'Story compass did not close after selection');
  assert.equal(compassSelection.label, '04Experience▾', 'Story compass label did not update after selection');
  assert.deepEqual(compassSelection.active, ['04'], 'Story compass selection did not move the runway');
  assert.equal(pageErrors.length, 0, `Story emitted page errors: ${pageErrors.join('; ')}`);

  await context.close();
}

async function testMobile(browser) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  const page = await context.newPage();
  await page.goto(baseUrl.href, { waitUntil: 'networkidle' });
  await waitForStory(page);
  await page.locator('#navToggle').click();
  await page.waitForTimeout(560);
  const open = await page.evaluate(() => {
    const menu = document.getElementById('mobileMenu');
    const panel = menu?.querySelector('nav')?.getBoundingClientRect();
    const footerInner = document.querySelector('.footer--arena .footer__inner');
    const finalChapter = footerInner ? getComputedStyle(footerInner, '::before') : null;
    return {
      expanded: document.getElementById('navToggle')?.getAttribute('aria-expanded'),
      focus: document.activeElement?.id,
      hidden: menu?.hidden,
      panel: panel ? { width: panel.width, height: panel.height, bottom: panel.bottom } : null,
      destinations: Array.from(menu?.querySelectorAll('.mobile-menu__list a') ?? []).map((link) => link.textContent?.trim()),
      ordinals: menu?.querySelectorAll('.mobile-menu__ordinal, .mobile-menu__list em').length,
      current: menu?.querySelector('a[aria-current="page"]')?.textContent?.trim(),
      finalChapter: { content: finalChapter?.content, display: finalChapter?.display },
    };
  });
  assert.equal(open.expanded, 'true', 'Mobile Story menu did not open');
  assert.equal(open.focus, 'mobileClose', 'Mobile Story menu did not move focus to close');
  assert.equal(open.hidden, false, 'Mobile Story menu is hidden after open');
  assert.deepEqual(open.destinations, ['Story', 'Experience', 'Case Studies', 'Portfolio'], 'Mobile Story menu destinations drifted');
  assert.equal(open.ordinals, 0, 'Mobile Story menu reintroduced numbering');
  assert.equal(open.current, 'Story', 'Mobile Story menu has no active item');
  assert.deepEqual(open.finalChapter, { content: 'none', display: 'none' }, 'Mobile Story still renders the Final Chapter footer cue');
  assert(open.panel && open.panel.width < 390 && open.panel.height < 844 * 0.9 && open.panel.bottom <= 844, 'Mobile Story menu is not a bottom-sheet card');
  await page.keyboard.press('Escape');
  await page.waitForFunction(() => document.getElementById('mobileMenu')?.hidden === true, undefined, { timeout: 1000 });
  assert.equal(await page.evaluate(() => document.activeElement?.id), 'navToggle', 'Mobile Story menu did not restore focus on Escape');
  await context.close();
}

async function testReducedMotion(browser) {
  const context = await browser.newContext({ viewport: { width: 768, height: 1024 }, reducedMotion: 'reduce' });
  const page = await context.newPage();
  await page.goto(baseUrl.href, { waitUntil: 'networkidle' });
  await waitForStory(page);
  const reduced = await page.evaluate(() => ({
    body: document.body.className,
    cards: Array.from(document.querySelectorAll('.about-evo3d__card')).map((card) => {
      if (!(card instanceof HTMLElement)) return null;
      const style = getComputedStyle(card);
      return { position: style.position, visibility: style.visibility, opacity: style.opacity, transform: style.transform };
    }),
  }));
  assert.match(reduced.body, /arena-reduce/, 'Story did not expose the shared reduced-motion class');
  assert.match(reduced.body, /about-reduce/, 'Story did not expose its reduced-motion class');
  assert(reduced.cards.every((card) => card && card.position === 'static' && card.visibility === 'visible' && card.opacity === '1' && card.transform === 'none'), 'Reduced-motion Story cards did not become static readable content');
  await context.close();
}

async function testRouting(browser) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  const shortPath = new URL('/story', baseUrl.origin).href;
  const shortResponse = await page.request.get(shortPath, { maxRedirects: 0 });
  assert.equal(shortResponse.status(), 301, 'Short Story URL does not redirect to the trailing slash');
  assert.equal(shortResponse.headers().location, '/story/', 'Short Story URL redirects to the wrong route');
  const legacyResponse = await page.request.get(new URL('/story.html', baseUrl.origin).href, { maxRedirects: 0 });
  assert.equal(legacyResponse.status(), 301, 'Legacy Story HTML URL does not redirect to the clean route');
  assert.equal(legacyResponse.headers().location, '/story/', 'Legacy Story HTML URL redirects to the wrong route');

  const homeUrl = new URL('/', baseUrl.origin).href;
  await page.goto(homeUrl, { waitUntil: 'networkidle' });
  await page.locator('.nav-links a[href="/story/"]').click();
  await page.waitForURL(baseUrl.href);
  await waitForStory(page);
  await page.goBack({ waitUntil: 'networkidle' });
  assert.equal(page.url(), homeUrl, 'Browser Back did not return from Story to home');
  await page.goForward({ waitUntil: 'networkidle' });
  assert.equal(page.url(), baseUrl.href, 'Browser Forward did not return to Story');
  await page.locator('[data-history-close]').click();
  await page.waitForURL(homeUrl);
  assert.equal(page.url(), homeUrl, 'Same-site Story page-close did not use history');

  await page.goto(baseUrl.href, { waitUntil: 'networkidle' });
  await waitForStory(page);
  await page.locator('[data-history-close]').click();
  await page.waitForURL(homeUrl);
  assert.equal(page.url(), homeUrl, 'Direct Story page-close did not fall back to home');
  await context.close();
}

const preview = await ensurePreview();
let browser;
try {
  browser = await chromium.launch({ executablePath: chromiumPath, headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  await testDesktop(browser);
  await testMobile(browser);
  await testReducedMotion(browser);
  await testRouting(browser);
  console.log('Story regression passed: desktop choreography, compass, mobile sheet, reduced motion, SEO route, analytics, and close behavior verified.');
} finally {
  await browser?.close();
  preview?.kill('SIGTERM');
}
