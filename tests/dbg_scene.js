const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1920, height: 900 } });
  await page.goto('http://127.0.0.1:8092/story.html?as4=1', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2200);
  await page.evaluate(() => {
    const t = document.querySelector('.about-act__trigger[aria-controls="aboutActPanel-03"]');
    if (t.getAttribute('aria-expanded') !== 'true') t.click();
  });
  await page.waitForTimeout(1500);
  const r = await page.evaluate(() => {
    const panel = document.getElementById('aboutActPanel-03');
    const scene = panel.querySelector('.about-act__scene');
    const fig = panel.querySelector('.about-figure');
    const sheet = panel.querySelector('.about-act__sheet');
    const R = el => { const r = el.getBoundingClientRect(); return { x: Math.round(r.x), w: Math.round(r.width), right: Math.round(r.right), top: Math.round(r.top), h: Math.round(r.height) }; };
    const cs = getComputedStyle(fig);
    return {
      vw: window.innerWidth,
      scene: R(scene), fig: R(fig), sheet: R(sheet),
      figPos: cs.position, figInset: cs.inset, figMargin: cs.margin,
      edge: getComputedStyle(document.body).getPropertyValue('--edge').trim(),
      figParent: fig.parentElement.className,
      sceneGrid: getComputedStyle(scene).gridTemplateColumns,
      sheetGrid: getComputedStyle(sheet).gridTemplateColumns,
    };
  });
  console.log(JSON.stringify(r, null, 1));
  await browser.close();
})();
