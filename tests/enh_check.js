const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('http://127.0.0.1:8092/story.html?as4=1', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2600);
  const r = {};
  // 1 · hero entrance: lines/chips animated then settled
  r.hero = await page.evaluate(() => {
    const l1 = document.querySelector('.about-prologue__line');
    const chip = document.querySelector('.about-prologue__role-chip');
    return {
      lineSettled: getComputedStyle(l1).opacity === '1' && getComputedStyle(l1).filter === 'none',
      lineAnim: getComputedStyle(l1).animationName !== 'none',
      chipAnim: getComputedStyle(chip).animationName !== 'none',
      mqMask: getComputedStyle(document.querySelector('.about-prologue__mq')).webkitMaskImage !== 'none',
    };
  });
  // 2 · portrait parallax transform applied when scrolled
  await page.evaluate(() => window.scrollTo(0, 1100));
  await page.waitForTimeout(700);
  r.portrait = await page.evaluate(() => {
    const img = document.querySelector('.about-frame__portrait img');
    return getComputedStyle(img).transform;
  });
  // 3 · zoom labels pill styling
  r.zoomLabel = await page.evaluate(() => getComputedStyle(document.querySelector('#aboutZoomLabels li')).borderRadius);
  // 4 · is-front on the active stack card
  const seek = f => page.evaluate(frac => {
    const evo = document.querySelector('.about-evo3d');
    const scrollable = Math.max(evo.offsetHeight - window.innerHeight, 1);
    window.scrollTo(0, evo.getBoundingClientRect().top + window.scrollY + scrollable * frac);
  }, f);
  await seek(0.3); await page.waitForTimeout(2200);
  r.front = await page.evaluate(() => {
    const cards = [...document.querySelectorAll('.about-evo3d__card')];
    const front = cards.filter(c => c.classList.contains('is-front')).map(c => c.dataset.act);
    return front.join(',');
  });
  // 5 · glass plate polish (::before highlight)
  r.glass = await page.evaluate(() => {
    const card = document.querySelector('.about-evo3d__card[data-act="03"]');
    const content = card.querySelector('.about-evo3d__content');
    return {
      blur: getComputedStyle(content).backdropFilter !== 'none',
      before: getComputedStyle(content, '::before').content === '""' || getComputedStyle(content, '::before').backgroundImage !== 'none',
    };
  });
  console.log('ENH:', JSON.stringify(r, null, 1));
  await browser.close();
})();
