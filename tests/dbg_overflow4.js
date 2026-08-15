const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto('http://127.0.0.1:8092/story.html?as4=1', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2200);
  const r = await page.evaluate(() => {
    const vw = window.innerWidth;
    const out = [];
    document.querySelectorAll('li').forEach(li => {
      const b = li.getBoundingClientRect();
      if (b.right > vw + 1) {
        out.push({
          cls: li.className, text: li.textContent.trim().slice(0, 40),
          right: Math.round(b.right), left: Math.round(b.left), w: Math.round(b.width),
          parent: li.parentElement.className,
          disp: getComputedStyle(li).display,
        });
      }
    });
    return out;
  });
  console.log(JSON.stringify(r, null, 1));
  await browser.close();
})();
