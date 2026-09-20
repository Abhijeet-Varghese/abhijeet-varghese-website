import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { chromium } from 'playwright-core';

const baseUrl = process.env.MOBILE_TEST_URL ?? 'http://127.0.0.1:4173/';
const chromiumPath = process.env.CHROMIUM_PATH ?? '/usr/bin/chromium';
const viewports = [
  { width: 320, height: 568 },
  { width: 360, height: 640 },
  { width: 375, height: 667 },
  { width: 390, height: 844 },
  { width: 393, height: 852 },
  { width: 414, height: 896 },
  { width: 430, height: 932 },
  { width: 480, height: 1040 },
  { width: 540, height: 720 },
];

if (!existsSync(chromiumPath)) {
  throw new Error(`Chromium was not found at ${chromiumPath}. Set CHROMIUM_PATH to a Chromium executable.`);
}

const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

async function previewIsReady() {
  try {
    const response = await fetch(baseUrl, { signal: AbortSignal.timeout(1500) });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * The test works against an already-running preview (useful while developing),
 * but starts and tears down its own production preview in a clean checkout.
 */
async function ensurePreview() {
  if (await previewIsReady()) return null;
  if (process.env.MOBILE_TEST_URL) {
    throw new Error(`Mobile test server is unavailable at MOBILE_TEST_URL=${baseUrl}`);
  }
  if (!existsSync(resolve('dist/index.html'))) {
    throw new Error('Build output is missing. Run npm run build before test:mobile-scroll.');
  }

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
  throw new Error('Timed out while starting the production preview for mobile scroll regression.');
}

async function instantScroll(page, top) {
  await page.evaluate((nextTop) => {
    window.scrollTo({ top: nextTop, left: 0, behavior: 'instant' });
  }, top);
  await page.waitForTimeout(110);
}

async function state(page) {
  return page.evaluate(() => {
    const nav = document.getElementById('siteNav');
    const navInner = nav?.querySelector('.site-nav__inner');
    const menu = document.getElementById('mobileMenu');
    const stage = document.querySelector('.work-stage');
    const film = document.getElementById('workFilm');
    const cases = Array.from(document.querySelectorAll('.case'));
    return {
      y: window.scrollY,
      maxY: Math.max(document.documentElement.scrollHeight - window.innerHeight, 0),
      navHidden: nav?.classList.contains('nav-hidden') ?? false,
      navTransform: navInner instanceof HTMLElement ? getComputedStyle(navInner).transform : '',
      menuOpen: menu instanceof HTMLElement ? !menu.hidden : false,
      menuExpanded: document.getElementById('navToggle')?.getAttribute('aria-expanded'),
      documentWidth: document.documentElement.scrollWidth,
      bodyWidth: document.body.scrollWidth,
      viewportWidth: window.innerWidth,
      stageTop: stage instanceof HTMLElement ? stage.getBoundingClientRect().top : Number.NaN,
      stageOverflow: stage instanceof HTMLElement ? getComputedStyle(stage).overflow : '',
      filmTransform: film instanceof HTMLElement ? film.style.transform : '',
      activeCases: cases.filter((caseElement) => caseElement.classList.contains('is-active')).length,
      activeIndex: cases.findIndex((caseElement) => caseElement.classList.contains('is-active')),
      hud: document.getElementById('workHudNum')?.textContent ?? '',
      work: window.__avWork?.(),
    };
  });
}

/** Dispatch a genuine CDP touch gesture rather than a programmatic scroll. */
async function swipe(page, client, { from, to, duration, x }) {
  const before = await page.evaluate(() => window.scrollY);
  const points = Math.max(4, Math.ceil(duration / 16));
  await client.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [{ x, y: from, id: 1 }],
  });
  for (let index = 1; index <= points; index += 1) {
    await client.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [{ x, y: from + ((to - from) * index) / points, id: 1 }],
    });
    await wait(duration / points);
  }
  await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await page.waitForTimeout(Math.max(140, Math.min(300, duration / 2)));
  const after = await page.evaluate(() => window.scrollY);
  return { before, after, delta: after - before };
}

