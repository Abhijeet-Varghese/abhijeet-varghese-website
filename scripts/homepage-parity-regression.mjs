import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { chromium } from 'playwright-core';

const baseUrl = process.env.HOMEPAGE_TEST_URL ?? 'http://127.0.0.1:4173/';
const chromiumPath = process.env.CHROMIUM_PATH ?? '/usr/bin/chromium';
const viewportMatrix = [
  { label: '768×1024 tablet', width: 768, height: 1024, touch: true, journey: 'stacked' },
  { label: '834×1112 tablet', width: 834, height: 1112, touch: true, journey: 'stacked' },
  { label: '900×1200 tablet', width: 900, height: 1200, touch: true, journey: 'stacked' },
  { label: '1024×768 desktop', width: 1024, height: 768, touch: false, journey: 'horizontal' },
  { label: '1280×800 desktop', width: 1280, height: 800, touch: false, journey: 'horizontal' },
  { label: '1366×768 desktop', width: 1366, height: 768, touch: false, journey: 'horizontal' },
  { label: '1440×900 desktop', width: 1440, height: 900, touch: false, journey: 'horizontal' },
  { label: '1600×1000 desktop', width: 1600, height: 1000, touch: false, journey: 'horizontal' },
  { label: '1920×1080 desktop', width: 1920, height: 1080, touch: false, journey: 'horizontal' },
  { label: '2560×1440 desktop', width: 2560, height: 1440, touch: false, journey: 'horizontal' },
];

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
  if (process.env.HOMEPAGE_TEST_URL) {
    throw new Error(`Homepage test server is unavailable at HOMEPAGE_TEST_URL=${baseUrl}`);
  }
  if (!existsSync(resolve('dist/index.html'))) {
    throw new Error('Build output is missing. Run npm run build before test:homepage-parity.');
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
  throw new Error('Timed out while starting the production preview for homepage parity regression.');
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
  await page.waitForTimeout(160);
}

async function waitForImage(page, selector) {
  await page.locator(selector).scrollIntoViewIfNeeded();
  await page.waitForFunction((imageSelector) => {
    const image = document.querySelector(imageSelector);
    return image instanceof HTMLImageElement && image.complete && image.naturalWidth > 0;
  }, selector);
}

async function pageMetrics(page) {
  return page.evaluate(() => {
    const byId = (id) => document.getElementById(id);
    const work = byId('work');
    const journey = byId('journey');
    const journeyTrack = byId('journeyTrack');
    const journeyPin = byId('journeyPin');
    const media = document.querySelector('.thinking__media');
    const hero = byId('hero');
    const footer = document.querySelector('footer.footer--arena');
    return {
      scrollY: window.scrollY,
      maxY: Math.max(document.documentElement.scrollHeight - window.innerHeight, 0),
      viewport: { width: window.innerWidth, height: window.innerHeight },
      documentWidth: document.documentElement.scrollWidth,
      bodyWidth: document.body.scrollWidth,
      scrollBehavior: getComputedStyle(document.documentElement).scrollBehavior,
      heroTop: hero instanceof HTMLElement ? hero.getBoundingClientRect().top + window.scrollY : 0,
      heroPast: hero?.classList.contains('is-past') ?? false,
      workTop: work instanceof HTMLElement ? work.getBoundingClientRect().top + window.scrollY : 0,
      journeyTop: journey instanceof HTMLElement ? journey.getBoundingClientRect().top + window.scrollY : 0,
      journeyHeight: journey instanceof HTMLElement ? journey.offsetHeight : 0,
      journeyTrackTransform: journeyTrack instanceof HTMLElement ? journeyTrack.style.transform : '',
      journeyPinWidth: journeyPin instanceof HTMLElement ? journeyPin.clientWidth : 0,
      journeyTrackWidth: journeyTrack instanceof HTMLElement ? journeyTrack.scrollWidth : 0,
      thinkingTop: media instanceof HTMLElement ? media.getBoundingClientRect().top + window.scrollY : 0,
      thinkingHeight: media instanceof HTMLElement ? media.offsetHeight : 0,
      progressTransform: byId('progress') instanceof HTMLElement ? byId('progress').style.transform : '',
      footerTop: footer instanceof HTMLElement ? footer.getBoundingClientRect().top + window.scrollY : 0,
    };
  });
}

