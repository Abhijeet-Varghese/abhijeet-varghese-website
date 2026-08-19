/* Evolution pacing and response regression. */
const { chromium } = require('playwright');
const BASE = process.argv[2] || 'http://127.0.0.1:8092';
(async () => {
  const browser = await chromium.launch();
  const issues = [];
  for (const viewport of [{width:1440,height:900,runway:480},{width:390,height:844,runway:440}]) {
    const page = await browser.newPage({ viewport });
    await page.goto(BASE + '/story.html', { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; });
    await page.waitForTimeout(800);
    const ratio = await page.evaluate(() => document.querySelector('.about-evo3d__scroll').offsetHeight / innerHeight * 100);
    if (Math.abs(ratio - viewport.runway) > 3) issues.push(`${viewport.width}px runway ${ratio.toFixed(1)}vh`);
    for (const index of [1,2,4,6,8]) {
      await page.evaluate(index => {
        const runway = document.querySelector('.about-evo3d__scroll');
        const cards = document.querySelectorAll('.about-evo3d__card');
        const top = runway.getBoundingClientRect().top + scrollY;
        const scrollable = Math.max(runway.offsetHeight - innerHeight, 1);
        const point = index === 1 ? 0 : (index - 1) + .12;
        scrollTo(0, top + scrollable * (point / (cards.length + 1.2)));
      }, index);
      await page.waitForTimeout(600);
      const active = await page.evaluate(() => Number(document.querySelector('.about-evo3d__card.is-front')?.dataset.act || 0));
      if (Math.abs(active - index) > 1) issues.push(`${viewport.width}px seek ${index} responded as ${active}`);
    }
    await page.close();
  }
  await browser.close();
  if (issues.length) { console.error('EVOLUTION SPEED QA: ISSUES\n' + issues.join('\n')); process.exit(1); }
  console.log('EVOLUTION SPEED QA: ALL CLEAN — 480/440vh runway; direct scroll tracking; sampled cards settle correctly');
})();