function assertVerticalMove(result, direction, label, viewport) {
  const minimum = Math.max(12, Math.min(42, viewport.height * 0.07));
  if (direction === 'down') {
    assert(result.delta > minimum, `${label}: downward touch did not move the page (${result.delta}px)`);
  } else {
    assert(result.delta < -minimum, `${label}: upward touch did not move the page (${result.delta}px)`);
  }
}

function assertNoHorizontalOverflow(current, label) {
  assert.equal(current.documentWidth, current.viewportWidth, `${label}: document has horizontal overflow`);
  assert.equal(current.bodyWidth, current.viewportWidth, `${label}: body has horizontal overflow`);
}

async function assertMobileArtworkFit(page, label) {
  await page.waitForFunction(() => {
    const image = document.querySelector('.case.is-active img');
    return image instanceof HTMLImageElement && image.complete && image.naturalWidth > 0;
  });
  const artwork = await page.evaluate(() => {
    const image = document.querySelector('.case.is-active img');
    const picture = image?.closest('picture');
    const panel = image?.closest('.case__panel');
    if (!(image instanceof HTMLImageElement) || !(picture instanceof HTMLElement) || !(panel instanceof HTMLElement)) return null;
    const imageRect = image.getBoundingClientRect();
    const pictureRect = picture.getBoundingClientRect();
    const panelRect = panel.getBoundingClientRect();
    return {
      naturalRatio: image.naturalWidth / image.naturalHeight,
      frameRatio: pictureRect.width / pictureRect.height,
      objectFit: getComputedStyle(image).objectFit,
      image: imageRect.toJSON(),
      picture: pictureRect.toJSON(),
      panel: panelRect.toJSON(),
      pictureTransform: picture.style.transform,
      workPx: picture.style.getPropertyValue('--work-px'),
    };
  });
  assert(artwork, `${label}: active Featured Work artwork is missing`);
  assert.equal(artwork.objectFit, 'cover', `${label}: mobile artwork must fill its exact-ratio frame`);
  assert(Math.abs(artwork.naturalRatio - artwork.frameRatio) < 0.003, `${label}: mobile artwork frame is not aspect-matched`);
  assert(Math.abs(artwork.image.width - artwork.picture.width) < 0.1, `${label}: mobile artwork leaves a horizontal picture gap`);
  assert(Math.abs(artwork.image.height - artwork.picture.height) < 0.1, `${label}: mobile artwork leaves a vertical picture gap`);
  // The visual thumbnail reaches the inside of the card on its top and both
  // sides. Its lower edge intentionally yields to the text plaque below.
  assert(Math.abs(artwork.picture.left - (artwork.panel.left + 1)) < 0.2, `${label}: mobile artwork leaves a left matte`);
  assert(Math.abs(artwork.picture.right - (artwork.panel.right - 1)) < 0.2, `${label}: mobile artwork leaves a right matte`);
  assert(Math.abs(artwork.picture.top - (artwork.panel.top + 1)) < 0.2, `${label}: mobile artwork leaves a top matte`);
  assert.equal(artwork.pictureTransform, 'none', `${label}: mobile artwork must remain locked to its case frame`);
  assert.equal(artwork.workPx, '', `${label}: legacy Featured Work artwork translation must remain disabled`);
}

