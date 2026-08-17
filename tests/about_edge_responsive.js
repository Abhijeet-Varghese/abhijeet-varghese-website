/* About edge-device certification: very narrow, short landscape, ultrawide and 4K. */
const { chromium } = require('playwright');
const SIZES = [
  { w: 280, h: 653 }, { w: 320, h: 480 },
  { w: 568, h: 320 }, { w: 667, h: 375 }, { w: 812, h: 375 },
  { w: 3440, h: 1440 }, { w: 3840, h: 2160 }, { w: 5120, h: 1440 }
];
(async () => {
  const browser = await chromium.launch();
  const issues = [];
  for (const size of SIZES) {
    const page = await browser.newPage({ viewport: { width: size.w, height: size.h } });
    const jsErrors = [];
    page.on('pageerror', e => jsErrors.push(e.message));
    await page.goto('http://127.0.0.1:8092/story.html?edge-responsive=1', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);
    await page.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; });

    const seekCard = async act => {
      await page.evaluate(act => {
        const runway = document.querySelector('.about-evo3d__scroll');
        const total = document.querySelectorAll('.about-evo3d__card').length;
        const rect = runway.getBoundingClientRect();
        const top = rect.top + scrollY;
        const range = Math.max(runway.offsetHeight - innerHeight, 1);
        const point = act === 1 ? 0 : (act - 1) + 0.12;
        scrollTo(0, top + range * point / (total + 1.2));
      }, act);
      await page.waitForFunction(act => {
        const card = document.querySelector(`.about-evo3d__card[data-act="${String(act).padStart(2, '0')}"]`);
        return card && card.classList.contains('is-front');
      }, act, { timeout: 6000 });
      return page.evaluate(act => {
        const card = document.querySelector(`.about-evo3d__card[data-act="${String(act).padStart(2, '0')}"]`);
        const content = card.querySelector('.about-evo3d__content');
        const c = card.getBoundingClientRect(), x = content.getBoundingClientRect();
        return {
          inCard: x.left >= c.left - 2 && x.right <= c.right + 2 && x.top >= c.top - 2 && x.bottom <= c.bottom + 2,
          inViewport: x.left >= -1 && x.right <= innerWidth + 1 && x.top >= -1 && x.bottom <= innerHeight + 1
        };
      }, act);
    };

    let cards = {};
    try {
      cards.one = await seekCard(1);
      cards.four = await seekCard(4);
      cards.eight = await seekCard(8);
    } catch (e) {
      issues.push(`${size.w}x${size.h}: card navigation timeout`);
    }

    const base = await page.evaluate(() => {
      scrollTo(0, 0);
      const title = document.querySelector('.about-prologue__title').getBoundingClientRect();
      const nav = document.querySelector('.site-nav__inner').getBoundingClientRect();
      return {
        overflow: document.documentElement.scrollWidth - innerWidth,
        titleFits: title.left >= -1 && title.right <= innerWidth + 1,
        navFits: nav.left >= -1 && nav.right <= innerWidth + 1,
        cards: document.querySelectorAll('.about-evo3d__card').length
      };
    });

    const bad = [];
    if (base.overflow) bad.push(`overflow ${base.overflow}`);
    if (!base.titleFits) bad.push('title');
    if (!base.navFits) bad.push('nav');
    if (base.cards !== 8) bad.push(`cards ${base.cards}`);
    for (const [name, result] of Object.entries(cards)) {
      if (!result.inCard || !result.inViewport) bad.push(`${name} ${JSON.stringify(result)}`);
    }
    if (jsErrors.length) bad.push(`JS ${jsErrors.join('|')}`);
    if (bad.length) issues.push(`${size.w}x${size.h}: ${bad.join(' · ')}`);
    console.log(`${size.w}x${size.h}: ${bad.length ? bad.join(' · ') : 'clean'}`);
    await page.close();
  }
  console.log(issues.length ? `EDGE RESPONSIVE ISSUES:\n${issues.join('\n')}` : 'ABOUT EDGE RESPONSIVE: ALL CLEAN');
  await browser.close();
  process.exit(issues.length ? 1 : 0);
})();
