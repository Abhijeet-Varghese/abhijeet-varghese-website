/* Modern engine compatibility: Chromium/Edge family, Firefox and WebKit/Safari family. */
const { chromium, firefox, webkit } = require('playwright');

const BASE = process.argv[2] || 'http://127.0.0.1:8092';
const ENGINES = { chromium, firefox, webkit };
const PAGES = ['/', '/story.html', '/experience.html', '/case-studies.html', '/portfolio.html', '/contact.html', '/search.html', '/experience-design/orange-business-executive-briefing-center/'];

(async () => {
  const issues = [];
  for (const [engineName, browserType] of Object.entries(ENGINES)) {
    let browser;
    try {
      browser = await browserType.launch();
    } catch (error) {
      issues.push(`${engineName}: launch failed (${error.message.split('\n')[0]})`);
      continue;
    }
    for (const viewport of [{ width: 390, height: 844 }, { width: 1440, height: 900 }]) {
      const context = await browser.newContext({ viewport });
      const page = await context.newPage();
      let current = '';
      page.on('pageerror', error => issues.push(`${engineName} ${current}: ${error.message}`));
      await page.route('**/api/analytics/track', route => route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true,"data":{}}' }));
      for (const path of PAGES) {
        current = `${path} @${viewport.width}`;
        const response = await page.goto(BASE + path, { waitUntil: 'domcontentloaded', timeout: 30000 });
        if (!response || response.status() !== 200) issues.push(`${engineName} ${current}: HTTP ${response?.status()}`);
        const result = await page.evaluate(() => ({
          overflow: document.documentElement.scrollWidth - innerWidth,
          h1: document.querySelectorAll('h1').length,
          header: document.querySelectorAll('header.site-nav').length,
          footer: document.querySelectorAll('footer.footer--arena').length,
          navToggle: getComputedStyle(document.querySelector('#navToggle')).display,
          images: [...document.images].filter(image => image.complete && image.naturalWidth === 0).length
        }));
        if (result.overflow > 1 || result.h1 !== 1 || result.header !== 1 || result.footer !== 1 || result.images) {
          issues.push(`${engineName} ${current}: ${JSON.stringify(result)}`);
        }
        if (viewport.width <= 900 && result.navToggle === 'none') issues.push(`${engineName} ${current}: compact nav unavailable`);
      }

      // Shared menu behavior.
      current = `mobile menu @${viewport.width}`;
      if (viewport.width <= 900) {
        await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
        await page.click('#navToggle');
        const opened = await page.locator('#navToggle').getAttribute('aria-expanded');
        await page.keyboard.press('Escape');
        const closed = await page.locator('#navToggle').getAttribute('aria-expanded');
        if (opened !== 'true' || closed !== 'false') issues.push(`${engineName}: mobile menu open/Escape failed`);
      }

      // Search and the highest-density custom interaction.
      current = `search @${viewport.width}`;
      await page.goto(BASE + '/search.html', { waitUntil: 'load' });
      await page.fill('#siteSearch', 'Orange');
      await page.waitForTimeout(120);
      if (await page.locator('#searchResults a').count() < 1) issues.push(`${engineName}: search results failed`);

      current = `Orange tabs @${viewport.width}`;
      await page.goto(BASE + '/experience-design/orange-business-executive-briefing-center/', { waitUntil: 'domcontentloaded' });
      await page.locator('#proof-tab-wall').evaluate(element => element.click());
      const selected = await page.locator('#proof-tab-wall').getAttribute('aria-selected');
      const hidden = await page.locator('#proof-panel-wall').evaluate(element => element.hidden);
      if (selected !== 'true' || hidden) issues.push(`${engineName}: Orange proof tabs failed`);
      await context.close();
    }
    await browser.close();
  }

  if (issues.length) {
    console.error(`BROWSER COMPAT QA: ${issues.length} issue(s)`);
    issues.forEach(issue => console.error(' - ' + issue));
    process.exit(1);
  }
  console.log(`BROWSER COMPAT QA: ALL CLEAN (${Object.keys(ENGINES).join(', ')}; mobile + desktop; ${PAGES.length} representative routes)`);
})();
