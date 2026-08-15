const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('http://127.0.0.1:8092/story.html?as4=1', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);
  const r = await page.evaluate(() => {
    const role = document.querySelector('.about-prologue__role');
    const credsRole = document.querySelector('.about-credits__role');
    return {
      prologueRole: role ? role.textContent : null,
      prologueRoleHTML: role ? role.innerHTML : null,
      creditsRole: credsRole ? credsRole.textContent : null,
    };
  });
  console.log(JSON.stringify(r, null, 1));
  await browser.close();
})();