async function testViewport(browser, viewport) {
  const context = await browser.newContext({
    viewport,
    deviceScaleFactor: 1,
    isMobile: true,
    hasTouch: true,
    colorScheme: 'dark',
    reducedMotion: 'no-preference',
  });
  const page = await context.newPage();
  const errors = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(`console: ${message.text()}`);
  });
  page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`));

  // The preview has no API server. Mock only analytics so real browser console
  // assertions continue to catch application/runtime errors.
  await page.route('**/api/analytics/track', (route) => route.fulfill({ status: 204 }));

  try {
    await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => typeof window.__avWork === 'function' && window.__avWork().pinned === true);
    await page.waitForFunction(() => (
      !document.documentElement.classList.contains('av-loading')
      && document.getElementById('hero')?.classList.contains('is-in')
    ), { timeout: 1500 });
    await page.waitForFunction(() => {
      const loader = document.getElementById('avLoader');
      return !(loader instanceof HTMLElement) || getComputedStyle(loader).opacity === '0';
    }, { timeout: 1000 });
    const loaderState = await page.evaluate(() => {
      const loader = document.getElementById('avLoader');
      return {
        blocking: document.documentElement.classList.contains('av-loading'),
        visible: loader instanceof HTMLElement && getComputedStyle(loader).opacity !== '0',
      };
    });
    assert.equal(loaderState.blocking, false, 'shared loader remained blocking after its hero handoff');
    assert.equal(loaderState.visible, false, 'shared loader remained visually over the hero after its handoff');
    await page.waitForTimeout(700);
    const client = await context.newCDPSession(page);
    const x = viewport.width / 2;
    const fingerDown = viewport.height * 0.82;
    const fingerUp = viewport.height * 0.18;

    let current = await state(page);
    assert.equal(current.y, 0, 'homepage should open at the top');
    assert.equal(current.navHidden, false, 'mobile chrome must be visible at the top');
    assert.equal(current.stageOverflow, 'clip', 'Featured Work stage must not create an internal hidden scroller');
    assertNoHorizontalOverflow(current, 'initial state');
    assert(current.work?.pinLength > 0, 'Featured Work pin choreography should remain armed');

    // Small corrections are deliberately below the mobile hysteresis threshold.
    const jitter = await swipe(page, client, {
      from: fingerDown,
      to: fingerDown - Math.max(12, viewport.height * 0.025),
      duration: 90,
      x,
    });
    assert(jitter.delta >= 0, 'small downward correction should not reverse the page');
    current = await state(page);
    assert.equal(current.navHidden, false, 'small correction must not flicker-hide mobile chrome');

    // Fast down / slow up establishes direction hiding and revealing.
    const fastDown = await swipe(page, client, { from: fingerDown, to: fingerUp, duration: 110, x });
    assertVerticalMove(fastDown, 'down', 'fast top-to-bottom swipe', viewport);
    await page.waitForTimeout(500);
    current = await state(page);
    assert.equal(current.navHidden, true, 'meaningful downward scroll must hide mobile chrome');
    assert.notEqual(current.navTransform, 'none', 'hidden chrome must animate out of the viewport');

    const slowUp = await swipe(page, client, { from: fingerUp, to: fingerDown, duration: 520, x });
    assertVerticalMove(slowUp, 'up', 'slow bottom-to-top swipe', viewport);
    await page.waitForTimeout(500);
    current = await state(page);
    assert.equal(current.navHidden, false, 'meaningful upward scroll must reveal mobile chrome');

    // Menu state is a hard stop for directional hiding, including a scroll event
    // that arrives while the document is intentionally locked by the dialog.
    await instantScroll(page, 0);
    await page.waitForTimeout(500);
    await page.locator('#navToggle').click();
    await page.waitForTimeout(100);
    current = await state(page);
    assert.equal(current.menuOpen, true, 'mobile menu should open');
    assert.equal(current.menuExpanded, 'true', 'menu toggle should expose its open state');
    assert.equal(current.navHidden, false, 'chrome must be visible while the menu is open');
    await page.waitForTimeout(500);
    const menuPanel = await page.evaluate(() => {
      const menu = document.getElementById('mobileMenu');
      const panel = menu?.querySelector('nav');
      const rect = panel?.getBoundingClientRect();
      return {
        destinations: Array.from(menu?.querySelectorAll('.mobile-menu__list a') ?? []).map((link) => link.textContent?.trim()),
        ordinalNodes: menu?.querySelectorAll('.mobile-menu__ordinal, .mobile-menu__list em').length ?? 0,
        numericText: /\b0[1-4]\b/.test(menu?.textContent ?? ''),
        dialogBackground: menu instanceof HTMLElement ? getComputedStyle(menu).backgroundColor : '',
        card: rect ? { width: rect.width, height: rect.height, bottom: rect.bottom } : null,
        viewport: { width: window.innerWidth, height: window.innerHeight },
      };
    });
    assert.deepEqual(menuPanel.destinations, ['Story', 'Experience', 'Case Studies', 'Portfolio'], 'mobile menu must retain its real destinations');
    assert.equal(menuPanel.ordinalNodes, 0, 'mobile menu must not retain ordinal markup');
    assert.equal(menuPanel.numericText, false, 'mobile menu must not retain numbered text');
    assert.equal(menuPanel.dialogBackground, 'rgba(0, 0, 0, 0)', 'mobile menu must not revert to a fullscreen surface');
    assert(menuPanel.card, 'mobile menu card is missing');
    assert(menuPanel.card.width < menuPanel.viewport.width, 'mobile menu card must not span the whole viewport');
    assert(menuPanel.card.height < menuPanel.viewport.height * 0.9, 'mobile menu card must not be fullscreen');
    assert(menuPanel.card.bottom <= menuPanel.viewport.height && menuPanel.card.bottom >= menuPanel.viewport.height - 32, 'mobile menu card must rise from the bottom');
    await page.evaluate(() => {
      window.scrollTo({ top: 640, behavior: 'instant' });
      window.dispatchEvent(new Event('scroll'));
    });
    await page.waitForTimeout(120);
    current = await state(page);
    assert.equal(current.navHidden, false, 'menu-open state must suppress chrome hiding');
    await page.locator('#mobileClose').click();
    await page.waitForTimeout(520);
    current = await state(page);
    assert.equal(current.menuOpen, false, 'mobile menu should close');
    assert.equal(current.menuExpanded, 'false', 'menu toggle should expose its closed state');

    // A real touch swipe enters the Featured Work runway. The stage remains
    // sticky, one case stays active and the horizontal reel still animates.
    const work = current.work;
    assert(work, 'Featured Work metrics must be available');
    await instantScroll(page, Math.max(0, work.pinStart - viewport.height * 0.2));
    const enterWork = await swipe(page, client, { from: fingerDown, to: fingerUp, duration: 140, x });
    assertVerticalMove(enterWork, 'down', 'entering Featured Work', viewport);
    await instantScroll(page, work.pinStart + Math.min(30, work.pinLength * 0.08));
    current = await state(page);
    assert(Math.abs(current.stageTop) < 2, 'Featured Work stage must remain pinned at its entry point');

    await instantScroll(page, work.pinStart + work.pinLength * 0.66);
    await page.waitForTimeout(500);
    current = await state(page);
    assert.equal(current.activeCases, 1, 'pinned reel must keep exactly one active case');
    assert(current.activeIndex >= 0, 'pinned reel must select a case');
    assert.match(current.filmTransform, /^translate3d\(/, 'pinned reel animation must remain active');
    assert.match(current.hud, /^0[1-3]$/, 'Featured Work HUD must stay synchronized');
    await assertMobileArtworkFit(page, `${viewport.width}×${viewport.height}`);
    assertNoHorizontalOverflow(current, 'pinned Featured Work reel');

    // Repeated direction changes while starting inside the sticky stage.
    const downInside = await swipe(page, client, { from: fingerDown, to: fingerUp, duration: 120, x });
    const upInside = await swipe(page, client, { from: fingerUp, to: fingerDown, duration: 140, x });
    const downAgain = await swipe(page, client, { from: fingerDown, to: fingerUp, duration: 120, x });
    assertVerticalMove(downInside, 'down', 'Featured Work forward swipe', viewport);
    assertVerticalMove(upInside, 'up', 'Featured Work reverse swipe', viewport);
    assertVerticalMove(downAgain, 'down', 'Featured Work repeated forward swipe', viewport);

    // Begin inside Featured Work and leave upward with slow touch swipes. Every
    // gesture must continue to advance the document instead of stalling.
    await instantScroll(page, work.pinStart + work.pinLength * 0.76);
    const upwardPositions = [];
    for (let index = 0; index < 5; index += 1) {
      const movement = await swipe(page, client, { from: fingerUp, to: fingerDown, duration: 480, x });
      assertVerticalMove(movement, 'up', `slow upward Featured Work swipe ${index + 1}`, viewport);
      upwardPositions.push(movement.after);
    }
    assert(
      upwardPositions.every((value, index) => index === 0 || value < upwardPositions[index - 1]),
      'slow upward swipes through Featured Work must remain monotonic',
    );
    assert(upwardPositions.at(-1) < work.pinStart, 'upward scrolling must exit Featured Work without a stall');
    current = await state(page);
    assertNoHorizontalOverflow(current, 'after exiting Featured Work upward');

    // Start near the page bottom, then make a true upward touch swipe before a
    // rapid return to the top. This catches stale sticky/scroll-container state.
    for (const selector of ['.footer__inner', '.footer__links a[href="/contact/"]', '.footer__brandtop']) {
      await page.evaluate((targetSelector) => {
        const target = document.querySelector(targetSelector);
        if (!(target instanceof HTMLElement)) return;
        window.scrollTo({
          top: target.getBoundingClientRect().top + window.scrollY - window.innerHeight * 0.24,
          behavior: 'instant',
        });
      }, selector);
      await page.waitForTimeout(420);
    }
    const footerScenes = await page.evaluate(() => {
      const inner = document.querySelector('.footer__inner');
      return {
        inner: inner?.classList.contains('is-in') ?? false,
        finalChapterContent: inner ? getComputedStyle(inner, '::before').content : '',
        finalChapterDisplay: inner ? getComputedStyle(inner, '::before').display : '',
        lineClip: getComputedStyle(document.querySelector('.footer__line')).clipPath,
        contact: document.querySelector('.footer__links a[href="/contact/"]')?.classList.contains('is-in') ?? false,
        brand: document.querySelector('.footer__brandtop')?.classList.contains('is-in') ?? false,
      };
    });
    assert.equal(footerScenes.finalChapterContent, 'none', 'the intentionally removed Final Chapter pseudo cue rendered');
    assert.equal(footerScenes.finalChapterDisplay, 'none', 'the intentionally removed Final Chapter pseudo cue occupied layout');
    assert.equal(footerScenes.inner, true, 'mobile footer inner scene did not activate');
    assert.notEqual(footerScenes.lineClip, 'inset(0px 0px 102%)', 'mobile footer closing line did not reveal from its inner scene');
    assert.equal(footerScenes.contact, true, 'mobile footer contact scene did not activate');
    assert.equal(footerScenes.brand, true, 'mobile footer signature scene did not activate');
    await instantScroll(page, 999999);
    current = await state(page);
    const nearBottom = await swipe(page, client, { from: fingerUp, to: fingerDown, duration: 110, x });
    assertVerticalMove(nearBottom, 'up', 'upward swipe beginning near the page bottom', viewport);
    await instantScroll(page, 0);
    await page.waitForTimeout(500);
    current = await state(page);
    assert(current.y <= 1, 'rapid return to the top must complete');
    assert.equal(current.navHidden, false, 'chrome must be visible after a rapid return to top');
    assertNoHorizontalOverflow(current, 'final state');

    assert.deepEqual(errors, [], `unexpected browser console errors: ${errors.join(' | ')}`);
    return {
      viewport: `${viewport.width}×${viewport.height}`,
      pinLength: Math.round(work.pinLength),
      maxScroll: Math.round(current.maxY),
    };
  } finally {
    await context.close();
  }
}

const managedPreview = await ensurePreview();
let browser;

try {
  browser = await chromium.launch({
    executablePath: chromiumPath,
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });
  const results = [];
  for (const viewport of viewports) {
    results.push(await testViewport(browser, viewport));
  }
  console.table(results);
  console.log(`Mobile scroll regression passed at ${results.length} requested touch viewports.`);
} finally {
  await browser?.close();
  managedPreview?.kill('SIGTERM');
}
