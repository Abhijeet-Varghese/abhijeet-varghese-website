const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('http://127.0.0.1:8092/story.html?as4=1', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);
  const seek = f => page.evaluate(frac => {
    const evo = document.querySelector('.about-evo3d');
    const scrollable = Math.max(evo.offsetHeight - window.innerHeight, 1);
    window.scrollTo(0, evo.getBoundingClientRect().top + window.scrollY + scrollable * frac);
  }, f);
  const shot = async (name, y) => {
    if (y !== undefined) await page.evaluate(y => window.scrollTo(0, y), y);
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `/home/user/previews/enh-${name}.png` });
  };
  await shot('01-hero-entrance', 0);
  await shot('02-spread', 950);
  await shot('03-facts-zoom', 2100);
  await page.evaluate(() => document.querySelector('.about-evo3d').scrollIntoView({ block: 'start' }));
  await page.waitForTimeout(1400);
  await shot('04-stack', null);
  await seek(0.18); await shot('05-chapter-front', null);
  await seek(0.45); await shot('06-chapter4', null);
  await seek(0.82); await shot('07-interlude-centered', null);
  await shot('08-what', 11600);
  await shot('09-credits', 13300);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(1200);
  await page.screenshot({ path: '/home/user/previews/enh-m1-hero.png' });
  await page.evaluate(() => document.querySelector('.about-evo3d').scrollIntoView({ block: 'start' }));
  await page.waitForTimeout(1400);
  await page.screenshot({ path: '/home/user/previews/enh-m2-stack.png' });
  await browser.close();
  console.log('ENH SHOTS DONE');
})();
