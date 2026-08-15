const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('http://127.0.0.1:8092/story.html?as4=1', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2600);
  const seek = f => page.evaluate(frac => {
    const evo = document.querySelector('.about-evo3d');
    const scrollable = Math.max(evo.offsetHeight - window.innerHeight, 1);
    window.scrollTo(0, evo.getBoundingClientRect().top + window.scrollY + scrollable * frac);
  }, f);
  const shot = async (name) => {
    await page.waitForTimeout(1400);
    await page.screenshot({ path: `/home/user/previews/rf-${name}.png` });
  };
  await shot('01-hero');
  await page.evaluate(() => document.querySelector('.about-evo3d').scrollIntoView({ block: 'start' }));
  await page.waitForTimeout(1400);
  await shot('02-stack');
  await seek(0.16); await shot('03-card1-centered');
  await seek(0.34); await shot('04-card3');
  await seek(0.52); await shot('05-card4');
  await seek(0.63); await shot('06-interlude07-img');
  await seek(0.8); await shot('07-card6');
  await seek(0.97); await page.waitForTimeout(2600);
  await shot('08-card8-interlude-img');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(1000);
  await page.screenshot({ path: '/home/user/previews/rf-m1-hero.png' });
  await page.evaluate(() => document.querySelector('.about-evo3d').scrollIntoView({ block: 'start' }));
  await page.waitForTimeout(1400);
  await page.screenshot({ path: '/home/user/previews/rf-m2-stack.png' });
  await browser.close();
  console.log('REFINED SHOTS DONE');
})();
