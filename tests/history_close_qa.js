/* Case-study "close" control: returns to the referring listing at the same scroll
   position; when opened directly it falls back to the homepage. */
const { chromium } = require('playwright');
const BASE = process.argv[2] || 'http://127.0.0.1:8092';
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const issues = [];
  const journeys = [
    ['/case-studies/', '.case:nth-of-type(2) .case__card-cta'],
    ['/portfolio.html', '.pf-card:nth-of-type(1) .pf-card__link']
  ];
  for (const [source, selector] of journeys) {
    await page.goto(BASE + source, { waitUntil: 'domcontentloaded' });
    await page.locator(selector).first().scrollIntoViewIfNeeded();
    const before = await page.evaluate(() => scrollY);
    await page.locator(selector).first().click();
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(400);
    if (!(await page.locator('[data-history-close]').count())) { issues.push(`${source}: target has no [data-history-close]`); continue; }
    await page.click('[data-history-close]');
    await page.waitForTimeout(600);
    const after = await page.evaluate(() => ({ path: location.pathname, y: scrollY }));
    if (after.path !== source || Math.abs(after.y - before) > 160) issues.push(`${source}: ${JSON.stringify({ before, after })}`);
  }
  const direct = await browser.newContext();
  const directPage = await direct.newPage();
  await directPage.goto(BASE + '/case-studies/indian-army/');
  const fallback = await directPage.locator('[data-history-close]').getAttribute('href');
  if (!/index\.html$/.test(fallback || '')) issues.push(`direct fallback ${fallback}`);
  await direct.close();
  await browser.close();
  if (issues.length) { console.error('HISTORY CLOSE QA: ISSUES\n' + issues.join('\n')); process.exit(1); }
  console.log('HISTORY CLOSE QA: ALL CLEAN');
})();
