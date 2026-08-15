const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('http://127.0.0.1:8092/?f=' + Date.now(), { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1200);
  const desktop = await page.evaluate(() => {
    const bad = [];
    document.querySelectorAll('body *').forEach(el => {
      if (el.children.length) return;
      const cs = getComputedStyle(el);
      if (cs.display === 'none' || cs.visibility === 'hidden') return;
      // skip elements inside hidden ancestors
      let p = el; let hiddenAncestor = false;
      while (p = p.parentElement) { if (p.hidden || getComputedStyle(p).display === 'none') { hiddenAncestor = true; break; } }
      if (hiddenAncestor) return;
      const t = (el.textContent || '').trim();
      if (/^\d{1,2}( \/ \d{1,2})?$/.test(t) && !el.closest('.datepick') && !el.closest('.tslots')) bad.push(t + ' @' + (el.className || el.tagName).toString().slice(0, 30));
    });
    return bad;
  });
  // mobile menu open
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('http://127.0.0.1:8092/?m=' + Date.now(), { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(800);
  await page.click('#navToggle');
  await page.waitForTimeout(700);
  const mobile = await page.evaluate(() => {
    const bad = [];
    document.querySelectorAll('.mobile-menu *').forEach(el => {
      if (el.children.length) return;
      const t = (el.textContent || '').trim();
      if (/^\d{1,2}$/.test(t)) bad.push(t + ' @' + (el.className || el.tagName).toString().slice(0, 30));
    });
    return { menuItems: Array.from(document.querySelectorAll('.mobile-menu__list a')).map(a => a.textContent.trim()), numbers: bad };
  });
  console.log('DESKTOP visible standalone numbers:', JSON.stringify(desktop));
  console.log('MOBILE menu:', JSON.stringify(mobile));
  await browser.close();
})();