function assertNoOverflow(metrics, label) {
  assert.equal(metrics.documentWidth, metrics.viewport.width, `${label}: document horizontal overflow`);
  assert.equal(metrics.bodyWidth, metrics.viewport.width, `${label}: body horizontal overflow`);
}

async function verifyTouchChrome(page, label, width) {
  if (width > 900) return;

  const footerState = await page.evaluate(() => {
    const inner = document.querySelector('.footer__inner');
    const pseudo = inner ? getComputedStyle(inner, '::before') : null;
    return {
      content: pseudo?.content ?? '',
      display: pseudo?.display ?? '',
    };
  });
  assert.deepEqual(footerState, { content: 'none', display: 'none' }, `${label}: removed footer cue remains generated`);

  const toggle = page.locator('#navToggle');
  assert.equal(await toggle.isVisible(), true, `${label}: touch menu trigger is missing`);
  await toggle.click();
  await page.waitForTimeout(560);
  const openState = await page.evaluate(() => {
    const menu = document.getElementById('mobileMenu');
    const panel = menu?.querySelector('nav');
    const trigger = document.getElementById('navToggle');
    const panelRect = panel?.getBoundingClientRect();
    const triggerRect = trigger?.getBoundingClientRect();
    return {
      expanded: trigger?.getAttribute('aria-expanded'),
      overflow: getComputedStyle(document.body).overflow,
      focus: document.activeElement?.id ?? '',
      destinations: Array.from(menu?.querySelectorAll('.mobile-menu__list a') ?? []).map((link) => link.textContent?.trim()),
      ordinalNodes: menu?.querySelectorAll('.mobile-menu__ordinal, .mobile-menu__list em').length ?? 0,
      numericMenuText: /\b0[1-4]\b/.test(menu?.textContent ?? ''),
      panel: panelRect ? { top: panelRect.top, bottom: panelRect.bottom, width: panelRect.width, height: panelRect.height } : null,
      viewport: { width: window.innerWidth, height: window.innerHeight },
      dialogBackground: menu instanceof HTMLElement ? getComputedStyle(menu).backgroundColor : '',
      trigger: triggerRect ? { width: triggerRect.width, height: triggerRect.height, before: getComputedStyle(trigger, '::before').content } : null,
    };
  });
  assert.equal(openState.expanded, 'true', `${label}: touch menu did not expose its open state`);
  assert.equal(openState.overflow, 'hidden', `${label}: touch menu did not lock document scrolling`);
  assert.equal(openState.focus, 'mobileClose', `${label}: touch menu did not focus its close control`);
  assert.deepEqual(openState.destinations, ['Story', 'Experience', 'Case Studies', 'Portfolio'], `${label}: touch menu destinations drifted`);
  assert.equal(openState.ordinalNodes, 0, `${label}: mobile menu retains ordinal markup`);
  assert.equal(openState.numericMenuText, false, `${label}: mobile menu retains numbered text`);
  assert.equal(openState.dialogBackground, 'rgba(0, 0, 0, 0)', `${label}: touch menu regressed to a fullscreen surface`);
  assert(openState.panel, `${label}: touch menu panel is missing`);
  assert(openState.panel.width < openState.viewport.width, `${label}: touch menu panel must remain a card, not fullscreen`);
  assert(openState.panel.height < openState.viewport.height * 0.9, `${label}: touch menu panel is unexpectedly fullscreen`);
  assert(openState.panel.bottom <= openState.viewport.height && openState.panel.bottom >= openState.viewport.height - 32, `${label}: touch menu panel is not bottom-anchored`);
  assert.deepEqual(openState.trigger && { width: openState.trigger.width, height: openState.trigger.height, before: openState.trigger.before }, { width: 48, height: 48, before: 'none' }, `${label}: trigger is no longer the minimal Line→X control`);

  await page.keyboard.press('Escape');
  assert.equal(await page.evaluate(() => document.activeElement?.id ?? ''), 'navToggle', `${label}: Escape did not restore trigger focus`);
  await page.waitForFunction(() => document.getElementById('mobileMenu')?.hidden === true, { timeout: 1000 });
  const closedState = await page.evaluate(() => ({
    hidden: document.getElementById('mobileMenu')?.hidden,
    expanded: document.getElementById('navToggle')?.getAttribute('aria-expanded'),
    overflow: getComputedStyle(document.body).overflow,
  }));
  assert.equal(closedState.hidden, true, `${label}: touch menu did not finish its close transition`);
  assert.equal(closedState.expanded, 'false', `${label}: touch menu did not expose its closed state`);
  assert.notEqual(closedState.overflow, 'hidden', `${label}: touch menu left scrolling locked after Escape`);

  // Tablet trigger visibility follows the same directional contract as phone:
  // a meaningful downward move hides it, a reverse move restores it.
  await page.evaluate(() => {
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    window.scrollTo({ top: 220, left: 0, behavior: 'instant' });
  });
  await page.waitForTimeout(120);
  assert.equal(await page.locator('#siteNav').evaluate((nav) => nav.classList.contains('nav-hidden')), true, `${label}: tablet downward scroll did not hide the trigger`);
  await page.evaluate(() => window.scrollTo({ top: 150, left: 0, behavior: 'instant' }));
  await page.waitForTimeout(120);
  assert.equal(await page.locator('#siteNav').evaluate((nav) => nav.classList.contains('nav-hidden')), false, `${label}: tablet reverse scroll did not reveal the trigger`);
  await page.evaluate(() => window.scrollTo({ top: 0, left: 0, behavior: 'instant' }));
  await page.waitForTimeout(100);
}

