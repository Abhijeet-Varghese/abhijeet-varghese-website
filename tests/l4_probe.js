const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('http://127.0.0.1:8092/story.html?l4=1', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2600);
  // cursor active
  const cur = await page.evaluate(() => ({
    aboutCur: document.body.classList.contains('about-cur'),
    ring: !!document.querySelector('.arena-cur-ring'),
    cursorNone: getComputedStyle(document.body).cursor,
  }));
  console.log('CURSOR:', JSON.stringify(cur));
  // move over a chapter trigger → label OPEN
  await page.hover('.about-act__trigger[aria-controls="aboutActPanel-02"]');
  await page.waitForTimeout(500);
  const label = await page.evaluate(() => document.querySelector('.arena-cur-label').textContent);
  console.log('LABEL on trigger:', JSON.stringify(label));
  // move over portrait → VIEW
  await page.hover('.about-frame__portrait');
  await page.waitForTimeout(500);
  const label2 = await page.evaluate(() => document.querySelector('.arena-cur-label').textContent);
  console.log('LABEL on portrait:', JSON.stringify(label2));
  // rail name updates when chapter 04 enters
  await page.evaluate(() => document.querySelector('#act-04').scrollIntoView());
  await page.waitForTimeout(900);
  const rail = await page.evaluate(() => ({
    name: document.getElementById('aboutProgName').textContent,
    num: document.getElementById('aboutProgNum').textContent,
  }));
  console.log('RAIL:', JSON.stringify(rail));
  // spotlight vars after mouse over evolution
  await page.hover('.about-act__trigger[aria-controls="aboutActPanel-03"]');
  await page.waitForTimeout(600);
  const spot = await page.evaluate(() => {
    const sec = document.querySelector('.about-acts');
    return {
      on: sec.classList.contains('spot-on'),
      sx: sec.style.getPropertyValue('--sx'),
      sy: sec.style.getPropertyValue('--sy'),
    };
  });
  console.log('SPOTLIGHT:', JSON.stringify(spot));
  // credits marquee present + animating
  const mq = await page.evaluate(() => {
    const t = document.querySelector('.about-credits__mq-track');
    return { exists: !!t, anim: t ? getComputedStyle(t).animationName : null, dir: t ? getComputedStyle(t).animationDirection : null };
  });
  console.log('CREDITS MQ:', JSON.stringify(mq));
  await browser.close();
})();
