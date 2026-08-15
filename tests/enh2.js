const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('http://127.0.0.1:8092/story.html?as4=1', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);
  const r = await page.evaluate(() => {
    const l1 = document.querySelector('.about-prologue__line');
    const cs = getComputedStyle(l1);
    return { opacity: cs.opacity, filter: cs.filter, transform: cs.transform, anim: cs.animationName, animState: cs.animationPlayState, delay: cs.animationDelay, dur: cs.animationDuration };
  });
  console.log(JSON.stringify(r, null, 1));
  await browser.close();
})();
