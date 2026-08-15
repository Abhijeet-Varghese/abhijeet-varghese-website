const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('http://127.0.0.1:8092/story.html?as4=1', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2600);
  const shot = async (name, y) => {
    await page.evaluate(y => window.scrollTo(0, y), y);
    await page.waitForTimeout(800);
    await page.screenshot({ path: `/home/user/previews/redesign-${name}.png` });
  };
  await shot('01-minimal-hub', 700);
  await shot('02-hub-nums-facts', 1500);
  await shot('03-reel-rows-thumbs', 3600);
  await page.evaluate(() => {
    const t = document.querySelector('.about-act__trigger[aria-controls="aboutActPanel-03"]');
    if (t.getAttribute('aria-expanded') !== 'true') t.click();
  });
  await page.waitForTimeout(1600);
  await shot('04-scene-backdrop', 4700);
  await page.evaluate(() => document.querySelector('.about-act__trigger[aria-controls="aboutActPanel-02"]').click());
  await page.waitForTimeout(1600);
  await shot('05-scene-backdrop-2', 4100);
  await page.evaluate(() => document.querySelector('.about-act__trigger[aria-controls="aboutActPanel-06"]').click());
  await page.waitForTimeout(1600);
  await shot('06-leadership-backdrop', 7200);
  // what filmography
  await shot('07-what-filmography', 10300);
  // mobile hub + scene
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => window.scrollTo(0, 700));
  await page.waitForTimeout(1000);
  await page.screenshot({ path: '/home/user/previews/redesign-m1-hub.png' });
  await page.evaluate(() => {
    const t = document.querySelector('.about-act__trigger[aria-controls="aboutActPanel-04"]');
    if (t.getAttribute('aria-expanded') !== 'true') t.click();
  });
  await page.waitForTimeout(1500);
  await page.evaluate(() => window.scrollTo(0, 4600));
  await page.waitForTimeout(1000);
  await page.screenshot({ path: '/home/user/previews/redesign-m2-scene.png' });
  await browser.close();
  console.log('REDESIGN SHOTS DONE');
})();
