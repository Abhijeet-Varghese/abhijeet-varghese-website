const { chromium } = require('playwright');
const WIDTHS = [320, 360, 375, 390, 430, 768, 820, 1024, 1280, 1440, 1920];
const PAGES = ['/', '/story.html', '/experience.html', '/case-studies.html', '/contact.html', '/journal.html', '/case-study-enterprise-technology-made-understandable.html'];
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const issues = [];
  for (const w of WIDTHS) {
    await page.setViewportSize({ width: w, height: 900 });
    for (const p of PAGES) {
      await page.goto('http://127.0.0.1:8092' + p + '?q=' + w, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(350);
      const r = await page.evaluate(() => ({
        overflow: document.documentElement.scrollWidth - window.innerWidth,
        fixedCover: Array.from(document.querySelectorAll('header, .site-nav')).filter(el => {
          const cs = getComputedStyle(el); const r = el.getBoundingClientRect();
          return (cs.position === 'fixed' || cs.position === 'sticky') && r.height > 120;
        }).length,
      }));
      if (r.overflow > 0) issues.push(`OVERFLOW +${r.overflow}px @${w} ${p}`);
      if (r.fixedCover) issues.push(`STICKY COVER @${w} ${p}`);
    }
  }
  // mobile menu overflow check
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('http://127.0.0.1:8092/?m=1', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(400);
  await page.click('#navToggle');
  await page.waitForTimeout(600);
  const menuOverflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  if (menuOverflow > 0) issues.push(`MOBILE MENU OVERFLOW +${menuOverflow}px`);
  // footer CTA visible
  const foot = await page.evaluate(() => ({ cta: !!document.querySelector('.footer__cta'), avail: !!document.querySelector('.footer__avail'), back: !!document.querySelector('.footer__top') }));
  console.log('FOOTER', JSON.stringify(foot));
  console.log(issues.length ? issues.join('\n') : 'RESPONSIVE: 0 issues across 11 widths × 7 pages');
  await browser.close();
})();
