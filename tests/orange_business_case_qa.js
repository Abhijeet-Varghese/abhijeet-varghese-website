/* Orange Business EBC — canonical route, interaction, no-JS and responsive QA. */
const { chromium } = require('playwright');

const BASE = process.argv[2] || 'http://127.0.0.1:8092';
const ROUTE = '/experience-design/orange-business-executive-briefing-center/';
const LEGACY = '/case-study-enterprise-technology-made-understandable.html';
const SIZES = [
  [280, 653], [320, 480], [390, 844], [568, 320], [768, 1024],
  [1024, 768], [1440, 900], [1920, 1080], [3440, 1440], [3840, 2160]
];

(async () => {
  const browser = await chromium.launch();
  const issues = [];
  const page = await browser.newPage();
  const runtimeErrors = [];
  const failedRequests = [];
  page.on('pageerror', error => runtimeErrors.push(error.message));
  page.on('requestfailed', request => {
    if (request.url().includes('/api/analytics/track')) return;
    failedRequests.push(`${request.method()} ${request.url()} :: ${request.failure()?.errorText || 'failed'}`);
  });

  for (const [width, height] of SIZES) {
    await page.setViewportSize({ width, height });
    const response = await page.goto(BASE + ROUTE + `?qa=${width}x${height}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    if (!response || response.status() !== 200) issues.push(`${width}×${height}: route status ${response?.status()}`);
    await page.waitForTimeout(500);
    const result = await page.evaluate(() => {
      const h1 = document.querySelector('h1');
      const nav = document.querySelector('.site-nav__inner');
      const headingOverflow = [...document.querySelectorAll('h1,h2,h3')].filter(node => {
        const r = node.getBoundingClientRect();
        return r.left < -1 || r.right > innerWidth + 1;
      }).map(node => node.textContent.trim().replace(/\s+/g, ' ').slice(0, 50));
      return {
        overflow: document.documentElement.scrollWidth - innerWidth,
        h1Count: document.querySelectorAll('h1').length,
        h1Text: h1?.textContent.trim() || '',
        h1Rect: h1 ? { left: h1.getBoundingClientRect().left, right: h1.getBoundingClientRect().right } : null,
        navHeight: nav?.getBoundingClientRect().height || 0,
        portfolioNav: !!document.querySelector('.site-nav a[href="../../portfolio.html"]'),
        portfolioFooter: !!document.querySelector('.footer a[href="../../portfolio.html"]'),
        sharedChrome: document.querySelectorAll('header.site-nav, footer.footer--arena').length === 2,
        bespokeChrome: document.querySelectorAll('.case-nav,.case-footer').length,
        sections: document.querySelectorAll('main article > section').length,
        unresolved: document.documentElement.innerHTML.includes('{{'),
        videoSources: document.querySelectorAll('video source[data-src], video source[src]').length,
        videoControls: document.querySelectorAll('.video-toggle').length,
        headingOverflow
      };
    });
    if (result.overflow > 0) issues.push(`${width}×${height}: horizontal overflow +${result.overflow}px`);
    if (result.h1Count !== 1 || !/EXECUTIVE/.test(result.h1Text)) issues.push(`${width}×${height}: invalid H1 ${JSON.stringify(result.h1Text)}`);
    if (!result.portfolioNav || !result.portfolioFooter) issues.push(`${width}×${height}: Portfolio missing from project nav/footer`);
    if (!result.sharedChrome || result.bespokeChrome) issues.push(`${width}×${height}: homepage chrome not reused exactly`);
    if (result.sections < 10) issues.push(`${width}×${height}: incomplete narrative (${result.sections} sections)`);
    if (result.unresolved) issues.push(`${width}×${height}: unresolved template placeholder`);
    if (result.videoSources || result.videoControls) issues.push(`${width}×${height}: unavailable MP4 exposed (${result.videoSources} sources, ${result.videoControls} controls)`);
    if (result.headingOverflow.length) issues.push(`${width}×${height}: heading overflow ${result.headingOverflow.join(' | ')}`);
  }

  // Interaction and semantic state checks.
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(BASE + ROUTE, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(600);

  await page.click('.summary-open');
  if (!(await page.locator('.summary-dialog').evaluate(el => el.open))) issues.push('summary dialog did not open');
  await page.click('.dialog-close');

  await page.locator('.panorama-hotspot.wall').evaluate(el => el.click());
  const hotspot = await page.evaluate(() => ({
    title: document.querySelector('.panorama-output b')?.textContent,
    pressed: document.querySelector('.panorama-hotspot.wall')?.getAttribute('aria-pressed')
  }));
  if (hotspot.title !== 'Video Wall' || hotspot.pressed !== 'true') issues.push(`panorama hotspot state failed: ${JSON.stringify(hotspot)}`);

  await page.locator('.role-chain button:nth-child(3)').evaluate(el => el.click());
  if ((await page.locator('.role-chain button:nth-child(3)').getAttribute('aria-pressed')) !== 'true') issues.push('responsibility choice state failed');

  await page.locator('#proof-tab-wall').evaluate(el => el.click());
  const tabs = await page.evaluate(() => ({
    selected: document.querySelector('#proof-tab-wall')?.getAttribute('aria-selected'),
    wallHidden: document.querySelector('#proof-panel-wall')?.hidden,
    rotoHidden: document.querySelector('#proof-panel-rotoscope')?.hidden,
    panelRole: document.querySelector('#proof-panel-wall')?.getAttribute('role')
  }));
  if (tabs.selected !== 'true' || tabs.wallHidden || !tabs.rotoHidden || tabs.panelRole !== 'tabpanel') issues.push(`proof tabs failed: ${JSON.stringify(tabs)}`);
  await page.focus('#proof-tab-wall');
  await page.keyboard.press('ArrowRight');
  if ((await page.locator('#proof-tab-vr').getAttribute('aria-selected')) !== 'true') issues.push('proof tab arrow-key navigation failed');

  await page.locator('.response-toggle').evaluate(el => el.click());
  if ((await page.locator('.response-toggle').getAttribute('aria-pressed')) !== 'true') issues.push('room response state failed');
  await page.locator('.purpose-strip button:nth-child(5)').evaluate(el => el.click());
  if ((await page.locator('.purpose-strip button:nth-child(5)').getAttribute('aria-pressed')) !== 'true') issues.push('technology purpose state failed');

  // Lazy images should resolve once the narrative has been traversed.
  await page.evaluate(async () => {
    for (let y = 0; y < document.documentElement.scrollHeight; y += innerHeight * .8) {
      scrollTo(0, y);
      await new Promise(resolve => setTimeout(resolve, 35));
    }
    scrollTo(0, 0);
  });
  await page.waitForTimeout(400);
  const brokenImages = await page.evaluate(() => [...document.images].filter(img => !img.complete || img.naturalWidth === 0).map(img => img.currentSrc || img.src));
  if (brokenImages.length) issues.push(`broken images: ${brokenImages.join(', ')}`);

  // No-JavaScript fallback remains fully readable and navigable.
  const noJs = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  const noJsPage = await noJs.newPage();
  await noJsPage.goto(BASE + ROUTE, { waitUntil: 'domcontentloaded' });
  const noJsResult = await noJsPage.evaluate(() => {
    const why = document.querySelector('.why .lead');
    const style = why && getComputedStyle(why);
    return {
      text: why?.textContent.trim().length || 0,
      opacity: style?.opacity,
      visibility: style?.visibility,
      portfolio: !!document.querySelector('.footer a[href="../../portfolio.html"]'),
      overflow: document.documentElement.scrollWidth - innerWidth
    };
  });
  if (noJsResult.text < 40 || noJsResult.opacity !== '1' || noJsResult.visibility === 'hidden' || !noJsResult.portfolio || noJsResult.overflow > 0) {
    issues.push(`no-JS fallback failed: ${JSON.stringify(noJsResult)}`);
  }
  await noJs.close();

  // Reduced motion resolves every reveal to its final state.
  const reduced = await browser.newContext({ reducedMotion: 'reduce', viewport: { width: 390, height: 844 } });
  const reducedPage = await reduced.newPage();
  await reducedPage.goto(BASE + ROUTE, { waitUntil: 'domcontentloaded' });
  await reducedPage.waitForTimeout(100);
  const hiddenReveal = await reducedPage.evaluate(() => [...document.querySelectorAll('.reveal')].filter(el => getComputedStyle(el).opacity !== '1').length);
  if (hiddenReveal) issues.push(`reduced motion left ${hiddenReveal} reveals hidden`);
  await reduced.close();

  // Legacy flat URL must land on the supplied canonical page in static dev mode.
  await page.goto(BASE + LEGACY, { waitUntil: 'domcontentloaded' });
  await page.waitForURL(url => url.pathname === ROUTE, { timeout: 5000 }).catch(() => {});
  if (new URL(page.url()).pathname !== ROUTE) issues.push(`legacy route did not redirect: ${page.url()}`);

  issues.push(...runtimeErrors.map(error => `page error: ${error}`));
  issues.push(...failedRequests.map(error => `request failed: ${error}`));
  await browser.close();

  if (issues.length) {
    console.error(`ORANGE BUSINESS CASE QA: ${issues.length} issue(s)`);
    issues.forEach(issue => console.error(' - ' + issue));
    process.exit(1);
  }
  console.log(`ORANGE BUSINESS CASE QA: ALL CLEAN (${SIZES.length} responsive sizes + interactions + no-JS + reduced motion)`);
})();
