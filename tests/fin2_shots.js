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
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `/home/user/previews/f2-${name}.png` });
  };
  await shot('01-hero');
  await page.evaluate(() => document.querySelector('.about-evo3d').scrollIntoView({ block: 'start' }));
  await page.waitForTimeout(1400);
  await shot('02-stack');
  await seek(0.16); await shot('03-chapter-big-title');
  await seek(0.42); await shot('04-chapter4');
  await seek(0.72); await shot('05-chapter6');
  await seek(0.82); await shot('06-interlude07-centered');
  await seek(0.95); await page.waitForTimeout(2800);
  await shot('07-interlude08-centered');
  await browser.close();
  console.log('FIN2 SHOTS DONE');
})();
