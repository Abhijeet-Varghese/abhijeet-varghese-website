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
    return { opacity: +cs.opacity, inViewport: r.top < window.innerHeight && r.bottom > 0 };
  });
  // slow scroll to 0.9 then hold
  await seek(0.9);
  await page.waitForTimeout(3500);
  console.log('p=0.9  c8:', JSON.stringify(await state()));
  await seek(0.97);
  await page.waitForTimeout(3500);
  console.log('p=0.97 c8:', JSON.stringify(await state()));
  await page.screenshot({ path: '/home/user/previews/card8-hold.png' });
  await browser.close();
})();
