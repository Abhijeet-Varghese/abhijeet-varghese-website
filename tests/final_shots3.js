const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('http://127.0.0.1:8092/story.html?as4=1', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2600);
  const shot = async (name, y) => {
    await page.evaluate(y => window.scrollTo(0, y), y);
    await page.waitForTimeout(800);
    await page.screenshot({ path: `/home/user/previews/final2-${name}.png` });
  };
  await shot('01-hub-full', 700);
  await shot('02-hub-nums-facts', 1650);
  await shot('03-reel-thumbs', 3400);
  await page.evaluate(() => {
    const t = document.querySelector('.about-act__trigger[aria-controls="aboutActPanel-03"]');
    if (t.getAttribute('aria-expanded') !== 'true') t.click();
  });
  await page.waitForTimeout(1600);
  await shot('04-scene-backdrop', 4600);
  await page.evaluate(() => document.querySelector('.about-act__trigger[aria-controls="aboutActPanel-06"]').click());
  await page.waitForTimeout(1600);
  await shot('05-leadership', 7000);
  await shot('06-what-filmography', 10100);
  await browser.close();
  console.log('FINAL2 SHOTS DONE');
})();
