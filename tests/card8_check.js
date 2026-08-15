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
  const state = () => page.evaluate(() => {
    const c8 = document.querySelector('.about-evo3d__card[data-act="08"]');
    const cs = getComputedStyle(c8);
    const r = c8.getBoundingClientRect();
    return { opacity: +cs.opacity, transform: cs.transform.slice(0, 60), w: Math.round(r.width), visible: cs.opacity > 0.9 && r.width > 100 };
  });
  await seek(0.6);
  await page.waitForTimeout(1800);
  console.log('p=0.6  c8:', JSON.stringify(await state()));
  await seek(0.8);
  await page.waitForTimeout(1800);
  console.log('p=0.8  c8:', JSON.stringify(await state()));
  await seek(0.95);
  await page.waitForTimeout(2000);
  console.log('p=0.95 c8:', JSON.stringify(await state()));
  await seek(1);
  await page.waitForTimeout(2200);
  const s = await state();
  console.log('p=1.0  c8:', JSON.stringify(s));
  await page.screenshot({ path: '/home/user/previews/card8-visible.png' });
  console.log(s.visible ? 'CARD 8 FULLY VISIBLE' : 'CARD 8 NOT VISIBLE');
  await browser.close();
})();
