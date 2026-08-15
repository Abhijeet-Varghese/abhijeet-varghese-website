const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  for (const path of ['/', '/case-studies.html']) {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto('http://127.0.0.1:8092' + path + '?fresh=' + Date.now(), { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1600);
    const r = await page.evaluate(() => {
      const client = document.querySelector('.case__client');
      const title = document.querySelector('.case__title');
      const cta = document.querySelector('.case__card-cta');
      if (!client || !title || !cta) return { missing: true };
      const cs = el => { const s = getComputedStyle(el); return { font: s.fontSize, bg: s.backgroundColor }; };
      return {
        clientFont: cs(client).font, clientText: client.textContent.trim(),
        titleFont: cs(title).font,
        clientBigger: parseFloat(cs(client).font) > parseFloat(cs(title).font),
        ctaText: cta.textContent.trim().replace(/\s+/g, ' ').slice(0, 26),
        ctaBg: cs(cta).bg,
        ctaTransparent: cs(cta).bg === 'rgba(0, 0, 0, 0)',
      };
    });
    console.log(path, JSON.stringify(r));
    await page.close();
  }
  await browser.close();
})();
