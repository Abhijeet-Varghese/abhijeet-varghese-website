const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('http://127.0.0.1:8092/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(500);
  const r = await page.evaluate(() => {
    const btn = document.querySelector('.site-nav__inner > .btn--small');
    if (!btn) return { found: false };
    const href = btn.getAttribute('href');
    btn.click();
    return { found: true, href };
  });
  await page.waitForTimeout(900);
  console.log(r.found && page.url().endsWith(r.href) ? 'PASS  CTA button → contact.html (' + page.url() + ')' : 'FAIL  ' + JSON.stringify(r) + ' → ' + page.url());
  // mobile: menu shows 4 items (including Portfolio) + one CTA button
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('http://127.0.0.1:8092/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(400);
  await page.click('#navToggle');
  await page.waitForTimeout(600);
  const mobile = await page.evaluate(() => ({
    list: Array.from(document.querySelectorAll('.mobile-menu__list a')).map(a => a.textContent.trim()),
    ctaBtns: document.querySelectorAll('.mobile-menu__actions .btn').length
  }));
  console.log(mobile.list.length === 4 && mobile.list.some(t => t.includes('Portfolio')) && !mobile.list.some(t => t.includes('Start a conversation')) && mobile.ctaBtns === 1
    ? 'PASS  mobile menu: 4 items + 1 CTA button ' + JSON.stringify(mobile)
    : 'FAIL  ' + JSON.stringify(mobile));
  await browser.close();
})();
