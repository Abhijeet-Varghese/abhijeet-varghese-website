const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  await page.goto('http://127.0.0.1:8092/story.html?as4=1', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2800);
  const shot = async (name, y) => {
    await page.evaluate(y => window.scrollTo(0, y), y);
    await page.waitForTimeout(900);
    await page.screenshot({ path: `/home/user/previews/story-r3-${name}.png` });
  };
  await shot('01-prologue', 0);
  await shot('02-identity-spread', 800);
  await shot('03-nums-facts', 2150);
  await shot('04-zoomstage', 3100);
  await shot('05-stats-bridge', 3950);
  // collapsed row with hover preview
  await page.evaluate(() => window.scrollTo(0, 4550));
  await page.waitForTimeout(600);
  await page.hover('.about-act__trigger[aria-controls="aboutActPanel-02"]');
  await page.waitForTimeout(700);
  await page.screenshot({ path: '/home/user/previews/story-r3-06-chapter-hover.png' });
  // open chapter 03 (environment, side right)
  await page.evaluate(() => {
    const t = document.querySelector('.about-act__trigger[aria-controls="aboutActPanel-03"]');
    if (t.getAttribute('aria-expanded') !== 'true') t.click();
  });
  await page.waitForTimeout(1400);
  await shot('07-chapter-open-env', 5050);
  // chapter 04 system
  await page.evaluate(() => document.querySelector('.about-act__trigger[aria-controls="aboutActPanel-04"]').click());
  await page.waitForTimeout(1400);
  await shot('08-chapter-system', 6400);
  // interlude
  await shot('09-interlude', 7350);
  // chapter 06 leadership
  await page.evaluate(() => document.querySelector('.about-act__trigger[aria-controls="aboutActPanel-06"]').click());
  await page.waitForTimeout(1400);
  await shot('10-leadership', 8600);
  // closing bands + credits
  await shot('11-philosophy-what', 10400);
  await shot('12-curious-credits', 11800);
  // mobile
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(1200);
  await page.screenshot({ path: '/home/user/previews/story-r3-m1-prologue.png' });
  await page.evaluate(() => window.scrollTo(0, 1400));
  await page.waitForTimeout(1000);
  await page.screenshot({ path: '/home/user/previews/story-r3-m2-spread.png' });
  await page.evaluate(() => window.scrollTo(0, 2900));
  await page.waitForTimeout(1000);
  await page.screenshot({ path: '/home/user/previews/story-r3-m3-chapter.png' });
  await browser.close();
  console.log('SHOTS DONE');
})();