async function verifyFeaturedWork(page, label) {
  const selectors = ['#case-prj-1 img', '#case-prj-2 img', '#case-prj-3 img'];
  for (const selector of selectors) await waitForImage(page, selector);
  const images = await page.evaluate(() => Array.from(document.querySelectorAll('.case__panel img')).map((image) => {
    const picture = image.closest('picture');
    const panel = image.closest('.case__panel');
    const imageRect = image.getBoundingClientRect();
    const pictureRect = picture?.getBoundingClientRect();
    const panelRect = panel?.getBoundingClientRect();
    const naturalRatio = image.naturalWidth / image.naturalHeight;
    const frameRatio = pictureRect ? pictureRect.width / pictureRect.height : 0;
    const cropFraction = frameRatio > naturalRatio
      ? 1 - naturalRatio / frameRatio
      : 1 - frameRatio / naturalRatio;
    return {
      naturalWidth: image.naturalWidth,
      naturalHeight: image.naturalHeight,
      objectFit: getComputedStyle(image).objectFit,
      image: imageRect.toJSON(),
      picture: pictureRect?.toJSON(),
      panel: panelRect?.toJSON(),
      cropFraction,
      pictureTransform: picture instanceof HTMLElement ? picture.style.transform : '',
      imageTransform: image.style.transform,
      background: getComputedStyle(image).backgroundColor,
    };
  }));

  assert.equal(images.length, 3, `${label}: all Featured Work images must render`);
  for (const [index, image] of images.entries()) {
    assert.equal(image.naturalWidth, 1672, `${label}: Featured Work image ${index + 1} source width changed`);
    assert.equal(image.naturalHeight, 941, `${label}: Featured Work image ${index + 1} source height changed`);
    assert.equal(image.objectFit, 'cover', `${label}: desktop/tablet image ${index + 1} must fill its frame`);
    assert(image.picture && image.panel, `${label}: Featured Work image ${index + 1} frame is missing`);
    assert(Math.abs(image.image.width - image.picture.width) < 0.1, `${label}: image ${index + 1} does not fill picture width`);
    assert(Math.abs(image.image.height - image.picture.height) < 0.1, `${label}: image ${index + 1} does not fill picture height`);
    assert(Math.abs(image.picture.width - (image.panel.width - 2)) < 0.2, `${label}: image ${index + 1} leaves a horizontal panel gap`);
    assert(Math.abs(image.picture.height - (image.panel.height - 2)) < 0.2, `${label}: image ${index + 1} leaves a vertical panel gap`);
    assert(image.cropFraction < 0.005, `${label}: image ${index + 1} frame mismatch crops more than the source rounding tolerance`);
    assert.equal(image.pictureTransform, 'none', `${label}: image ${index + 1} picture must stay locked to its frame`);
    assert(!image.imageTransform || image.imageTransform === 'none', `${label}: image ${index + 1} must not receive a scroll transform`);
  }
  return images.map((image) => Math.round(image.cropFraction * 100000) / 1000);
}

