/* Site-wide native-cursor audit (legacy filename retained for test tooling). */
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const pages = [
    '/', '/story.html', '/experience.html', '/case-studies.html', '/contact.html',
    '/insights.html', '/journal.html', '/for-recruiters.html', '/consulting.html',
    '/privacy-policy.html', '/terms.html', '/search.html'
  ];
  const issues = [];
  for (const path of pages) {
    await page.goto('http://127.0.0.1:8092' + path, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(250);
    const r = await page.evaluate(() => ({
      cursor: getComputedStyle(document.body).cursor,
      overlays: document.querySelectorAll('.arena-cur-dot,.arena-cur-ring,.arena-cur-label').length,
      dataCur: document.querySelectorAll('[data-cur]').length,
      cursorClasses: document.body.classList.contains('about-cur') || document.body.classList.contains('arena-cur')
    }));
    if (r.cursor === 'none' || r.overlays || r.dataCur || r.cursorClasses) {
      issues.push(`${path}: ${JSON.stringify(r)}`);
    }
  }
  const css = await (await page.request.get('http://127.0.0.1:8092/css/styles.css')).text();
  if (/cursor\s*:\s*none/i.test(css)) issues.push('styles.css contains cursor:none');
  if (/arena-cur-(dot|ring|label)|about-cur\b/.test(css)) issues.push('styles.css contains legacy cursor selectors');
  console.log(issues.length ? 'CURSOR REMOVAL ISSUES:\n' + issues.join('\n') : `NATIVE CURSOR AUDIT: ALL CLEAN (${pages.length} pages)`);
  await browser.close();
  process.exit(issues.length ? 1 : 0);
})();
