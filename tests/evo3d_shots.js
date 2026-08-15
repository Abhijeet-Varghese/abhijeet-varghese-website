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
    await page.waitForTimeout(1200);
    await page.screenshot({ path: `/home/user/previews/evo3d-${name}.png` });
  };
  await shot('01-hero');
  await page.evaluate(() => document.querySelector('.about-evo3d').scrollIntoView({ block: 'start' }));
  await page.waitForTimeout(1400);
  await shot('02-stack-top');
  await seek(0.1); await shot('03-card1');
  await seek(0.3); await shot('04-card2-open');
  await seek(0.5); await shot('05-card3-active');
  await seek(0.7); await shot('06-card4');
  await seek(0.9); await shot('07-card5-6');
  await seek(1); await page.waitForTimeout(1600);
  await shot('08-stack-end');
  await page.evaluate(() => window.scrollTo(0, document.querySelector('.about-evo3d').getBoundingClientRect().top + document.querySelector('.about-evo3d').offsetHeight - 500));
  await page.waitForTimeout(1200);
  await shot('09-interludes');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(1000);
  await page.screenshot({ path: '/home/user/previews/evo3d-m1-hero.png' });
  await page.evaluate(() => document.querySelector('.about-evo3d').scrollIntoView({ block: 'start' }));
  await page.waitForTimeout(1400);
  await page.screenshot({ path: '/home/user/previews/evo3d-m2-stack.png' });
  await browser.close();
  console.log('EVO3D SHOTS DONE');
})();
