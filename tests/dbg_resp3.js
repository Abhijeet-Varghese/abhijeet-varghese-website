const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto('http://127.0.0.1:8092/story.html?as4=1', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1600);
  const r = await page.evaluate(async () => {
    const vw = window.innerWidth, vh = window.innerHeight;
    const stage = document.querySelector('.about-evo3d__stage');
    const abs = stage.getBoundingClientRect().top + window.scrollY;
    window.scrollTo(0, abs - 2);
    await new Promise(res => setTimeout(res, 900));
    const sr = stage.getBoundingClientRect();
    return {
      vw, vh,
      top: Math.round(sr.top), bottom: Math.round(sr.bottom),
      w: Math.round(sr.width), h: Math.round(sr.height),
      checks: {
        wOk: Math.abs(sr.width - vw) <= 2,
        hOk: Math.abs(sr.height - vh) <= 2,
        topOk: sr.top <= 8,
        botOk: sr.bottom >= vh - 8,
      },
    };
  });
  console.log(JSON.stringify(r, null, 1));
  await browser.close();
})();
