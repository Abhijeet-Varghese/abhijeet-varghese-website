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
  const r = {};
  // sequence
  r.seq = await page.evaluate(() => [...document.querySelectorAll('.about-evo3d__card')].map(c => c.dataset.act).join(','));
  // progress remnants
  r.progress = await page.evaluate(() => ({
    rail: !!document.querySelector('.about-evo3d__rail'),
    fill: !!document.querySelector('.about-evo3d__fill, #evo3dFill, #aboutCompassFill'),
    compassBar: !!document.querySelector('.about-compass__bar'),
  }));
  // chapter card 03 — glass + big title + inline spans
  await seek(0.4); await page.waitForTimeout(2200);
  r.chapter = await page.evaluate(() => {
    const card = document.querySelector('.about-evo3d__card[data-act="03"]');
    const content = card.querySelector('.about-evo3d__content');
    const cs = getComputedStyle(content);
    const title = card.querySelector('.about-evo3d__title');
    const span = title.querySelector('span');
    return {
      glass: cs.backdropFilter !== 'none' && cs.backgroundColor !== 'rgba(0, 0, 0, 0)',
      titleFs: getComputedStyle(title).fontSize,
      spansInline: getComputedStyle(span).display === 'inline',
    };
  });
  // interlude card 07 — no glass + centered
  await seek(0.78); await page.waitForTimeout(2200);
  r.interlude = await page.evaluate(() => {
    const card = document.querySelector('.about-evo3d__card[data-act="07"]');
    const content = card.querySelector('.about-evo3d__content');
    const cs = getComputedStyle(content);
    const cr = card.getBoundingClientRect();
    const ct = content.getBoundingClientRect();
    return {
      glass: cs.backdropFilter !== 'none' || cs.backgroundColor !== 'rgba(0, 0, 0, 0)',
      centered: Math.abs((ct.top + ct.height / 2) - (cr.top + cr.height / 2)) < cr.height * 0.1,
      titleFs: getComputedStyle(card.querySelector('.about-evo3d__title')).fontSize,
    };
  });
  console.log('FINAL:', JSON.stringify(r, null, 1));
  await browser.close();
})();
