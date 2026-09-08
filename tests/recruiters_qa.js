const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const issues = [];
  const errors = [];
  
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/429|analytics/i.test(m.text())) errors.push(m.text()); });
  await page.route('**/api/analytics/track', route => route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' }));

  console.log("Auditing Recruiters Page on CMS (/for-recruiters.html)...");
  await page.goto('http://127.0.0.1:8000/for-recruiters.html', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);

  // 1. Structural and Visual DNA Checks
  const audit = await page.evaluate(() => {
    const nav = document.querySelector('.site-nav');
    const footer = document.querySelector('footer');
    const heroH1 = document.querySelector('.rp-hero__title');
    const acts = document.querySelectorAll('main > section');
    const buttons = document.querySelectorAll('.rp-btn');
    const computedBody = window.getComputedStyle(document.body);
    const navLinks = Array.from(document.querySelectorAll('.site-nav .nav-links a')).map(a => a.textContent.trim());

    return {
      hasSiteNav: !!nav,
      navLinksCount: navLinks.length,
      hasFooter: !!footer,
      hasHeroH1: !!heroH1,
      actCount: acts.length,
      buttonCount: buttons.length,
      bg: computedBody.backgroundColor,
      font: computedBody.fontFamily,
      overflow: document.documentElement.scrollWidth - window.innerWidth
    };
  });

  console.log("Recruiters Audit Details:", JSON.stringify(audit, null, 2));

  if (!audit.hasSiteNav) issues.push("Missing canonical site navigation");
  if (!audit.hasFooter) issues.push("Missing canonical site footer");
  if (!audit.hasHeroH1) issues.push("Missing hero H1 heading");
  if (audit.actCount < 14) issues.push(`Expected 14+ narrative acts, found ${audit.actCount}`);
  if (audit.overflow > 0) issues.push(`Horizontal overflow detected: ${audit.overflow}px`);

  // 2. Responsive Viewports test
  const viewports = [320, 375, 414, 768, 1024, 1280, 1440, 1920];
  for (const width of viewports) {
    await page.setViewportSize({ width, height: 900 });
    await page.waitForTimeout(300);
    const vpOverflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    if (vpOverflow > 1) issues.push(`Viewport ${width}px overflow: ${vpOverflow}px`);
  }

  // 3. Reduced motion check
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('http://127.0.0.1:8000/for-recruiters.html', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(500);
  const reveals = await page.evaluate(() => {
    const srs = Array.from(document.querySelectorAll('.rp-sr'));
    return srs.every(el => window.getComputedStyle(el).opacity === '1');
  });
  if (!reveals) issues.push("Reduced motion failed: some elements not immediately visible");

  if (errors.length) issues.push('JS Errors: ' + errors.join('; '));

  console.log("==========================================");
  if (issues.length) {
    console.log("RECRUITERS QA FAILED with issues:\n" + issues.join('\n'));
    process.exit(1);
  } else {
    console.log("RECRUITERS QA: ALL CHECKS PASSED PERFECTLY!");
  }
  await browser.close();
})();
