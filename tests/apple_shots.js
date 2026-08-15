const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('http://127.0.0.1:8092/story.html?as4=1', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2600);
  // compass sheet open (scrolled past prologue)
  await page.evaluate(() => window.scrollTo(0, 900));
  await page.waitForTimeout(900);
  await page.evaluate(() => { const b = document.getElementById('aboutCompassBtn'); const l = document.getElementById('aboutCompassList'); if (l.hidden) b.click(); });
  await page.waitForTimeout(600);
  await page.screenshot({ path: '/home/user/previews/story-r3f-10-compass-sheet.png' });
  await page.evaluate(() => document.getElementById('aboutCompassBtn').click());
  // open chapter 03 — material rail + lean
  await page.evaluate(() => {
    const t = document.querySelector('.about-act__trigger[aria-controls="aboutActPanel-03"]');
    if (t.getAttribute('aria-expanded') !== 'true') t.click();
  });
  await page.waitForTimeout(1600);
  await page.screenshot({ path: '/home/user/previews/story-r3f-11-material-rail.png' });
  // mid-scroll in the scene to show sticky rail over content
  await page.evaluate(() => {
    const panel = document.getElementById('aboutActPanel-03');
    window.scrollTo(0, panel.offsetTop + panel.offsetHeight * 0.45 - 300);
  });
  await page.waitForTimeout(900);
  await page.screenshot({ path: '/home/user/previews/story-r3f-12-sticky-rail.png' });
  await browser.close();
  console.log('APPLE SHOTS DONE');
})();
