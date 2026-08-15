const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('http://127.0.0.1:8092/story.html?as4=1', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2600);
  const shot = async (name, y) => {
    await page.evaluate(y => window.scrollTo(0, y), y);
    await page.waitForTimeout(800);
    await page.screenshot({ path: `/home/user/previews/layout-${name}.png` });
  };
  await shot('01-theater', 0);
  await shot('02-spread', 950);
  await shot('03-stats', 3950);
  await page.evaluate(() => {
    const t = document.querySelector('.about-act__trigger[aria-controls="aboutActPanel-03"]');
    if (t.getAttribute('aria-expanded') !== 'true') t.click();
  });
  await page.waitForTimeout(1500);
  await shot('04-rail-scene', 4900);
  // 1920 wide shot of the rail
  await page.setViewportSize({ width: 1920, height: 900 });
  await page.waitForTimeout(800);
  await page.evaluate(() => {
    const panel = document.getElementById('aboutActPanel-03');
    window.scrollTo(0, panel.offsetTop - 60);
  });
  await page.waitForTimeout(900);
  await page.screenshot({ path: '/home/user/previews/layout-05-rail-1920.png' });
  await page.setViewportSize({ width: 768, height: 900 });
  await page.evaluate(() => window.scrollTo(0, 500));
  await page.waitForTimeout(900);
  await page.screenshot({ path: '/home/user/previews/layout-06-tablet-768.png' });
  await browser.close();
  console.log('LAYOUT SHOTS DONE');
})();
