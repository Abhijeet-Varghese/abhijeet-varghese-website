const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('http://127.0.0.1:8092/story.html?as4=1', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2600);
  const shot = async (name, y) => {
    await page.evaluate(y => window.scrollTo(0, y), y);
    await page.waitForTimeout(900);
    await page.screenshot({ path: `/home/user/previews/r2-${name}.png` });
  };
  await shot('01-storyboard', 800);
  await shot('02-storyboard-credo', 1750);
  await shot('03-reel-spine-rows', 3300);
  await page.evaluate(() => {
    const t = document.querySelector('.about-act__trigger[aria-controls="aboutActPanel-04"]');
    if (t.getAttribute('aria-expanded') !== 'true') t.click();
  });
  await page.waitForTimeout(1600);
  await shot('04-scene-reeltag', 5800);
  await page.evaluate(() => document.querySelector('.about-act__trigger[aria-controls="aboutActPanel-01"]').click());
  await page.waitForTimeout(1600);
  await shot('05-spine-filled', 3900);
  await shot('06-what-credits', 10100);
  // spine fill mid-scroll check
  const spine = await page.evaluate(() => {
    const acts = document.querySelector('.about-acts');
    return getComputedStyle(acts).getPropertyValue('--spine').trim();
  });
  console.log('SPINE VAR:', spine);
  await browser.close();
})();
