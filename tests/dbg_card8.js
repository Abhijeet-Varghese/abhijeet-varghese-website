const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  page.on('pageerror', e => console.log('PAGE ERROR:', e.message.slice(0, 120)));
  await page.goto('http://127.0.0.1:8092/story.html?as4=1', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2500);
  await page.evaluate(() => {
    const evo = document.querySelector('.about-evo3d');
    const scrollable = Math.max(evo.offsetHeight - window.innerHeight, 1);
    window.scrollTo(0, evo.getBoundingClientRect().top + window.scrollY + scrollable * 0.97);
  });
  await page.waitForTimeout(4000);
  const r = await page.evaluate(() => {
    const cards = [...document.querySelectorAll('.about-evo3d__card')];
    return {
      total: cards.length,
      acts: cards.map(c => c.dataset.act),
      c8style: cards[7] ? cards[7].getAttribute('style') : null,
      c7op: getComputedStyle(cards[6]).opacity,
      stageTop: Math.round(document.querySelector('.about-evo3d__stage').getBoundingClientRect().top),
      scrollY: Math.round(window.scrollY),
      docH: document.documentElement.scrollHeight,
    };
  });
  console.log(JSON.stringify(r, null, 1));
  await browser.close();
})();
