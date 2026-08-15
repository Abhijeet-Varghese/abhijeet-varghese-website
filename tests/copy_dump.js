const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('http://127.0.0.1:8092/story.html?as4=1', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2200);
  const r = await page.evaluate(() => {
    const out = [];
    document.querySelectorAll('main p, main h1, main h2, main h3, main li, main figcaption, main a, main strong, main em').forEach(el => {
      const t = (el.textContent || '').trim().replace(/\s+/g, ' ');
      if (t && t.length > 1 && !el.closest('.about-compass')) out.push(t);
    });
    // meta
    return { metaDesc: document.querySelector('meta[name="description"]').content, title: document.title, copy: [...new Set(out)] };
  });
  console.log('TITLE:', r.title);
  console.log('META:', r.metaDesc);
  r.copy.forEach((c, i) => console.log(String(i + 1).padStart(2, '0') + ' | ' + c));
  await browser.close();
})();
