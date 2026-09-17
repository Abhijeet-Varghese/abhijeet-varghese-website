const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const base = 'http://127.0.0.1:8092/insights/';
const viewports = [
  ['320', 320, 720], ['390', 390, 844], ['768', 768, 1024],
  ['1024', 1024, 768], ['1440', 1440, 1000], ['2560', 2560, 1440], ['3840', 3840, 2160]
];
const output = path.resolve('qa-insights-hub-v11');
fs.mkdirSync(output, { recursive: true });
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const preparePage = async page => {
  // The production analytics endpoint is intentionally absent from the static QA server.
  // Mock only that endpoint so transport noise cannot mask a page error.
  await page.route('**/api/analytics/track', route => route.fulfill({ status: 204, body: '' }));
};

(async () => {
  const browser = await chromium.launch({ headless: true });
  const checks = [], allErrors = [], allFailed = [];
  try {
    for (const [name, width, height] of viewports) {
      const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
      const errors = [], failed = [];
      await preparePage(page);
      page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
      page.on('pageerror', error => errors.push(String(error)));
      page.on('requestfailed', request => {
        if (!request.url().includes('/api/analytics/track')) failed.push(request.url());
      });
      const response = await page.goto(base, { waitUntil: 'networkidle', timeout: 45000 });
      await sleep(1000); // lets progressive reveal settle before visual and geometry inspection
      const data = await page.evaluate(() => {
        const links = [...document.querySelectorAll('article[data-insight] h2 a')].map(a => a.getAttribute('href'));
        const visible = node => !!node && !!(node.offsetWidth || node.offsetHeight || node.getClientRects().length);
        return {
          status: document.readyState,
          h1: [...document.querySelectorAll('h1')].map(n => n.textContent.replace(/\s+/g, ' ').trim()),
          cards: document.querySelectorAll('article[data-insight]').length,
          cardLinks: links,
          tabs: document.querySelectorAll('[data-decision][role="tab"]').length,
          panels: document.querySelectorAll('.ibr-lenses__panels [role="tabpanel"]').length,
          canonical: document.querySelector('link[rel="canonical"]')?.href,
          viewport: innerWidth,
          overflow: Math.max(0, document.documentElement.scrollWidth - innerWidth),
          contact: !!document.querySelector('a[href="/contact/"]'),
          footer: visible(document.querySelector('footer')),
          visibleRevealHidden: [...document.querySelectorAll('[data-ibr-reveal]')].filter(el => {
            const box = el.getBoundingClientRect();
            return box.bottom > 0 && box.top < innerHeight && getComputedStyle(el).opacity === '0';
          }).length
        };
      });
      data.cardImageAssets = await page.evaluate(async () => Promise.all(
        [...document.querySelectorAll('article[data-insight] img')].map(async image => {
          const response = await fetch(image.currentSrc || image.src);
          return response.ok;
        })
      ));
      if (['320', '390', '768', '1440', '2560', '3840'].includes(name)) {
        await page.screenshot({ path: path.join(output, `listing-${name}.png`), fullPage: false });
      }
      checks.push({ viewport: name, httpStatus: response?.status(), ...data, errors, failed });
      allErrors.push(...errors); allFailed.push(...failed);
      await page.close();
    }

    const interaction = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
    const interactionErrors = [];
    interaction.on('console', message => { if (message.type() === 'error') interactionErrors.push(message.text()); });
    await interaction.goto(base, { waitUntil: 'networkidle', timeout: 45000 });
    await sleep(800);
    await interaction.locator('#brief-system').click();
    const click = await interaction.evaluate(() => ({
      selected: document.querySelector('#brief-system').getAttribute('aria-selected'),
      panelHidden: document.querySelector('#brief-panel-system').hidden
    }));
    await interaction.locator('#brief-system').focus();
    await interaction.keyboard.press('ArrowLeft');
    const keyboard = await interaction.evaluate(() => ({
      selected: document.querySelector('#brief-memory').getAttribute('aria-selected'),
      panelHidden: document.querySelector('#brief-panel-memory').hidden
    }));
    await interaction.locator('#insight-02').scrollIntoViewIfNeeded();
    await sleep(1000);
    const rail = await interaction.evaluate(() => ({
      active: document.querySelector('.ibr-rail a.is-active')?.getAttribute('href'),
      railVisible: !!document.querySelector('.ibr-rail') && getComputedStyle(document.querySelector('.ibr-rail')).display !== 'none'
    }));
    await interaction.screenshot({ path: path.join(output, 'listing-mobile-insight-02.png'), fullPage: false });
    await interaction.close();

    // Direct route plus desktop rail. These must also survive a clean direct request.
    const desktop = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
    await desktop.goto(base, { waitUntil: 'networkidle', timeout: 45000 });
    await desktop.locator('#insight-03').scrollIntoViewIfNeeded(); await sleep(850);
    const desktopRail = await desktop.evaluate(() => ({
      active: document.querySelector('.ibr-rail a.is-active')?.getAttribute('href'),
      visible: document.querySelector('.ibr-rail')?.classList.contains('is-visible')
    }));
    await desktop.screenshot({ path: path.join(output, 'listing-desktop-insight-03.png'), fullPage: false });
    await desktop.close();

    const directRoutes = [];
    for (const slug of [
      'technology-should-feel-human', 'ai-isnt-replacing-creativity',
      'designing-experiences-people-remember', 'why-enterprise-experiences-fail'
    ]) {
      const route = await browser.newPage({ viewport: { width: 1024, height: 768 } });
      await preparePage(route);
      const response = await route.goto(`${base}${slug}/`, { waitUntil: 'networkidle', timeout: 45000 });
      directRoutes.push({ slug, status: response?.status(), h1Count: await route.locator('h1').count() });
      await route.close();
    }

    const expectedLinks = [
      '/insights/technology-should-feel-human/', '/insights/ai-isnt-replacing-creativity/',
      '/insights/designing-experiences-people-remember/', '/insights/why-enterprise-experiences-fail/'
    ];
    const routeOk = checks.every(check =>
      check.httpStatus === 200 && check.status === 'complete' && check.h1.length === 1 &&
      check.h1[0] === 'Thinking Beyond the Output.' && check.cards === 4 &&
      JSON.stringify(check.cardLinks) === JSON.stringify(expectedLinks) && check.tabs === 4 &&
      check.panels === 4 && check.canonical === 'https://abhijeetvarghese.com/insights/' &&
      check.overflow <= 1 && check.contact && check.footer &&
      check.cardImageAssets.length === 4 && check.cardImageAssets.every(Boolean) &&
      check.visibleRevealHidden === 0 && !check.errors.length && !check.failed.length
    );
    const interactionOk = click.selected === 'true' && !click.panelHidden &&
      keyboard.selected === 'true' && !keyboard.panelHidden && rail.active === '#insight-02' &&
      rail.railVisible && desktopRail.active === '#insight-03' && desktopRail.visible;
    const directRoutesOk = directRoutes.every(route => route.status === 200 && route.h1Count === 1);
    const report = {
      routeOk, interactionOk, directRoutesOk, checks, click, keyboard, rail, desktopRail,
      directRoutes, consoleErrors: [...allErrors, ...interactionErrors], failedRequests: allFailed
    };
    fs.writeFileSync(path.join(output, 'report.json'), JSON.stringify(report, null, 2));
    fs.writeFileSync(path.join(output, 'summary.txt'), [
      `Viewports: ${checks.length}`,
      `Listing route, assets, semantics and geometry: ${routeOk ? 'PASS' : 'FAIL'}`,
      `Briefing tabs and reading rail: ${interactionOk ? 'PASS' : 'FAIL'}`,
      `Direct article routes: ${directRoutesOk ? 'PASS' : 'FAIL'}`,
      `Console errors: ${report.consoleErrors.length}`,
      `Failed requests: ${allFailed.length}`
    ].join('\n') + '\n');
    console.log(fs.readFileSync(path.join(output, 'summary.txt'), 'utf8'));
    if (!routeOk || !interactionOk || !directRoutesOk) process.exitCode = 2;
  } finally {
    await browser.close();
  }
})();
