const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  // MODAL at 320
  const page = await browser.newPage({ viewport: { width: 320, height: 800 } });
  await page.goto('http://127.0.0.1:8092/contact.html?m2=1', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1200);
  const modal = await page.evaluate(async () => {
    const embed = document.getElementById('bookEmbed');
    embed.hidden = false; embed.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    await new Promise(r => setTimeout(r, 450));
    const r = embed.getBoundingClientRect();
    return { rect: [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)], vw: innerWidth, vh: innerHeight, z: getComputedStyle(embed).zIndex, pad: getComputedStyle(embed).padding };
  });
  console.log('MODAL 320:', JSON.stringify(modal));
  // FOOTER at 1440
  const p2 = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await p2.goto('http://127.0.0.1:8092/?m2=2', { waitUntil: 'domcontentloaded' });
  await p2.waitForTimeout(1500);
  const footer = await p2.evaluate(() => {
    const f = document.querySelector('.footer__inner');
    const cols = Array.from(f.querySelectorAll('.footer__col')).map(c => Math.round(c.getBoundingClientRect().left));
    const brand = document.querySelector('.footer__brand').getBoundingClientRect();
    const bottom = document.querySelector('.footer__bottom');
    const br = bottom ? bottom.getBoundingClientRect() : null;
    return { brandLeft: Math.round(brand.left), colLefts: cols, bottomLeft: br ? Math.round(br.left) : null, bottomRight: br ? Math.round(br.right) : null, innerRight: Math.round(f.getBoundingClientRect().right), gridCols: getComputedStyle(f).gridTemplateColumns };
  });
  console.log('FOOTER 1440:', JSON.stringify(footer));
  await browser.close();
})();
