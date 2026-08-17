/* Dedicated Portfolio vs Case Studies regression and responsive audit. */
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const issues = [];
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/429 \(Too Many Requests\)/.test(m.text())) errors.push(m.text()); });
  await page.route('**/api/analytics/track', route => route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true,"data":{}}' }));

  await page.goto('http://127.0.0.1:8092/portfolio.html?qa=1', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);
  const portfolio = await page.evaluate(() => ({
    body: document.body.className,
    h1: document.querySelectorAll('h1').length,
    pieces: document.querySelectorAll('.portfolio-piece').length,
    practice: document.querySelectorAll('.portfolio-practice li').length,
    logos: document.querySelectorAll('.portfolio-proof__logos li').length,
    active: document.querySelector('.nav-links a[aria-current="page"]')?.textContent.trim(),
    links: [...document.querySelectorAll('.portfolio-piece__link')].map(a => a.getAttribute('href')),
    overflow: document.documentElement.scrollWidth - innerWidth
  }));
  if (!portfolio.body.includes('portfolio-page')) issues.push('missing portfolio body class');
  if (portfolio.h1 !== 1) issues.push(`portfolio h1 ${portfolio.h1}`);
  if (portfolio.pieces !== 3) issues.push(`portfolio pieces ${portfolio.pieces}`);
  if (portfolio.practice !== 6) issues.push(`practice rows ${portfolio.practice}`);
  if (portfolio.logos < 16) issues.push(`logos ${portfolio.logos}`);
  if (portfolio.active !== 'Portfolio') issues.push(`portfolio active nav ${portfolio.active}`);
  if (portfolio.links.some(h => !h || !(h === 'experience-design/orange-business-executive-briefing-center/' || /^case-study-.+\.html$/.test(h)))) issues.push('invalid portfolio project links');
  if (portfolio.overflow) issues.push(`portfolio overflow ${portfolio.overflow}`);

  await page.goto('http://127.0.0.1:8092/case-studies.html?qa=1', { waitUntil: 'domcontentloaded' });
  const cases = await page.evaluate(() => ({
    active: document.querySelector('.nav-links a[aria-current="page"]')?.textContent.trim(),
    pieces: document.querySelectorAll('.portfolio-piece').length,
    cases: document.querySelectorAll('.case').length,
    h1: document.querySelectorAll('h1').length
  }));
  if (cases.active !== 'Case Studies') issues.push(`case-studies active nav ${cases.active}`);
  if (cases.pieces !== 0) issues.push('portfolio layout leaked into case studies');
  if (cases.cases < 3) issues.push(`case cards ${cases.cases}`);
  if (cases.h1 !== 1) issues.push(`case h1 ${cases.h1}`);

  for (const width of [280, 320, 390, 768, 1024, 1440, 1920, 2560]) {
    await page.setViewportSize({ width, height: width < 700 ? 844 : 900 });
    await page.goto(`http://127.0.0.1:8092/portfolio.html?w=${width}`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);
    const r = await page.evaluate(() => {
      const title = document.querySelector('.portfolio-hero__title').getBoundingClientRect();
      return {
        overflow: document.documentElement.scrollWidth - innerWidth,
        titleFits: title.left >= -1 && title.right <= innerWidth + 1,
        pieces: document.querySelectorAll('.portfolio-piece').length
      };
    });
    if (r.overflow || !r.titleFits || r.pieces !== 3) issues.push(`${width}px ${JSON.stringify(r)}`);
  }

  if (errors.length) issues.push('JS errors: ' + errors.slice(0, 3).join(' | '));
  console.log(issues.length ? 'PORTFOLIO QA ISSUES:\n' + issues.join('\n') : 'PORTFOLIO QA: ALL CLEAN');
  await browser.close();
  process.exit(issues.length ? 1 : 0);
})();
