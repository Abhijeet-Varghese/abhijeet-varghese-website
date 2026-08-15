const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('http://127.0.0.1:8092/story.html?as4=1', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2400);
  const seek = f => page.evaluate(frac => {
    const evo = document.querySelector('.about-evo3d');
    const scrollable = Math.max(evo.offsetHeight - window.innerHeight, 1);
    window.scrollTo(0, evo.getBoundingClientRect().top + window.scrollY + scrollable * frac);
  }, f);
  // settle near the end via intermediate stops
  await seek(0.8);
  await page.waitForTimeout(2500);
  await seek(0.97);
  await page.waitForTimeout(4500);
  const s = await page.evaluate(() => {
    const c8 = document.querySelector('.about-evo3d__card[data-act="08"]');
    const cs = getComputedStyle(c8);
    const r = c8.getBoundingClientRect();
    return { opacity: +cs.opacity, top: Math.round(r.top), bottom: Math.round(r.bottom), vh: window.innerHeight, transform: cs.transform.slice(0, 70) };
  });
  console.log('CARD 8 @end:', JSON.stringify(s));
  await page.screenshot({ path: '/home/user/previews/rb-08-card8-final.png' });
  await browser.close();
})();
