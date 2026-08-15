const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('http://127.0.0.1:8092/story.html?as4=1', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);
  await page.evaluate(() => {
    const t = document.querySelector('.about-act__trigger[aria-controls="aboutActPanel-03"]');
    if (t.getAttribute('aria-expanded') !== 'true') t.click();
  });
  await page.waitForTimeout(1400);
  const r = await page.evaluate(() => {
    const panel = document.getElementById('aboutActPanel-03');
    const scene = panel.querySelector('.about-act__scene');
    const fig = panel.querySelector('.about-figure');
    const body = panel.querySelector('.about-act__body');
    const cs = getComputedStyle(fig);
    const fr = fig.getBoundingClientRect();
    const br = body.getBoundingClientRect();
    const sr = scene.getBoundingClientRect();
    return {
      sceneGrid: getComputedStyle(scene).gridTemplateColumns,
      sceneX: Math.round(sr.x), sceneW: Math.round(sr.width), sceneRight: Math.round(sr.right),
      bodyX: Math.round(br.x), bodyRight: Math.round(br.right), bodyW: Math.round(br.width),
      figML: cs.marginLeft, figMR: cs.marginRight, figW: cs.width,
      figX: Math.round(fr.x), figRight: Math.round(fr.right),
      edge: getComputedStyle(document.body).getPropertyValue('--edge').trim(),
    };
  });
  console.log(JSON.stringify(r, null, 1));
  await browser.close();
})();