// Every viewport receives the same cleanup and error reporting.
async function exerciseViewport(browser, viewport) {
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    deviceScaleFactor: 1,
    isMobile: viewport.touch,
    hasTouch: viewport.touch,
    reducedMotion: 'no-preference',
  });
  const page = await context.newPage();
  const errors = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(`console: ${message.text()}`);
  });
  page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`));
  await page.route('**/api/analytics/track', (route) => route.fulfill({ status: 204 }));

  try {
    await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => typeof window.__avWork === 'function');
    await page.waitForTimeout(1750);

    let metrics = await pageMetrics(page);
    assert.equal(metrics.scrollBehavior, 'smooth', `${viewport.label}: native smooth scroll is missing`);
    assertNoOverflow(metrics, `${viewport.label} initial`);
    assert.equal(await page.locator('#hero').evaluate((hero) => hero.classList.contains('is-in')), true, `${viewport.label}: hero entrance did not complete`);
    await verifyTouchChrome(page, viewport.label, viewport.width);

    // The legacy head adds reveal-failsafe at 3.4s, but normal runtime has
    // js-ok and must leave future chapters for the actual observer. Verify the
    // state explicitly so a blanket fallback cannot silently erase entrances.
    if (viewport.width === 1440 && viewport.height === 900) {
      await page.waitForTimeout(1900);
      const revealFailsafeState = await page.evaluate(() => ({
        root: document.documentElement.className,
        total: document.querySelectorAll('[data-reveal]').length,
        inView: document.querySelectorAll('[data-reveal].in-view').length,
      }));
      assert.match(revealFailsafeState.root, /\bjs-ok\b/, `${viewport.label}: normal reveal runtime did not set js-ok`);
      assert.match(revealFailsafeState.root, /\breveal-failsafe\b/, `${viewport.label}: head reveal failsafe did not arm`);
      assert.equal(revealFailsafeState.inView, 0, `${viewport.label}: normal failsafe revealed future chapters`);
    }

    // Wheel and scrollbar paths both drive the original scroll-linked systems.
    await page.mouse.wheel(0, Math.max(420, viewport.height * 0.7));
    await page.waitForTimeout(360);
    const afterWheel = await pageMetrics(page);
    assert(afterWheel.scrollY > 40, `${viewport.label}: mouse wheel did not scroll the page`);
    assert.equal(afterWheel.heroPast, true, `${viewport.label}: legacy hero past-state did not engage`);
    let afterReverseWheel = afterWheel;
    for (let attempt = 0; attempt < 2 && afterReverseWheel.scrollY >= afterWheel.scrollY; attempt += 1) {
      await page.mouse.wheel(0, -Math.max(360, viewport.height * 0.55));
      await page.waitForTimeout(360);
      afterReverseWheel = await pageMetrics(page);
    }
    assert(afterReverseWheel.scrollY < afterWheel.scrollY, `${viewport.label}: reverse mouse wheel did not scroll upward`);
    await instantScroll(page, 0);
    metrics = await pageMetrics(page);
    assert.equal(metrics.heroPast, false, `${viewport.label}: hero past-state did not reset at the top`);

    // Fine-pointer portrait drift is source-of-truth behavior. Touch tablets
    // intentionally retain the original static coarse-pointer fallback.
    if (!viewport.touch) {
      const frame = await page.locator('.hp6-frame').boundingBox();
      assert(frame, `${viewport.label}: hero frame is missing`);
      await page.mouse.move(frame.x + frame.width * 0.18, frame.y + frame.height * 0.22);
      await page.waitForTimeout(160);
      const portraitTransform = await page.locator('.hp6-frame__well').evaluate((well) => (well instanceof HTMLElement ? well.style.transform : ''));
      assert.match(portraitTransform, /^translate3d\(/, `${viewport.label}: fine-pointer portrait motion is missing`);
    }

    const cropPercentages = await verifyFeaturedWork(page, viewport.label);
    metrics = await pageMetrics(page);
    assertNoOverflow(metrics, `${viewport.label} Featured Work`);

    // Shared parallax must remain alive outside the intentionally locked cases.
    await instantScroll(page, Math.max(0, metrics.thinkingTop - viewport.height * 0.45));
    await page.waitForTimeout(180);
    const parallaxTransform = await page.locator('.thinking__media img').evaluate((image) => (image instanceof HTMLElement ? image.style.transform : ''));
    assert.match(parallaxTransform, /^translate3d\(/, `${viewport.label}: non-case image parallax is missing`);

    metrics = await pageMetrics(page);
    const journeyRange = Math.max(metrics.journeyHeight - viewport.height, 0);
    await instantScroll(page, metrics.journeyTop + journeyRange * 0.5);
    await page.waitForTimeout(240);
    const journeyState = await pageMetrics(page);
    if (viewport.journey === 'horizontal') {
      assert.match(journeyState.journeyTrackTransform, /^translate3d\(-/, `${viewport.label}: desktop Journey horizontal motion is missing`);
    } else {
      assert.equal(journeyState.journeyTrackTransform, '', `${viewport.label}: tablet Journey should retain its original stacked fallback`);
    }

    // Browser scrollbar path and a fast reverse move should never trap content.
    await instantScroll(page, journeyState.maxY - 2);
    const beforeReverse = (await pageMetrics(page)).scrollY;
    let afterBottomReverse = await pageMetrics(page);
    for (let attempt = 0; attempt < 2 && afterBottomReverse.scrollY >= beforeReverse; attempt += 1) {
      await page.mouse.wheel(0, -Math.max(460, viewport.height * 0.72));
      await page.waitForTimeout(260);
      afterBottomReverse = await pageMetrics(page);
    }
    assert(afterBottomReverse.scrollY < beforeReverse, `${viewport.label}: reverse scroll from page bottom stalled`);
    assertNoOverflow(afterBottomReverse, `${viewport.label} final`);
    assert.deepEqual(errors, [], `${viewport.label}: unexpected browser errors: ${errors.join(' | ')}`);

    return {
      viewport: viewport.label,
      imageCropPercent: cropPercentages.join(', '),
      journey: viewport.journey,
      maxScroll: Math.round(afterBottomReverse.maxY),
    };
  } finally {
    await context.close();
  }
}

async function verifyReducedMotion(browser, viewport) {
  const context = await browser.newContext({
    viewport,
    deviceScaleFactor: 1,
    isMobile: viewport.width <= 700,
    hasTouch: viewport.width <= 700,
    reducedMotion: 'reduce',
  });
  const page = await context.newPage();
  const errors = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('pageerror', (error) => errors.push(error.message));
  await page.route('**/api/analytics/track', (route) => route.fulfill({ status: 204 }));

  try {
    await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(900);
    const state = await page.evaluate(() => ({
      scrollBehavior: getComputedStyle(document.documentElement).scrollBehavior,
      pin: document.body.classList.contains('hm-pin'),
      hiddenCases: Array.from(document.querySelectorAll('.case')).filter((caseElement) => getComputedStyle(caseElement).opacity === '0').length,
      documentWidth: document.documentElement.scrollWidth,
      bodyWidth: document.body.scrollWidth,
      viewportWidth: window.innerWidth,
    }));
    assert.equal(state.scrollBehavior, 'auto', `${viewport.width}×${viewport.height} reduced motion must use native non-smooth scroll`);
    if (viewport.width <= 700) assert.equal(state.pin, false, 'reduced-motion mobile Featured Work must use its static fallback');
    assert.equal(state.hiddenCases, 0, 'reduced-motion Featured Work cases must remain visible');
    assert.equal(state.documentWidth, state.viewportWidth, 'reduced-motion document has horizontal overflow');
    assert.equal(state.bodyWidth, state.viewportWidth, 'reduced-motion body has horizontal overflow');
    assert.deepEqual(errors, [], `reduced-motion ${viewport.width}×${viewport.height}: unexpected browser errors`);
    return `${viewport.width}×${viewport.height}`;
  } finally {
    await context.close();
  }
}

async function verifyBookingAndAnalytics(browser) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
    reducedMotion: 'no-preference',
  });
  const page = await context.newPage();
  const errors = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('pageerror', (error) => errors.push(error.message));
  await page.addInitScript(() => {
    window.__avTracked = [];
    const nativeFetch = window.fetch.bind(window);
    window.fetch = (input, init) => {
      const url = typeof input === 'string' ? input : input.url;
      if (url.includes('/api/analytics/track')) {
        try {
          window.__avTracked.push(JSON.parse(init?.body ?? '{}'));
        } catch {
          // The assertion below will make a malformed tracking body visible.
        }
        return Promise.resolve(new Response(JSON.stringify({ data: { visitor_id: 'test' } }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }));
      }
      return nativeFetch(input, init);
    };
  });
  await page.route('**/api/public/lead', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ data: {} }),
  }));

  try {
    await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1800);

    // A download-styled CTA is mutually exclusive in the legacy tracker.
    await page.evaluate(() => {
      window.__avTracked = [];
      document.querySelector('.hp6-actions a[download]')?.dispatchEvent(new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
      }));
    });
    await page.waitForTimeout(120);
    const tracking = await page.evaluate(() => window.__avTracked.map((event) => ({
      event_type: event.event_type,
      content: event.content,
    })));
    assert.deepEqual(tracking, [{
      event_type: 'download',
      content: '/assets/Abhijeet-Varghese-Resume.pdf',
    }], 'analytics: Resume download must not also emit cta_click');

    await page.locator('#contactForm').scrollIntoViewIfNeeded();
    await page.waitForTimeout(180);
    const countryInitiallyEmpty = await page.locator('#cfCcList').evaluate((list) => list.children.length);
    assert.equal(countryInitiallyEmpty, 0, 'booking: country options must remain source-lazy before opening');

    await page.locator('#cfCc').click();
    const openedCountry = await page.evaluate(() => ({
      expanded: document.getElementById('cfCc')?.getAttribute('aria-expanded'),
      activeIndex: document.querySelector('.cf-cc-opt.is-active')?.getAttribute('data-i'),
      activeText: document.querySelector('.cf-cc-opt.is-active')?.textContent,
    }));
    assert.deepEqual(openedCountry, {
      expanded: 'true',
      activeIndex: '0',
      activeText: '🇦🇫+93',
    }, 'booking: country picker opening state drifted from source');
    await page.keyboard.press('ArrowDown');
    const countryAfterArrow = await page.locator('.cf-cc-opt.is-active').getAttribute('data-i');
    assert.equal(countryAfterArrow, '0', 'booking: country picker render ownership drifted from source');
    await page.locator('.cf-cc-opt').nth(10).click({ force: true });

    await page.locator('#dateTrigger').click();
    await page.waitForTimeout(80);
    await page.locator('#dpGrid button:not([disabled])').first().click({ force: true });
    await page.waitForTimeout(340);
    await page.locator('.tslot').nth(4).click();
    const summaryMarkup = await page.locator('#bookSummaryText').innerHTML();
    assert.match(summaryMarkup, /^<strong>.+ · 15:00 IST<\/strong>&nbsp;— 30 min intro call$/, 'booking: source summary spacing/content drifted');

    // main.js flags errors immediately; elevate.js intentionally transfers
    // focus 450ms later rather than stealing it during submit.
    await page.locator('#bookSubmit').click();
    await page.waitForTimeout(80);
    const earlyFocus = await page.evaluate(() => document.activeElement?.id ?? '');
    assert.notEqual(earlyFocus, 'cfName', 'booking: invalid form focus moved before the legacy 450ms delay');
    await page.waitForTimeout(470);
    const delayedFocus = await page.evaluate(() => document.activeElement?.id ?? '');
    assert.equal(delayedFocus, 'cfName', 'booking: invalid form did not receive legacy delayed focus');

    await page.locator('#cfName').fill('Ada Lovelace');
    await page.locator('#cfEmail').fill('ada@example.test');
    await page.locator('#cfMobile').fill('9876543210');
    await page.locator('#bookSubmit').click();
    await page.waitForTimeout(620);
    const success = await page.evaluate(() => ({
      viewHidden: document.getElementById('bookView')?.hidden,
      doneHidden: document.getElementById('bookDone')?.hidden,
      doneSummary: document.getElementById('doneSummary')?.textContent,
      submit: document.getElementById('bookSubmit')?.innerHTML,
    }));
    assert.equal(success.viewHidden, true, 'booking: submitted form did not hide');
    assert.equal(success.doneHidden, false, 'booking: success view did not appear');
    assert.match(success.doneSummary ?? '', /^Thanks,Ada Lovelace\./, 'booking: success copy spacing drifted from source');
    assert.equal(success.submit, 'Send booking request', 'booking: source post-submit button markup drifted');

    await page.locator('#bookAgain').click();
    await page.waitForTimeout(80);
    const againFocus = await page.evaluate(() => document.activeElement?.id ?? '');
    assert.notEqual(againFocus, 'cfName', 'booking: source book-again flow must not force focus to name');
    assert.deepEqual(errors, [], `booking/analytics: unexpected browser errors: ${errors.join(' | ')}`);
  } finally {
    await context.close();
  }
}

async function verifyTouchDateBackdrop(browser) {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 1,
    isMobile: true,
    hasTouch: true,
    reducedMotion: 'no-preference',
  });
  const page = await context.newPage();
  await page.route('**/api/analytics/track', (route) => route.fulfill({ status: 204 }));
  try {
    await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1800);
    await page.locator('#navToggle').click();
    assert.equal(await page.evaluate(() => document.activeElement?.id ?? ''), 'mobileClose', 'touch menu: source opening focus must land on the first menu control');
    // Let the source two-RAF opening class settle before exercising its close
    // path; a literal same-task Escape races that legacy class write.
    await page.waitForTimeout(60);
    await page.keyboard.press('Escape');
    assert.equal(await page.evaluate(() => document.activeElement?.id ?? ''), 'navToggle', 'touch menu: source close must restore trigger focus');
    await page.locator('#contactForm').scrollIntoViewIfNeeded();
    await page.locator('#dateTrigger').click();
    await page.waitForTimeout(80);
    await page.evaluate(() => {
      document.getElementById('datePop')?.dispatchEvent(new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
      }));
    });
    const closing = await page.evaluate(() => ({
      hidden: document.getElementById('datePop')?.hidden,
      open: document.getElementById('datePop')?.classList.contains('is-open'),
      expanded: document.getElementById('dateTrigger')?.getAttribute('aria-expanded'),
    }));
    assert.deepEqual(closing, { hidden: false, open: false, expanded: 'false' }, 'touch booking: source date-sheet backdrop did not start closing');
    await page.waitForTimeout(340);
    assert.equal(await page.locator('#datePop').evaluate((popup) => popup.hidden), true, 'touch booking: date-sheet backdrop did not complete close');
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
  for (const viewport of viewportMatrix) {
    results.push(await exerciseViewport(browser, viewport));
  }
  const reduced = [
    await verifyReducedMotion(browser, { width: 1440, height: 900 }),
    await verifyReducedMotion(browser, { width: 390, height: 844 }),
  ];
  await verifyBookingAndAnalytics(browser);
  await verifyTouchDateBackdrop(browser);
  console.table(results);
  console.log(`Homepage desktop/tablet parity passed at ${results.length} requested viewports; reduced motion passed at ${reduced.join(' and ')}; booking, touch date-sheet, and download analytics parity passed.`);
} finally {
  await browser?.close();
  managedPreview?.kill('SIGTERM');
}
