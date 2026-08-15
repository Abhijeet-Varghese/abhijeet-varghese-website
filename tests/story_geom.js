const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('http://127.0.0.1:8092/story.html?as4=1', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2600);
  const g = await page.evaluate(() => {
    const R = el => { const r = el.getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height), right: Math.round(r.right), bottom: Math.round(r.bottom) }; };
    const cs = (el, p) => getComputedStyle(el)[p];
    const out = {};
    // canvas layers
    out.reel = { exists: !!document.getElementById('aboutReelTrack'), frames: document.querySelectorAll('.about-reel__frame').length, opacity: cs(document.querySelector('.about-reel'), 'opacity') };
    out.grain = { exists: !!document.querySelector('.about-grain'), opacity: cs(document.querySelector('.about-grain'), 'opacity') };
    // prologue
    const ap = document.querySelector('.about-prologue__aperture');
    out.aperture = R(ap);
    const title = document.querySelector('.about-prologue__title');
    out.title = { fs: cs(title, 'fontSize'), ls: cs(title, 'letterSpacing'), lh: cs(title, 'lineHeight') };
    out.bars = { top: R(document.querySelector('.about-prologue__bar--top')).h, bottom: R(document.querySelector('.about-prologue__bar--bottom')).h };
    out.reelTag = cs(document.querySelector('.about-prologue__reel-tag'), 'display');
    out.mq = { exists: !!document.querySelector('.about-prologue__mq'), anim: cs(document.querySelector('.about-prologue__mq-track'), 'animationName') };
    // identity spread
    const port = document.querySelector('.about-frame__portrait');
    const pr = R(port);
    out.portrait = { ...pr, vw: window.innerWidth, bleedsRight: pr.right >= window.innerWidth - 2 };
    out.statement = { fs: cs(document.querySelector('.about-frame__statement'), 'fontSize'), ls: cs(document.querySelector('.about-frame__statement'), 'letterSpacing') };
    out.nums = Array.from(document.querySelectorAll('.about-frame__num strong')).map(n => cs(n, 'fontSize'));
    out.zoomViewport = R(document.querySelector('.about-zoomstage__viewport'));
    out.zoomScale = cs(document.getElementById('aboutZoomFrame'), 'transform');
    // stats
    out.statsGrid = cs(document.querySelector('.about-stats__grid'), 'gridTemplateColumns');
    // acts
    const trig = document.querySelector('.about-act__trigger[aria-controls="aboutActPanel-03"]');
    const trigNum = getComputedStyle(trig, '::before').content;
    out.trigger = { ghost: trigNum, nameFs: cs(trig.querySelector('.about-act__name'), 'fontSize') };
    // open ch03
    const t = document.querySelector('.about-act__trigger[aria-controls="aboutActPanel-03"]');
    if (t.getAttribute('aria-expanded') !== 'true') t.click();
    return out;
  });
  console.log('GEO:', JSON.stringify(g, null, 1));
  await page.waitForTimeout(1300);
  const g2 = await page.evaluate(() => {
    const R = el => { const r = el.getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height), right: Math.round(r.right) }; };
    const cs = (el, p) => getComputedStyle(el)[p];
    const panel = document.getElementById('aboutActPanel-03');
    const out = {};
    out.panelH = Math.round(panel.getBoundingClientRect().height);
    out.headPos = cs(panel.querySelector('.about-act__head'), 'position');
    out.sceneNumeral = cs(panel.querySelector('.about-act__scene'), '::before').content;
    const fig = panel.querySelector('.about-figure');
    const fr = R(fig);
    out.figure = { ...fr, vw: window.innerWidth, bleedsRight: fr.right >= window.innerWidth - 2 };
    const ghost = panel.querySelector('.about-act__ghost');
    out.ghost = { display: cs(ghost, 'display'), z: cs(ghost, 'zIndex') };
    out.world = getComputedStyle(panel.querySelector('.about-act__scene')).getPropertyValue('--world');
    out.sheetZ = cs(panel.querySelector('.about-act__sheet'), 'zIndex');
    return out;
  });
  console.log('OPEN:', JSON.stringify(g2, null, 1));
  await browser.close();
})();
