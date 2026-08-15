const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('http://127.0.0.1:8092/story.html?as4=1', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2400);
  const out = await page.evaluate(() => {
    const R = el => { const r = el.getBoundingClientRect(); return { x: Math.round(r.x), w: Math.round(r.width), right: Math.round(r.right) }; };
    const vw = window.innerWidth;
    const pr = R(document.querySelector('.about-frame__portrait'));
    return { vw, portraitRight: pr.right, portraitFlush: Math.abs(pr.right - vw) <= 2 };
  });
  console.log('PORTRAIT:', JSON.stringify(out));
  // open ch03 (side right)
  await page.evaluate(() => {
    const t = document.querySelector('.about-act__trigger[aria-controls="aboutActPanel-03"]');
    if (t.getAttribute('aria-expanded') !== 'true') t.click();
  });
  await page.waitForTimeout(1400);
  const o3 = await page.evaluate(() => {
    const panel = document.getElementById('aboutActPanel-03');
    const fig = panel.querySelector('.about-figure');
    const fr = fig.getBoundingClientRect();
    const scene = panel.querySelector('.about-act__scene');
    const num = getComputedStyle(scene, '::before') ? getComputedStyle(scene, '::before').content : null;
    const head = panel.querySelector('.about-act__head');
    return {
      vw: window.innerWidth,
      figRight: Math.round(fr.right), figFlushRight: Math.abs(fr.right - window.innerWidth) <= 2,
      figLeft: Math.round(fr.left), figW: Math.round(fr.width),
      numeral: num, headSticky: getComputedStyle(head).position,
      world: getComputedStyle(scene).getPropertyValue('--world').trim(),
    };
  });
  console.log('OPEN03:', JSON.stringify(o3));
  // open ch02 (side left)
  await page.evaluate(() => document.querySelector('.about-act__trigger[aria-controls="aboutActPanel-02"]').click());
  await page.waitForTimeout(1400);
  const o2 = await page.evaluate(() => {
    const panel = document.getElementById('aboutActPanel-02');
    const fig = panel.querySelector('.about-figure');
    const fr = fig.getBoundingClientRect();
    return { figLeft: Math.round(fr.left), figFlushLeft: Math.abs(fr.left) <= 2, figRight: Math.round(fr.right) };
  });
  console.log('OPEN02:', JSON.stringify(o2));
  await browser.close();
})();
