const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const issues = [];
  const journeys = [
    ['/case-studies.html', '.case:nth-of-type(2) .case__card-cta'],
    ['/portfolio.html', '.portfolio-piece--1 .portfolio-piece__link']
  ];
  for (const [source, selector] of journeys) {
    await page.goto('http://127.0.0.1:8092' + source, { waitUntil: 'domcontentloaded' });
    await page.locator(selector).scrollIntoViewIfNeeded();
    const before = await page.evaluate(() => scrollY);
    await page.click(selector);
    await page.waitForTimeout(400);
    await page.click('[data-history-close]');
    await page.waitForTimeout(600);
    const after = await page.evaluate(() => ({ path: location.pathname, y: scrollY }));
    if (after.path !== source || Math.abs(after.y - before) > 160) issues.push(`${source}: ${JSON.stringify({before,after})}`);
  }
  const direct = await browser.newContext();
  const directPage = await direct.newPage();
  await directPage.goto('http://127.0.0.1:8092/case-study-immersive-solutions-for-the-indian-army.html');
  const fallback = await directPage.locator('[data-history-close]').getAttribute('href');
  if (fallback !== 'index.html') issues.push(`direct fallback ${fallback}`);
  await direct.close();
  await browser.close();
  if (issues.length) { console.error('HISTORY CLOSE QA: ISSUES\n' + issues.join('\n')); process.exit(1); }
  console.log('HISTORY CLOSE QA: ALL CLEAN — previous route/scroll restored; direct visits retain home fallback');
})();
