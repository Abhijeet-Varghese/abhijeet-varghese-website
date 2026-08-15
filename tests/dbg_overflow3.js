const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto('http://127.0.0.1:8092/story.html?as4=1', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2200);
  const measure = () => page.evaluate(() => document.documentElement.scrollWidth);
  const base = await measure();
  const tests = [
    ['hide .about-prologue__mq', () => { document.querySelector('.about-prologue__mq').style.display = 'none'; }],
    ['hide .about-credits__mq', () => { document.querySelector('.about-credits__mq').style.display = 'none'; }],
    ['hide .about-reel', () => { document.querySelector('.about-reel').style.display = 'none'; }],
    ['hide prologue mq + reel + credits mq', () => {}],
  ];
  console.log('base scrollW:', base);
  for (const [name, fn] of tests) {
    await page.evaluate(fn);
    console.log(name, '→', await measure());
  }
  // now with all three hidden, find remaining offenders
  await page.evaluate(() => { document.querySelector('.about-reel').style.display = 'none'; document.querySelector('.about-prologue__mq').style.display = 'none'; document.querySelector('.about-credits__mq').style.display = 'none'; });
  const r = await page.evaluate(() => {
    const vw = window.innerWidth;
    const bad = [];
    document.querySelectorAll('body *').forEach(el => {
      const b = el.getBoundingClientRect();
      if (b.right > vw + 1) bad.push({ el: el.tagName + '.' + String(el.className).split(' ').slice(0,2).join('.'), right: Math.round(b.right), w: Math.round(b.width) });
    });
    return bad.slice(0, 15);
  });
  console.log('remaining:', JSON.stringify(r));
  await browser.close();
})();
