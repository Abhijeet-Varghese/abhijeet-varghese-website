const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const out = {};
  // 1. Calendly embed modal at 320px
  const page = await browser.newPage({ viewport: { width: 320, height: 800 } });
  await page.goto('http://127.0.0.1:8092/contact.html?mf=1', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1200);
  out.modal320 = await page.evaluate(async () => {
    const embed = document.getElementById('bookEmbed');
    // simulate open (as JS does)
    embed.hidden = false; embed.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    await new Promise(r => setTimeout(r, 400));
    const r = embed.getBoundingClientRect();
    const bar = document.querySelector('.book__embed-bar').getBoundingClientRect();
    const frame = document.getElementById('bookEmbedFrame').getBoundingClientRect();
    return {
      rect: [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)],
      coversViewport: r.left <= 0 && r.top <= 0 && r.width >= 320 && r.height >= 800,
      barCentered: Math.abs((bar.left + bar.width / 2) - 160) < 4,
      frameW: Math.round(frame.width), frameH: Math.round(frame.height),
      bodyLocked: getComputedStyle(document.body).overflow === 'hidden',
      overflow: document.documentElement.scrollWidth - window.innerWidth,
      z: getComputedStyle(embed).zIndex,
      escWorks: true,
    };
  });
  // escape closes
  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);
  out.modal320.escClosed = await page.evaluate(() => document.getElementById('bookEmbed').hidden === true && document.body.style.overflow === '');
  // 2. footer alignment + structure
  await page.goto('http://127.0.0.1:8092/?mf=2', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1200);
  out.footer = await page.evaluate(() => {
    const f = document.querySelector('.footer__inner');
    const cols = Array.from(f.querySelectorAll('.footer__col')).map(c => {
      const r = c.getBoundingClientRect();
      return { left: Math.round(r.left), top: Math.round(r.top) };
    });
    const brand = document.querySelector('.footer__brand').getBoundingClientRect();
    const colTops = [...new Set(cols.map(c => c.top))];
    return { brandLeft: Math.round(brand.left), colLefts: [...new Set(cols.map(c => c.left))], colTops, colCount: cols.length, topLine: !!document.querySelector('.footer__topline'), backTop: !!document.querySelector('.footer__top'), note: document.querySelector('.footer__note') ? document.querySelector('.footer__note').textContent.trim().slice(0, 40) : null };
  });
  // 3. reduced motion: everything visible without JS-driven reveals
  const rm = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  await rm.goto('http://127.0.0.1:8092/?mf=3', { waitUntil: 'domcontentloaded' });
  await rm.waitForTimeout(1600);
  out.reducedMotion = await rm.evaluate(() => {
    const hidden = [];
    document.querySelectorAll('[data-reveal]').forEach(el => {
      const cs = getComputedStyle(el);
      if (cs.opacity !== '1' || el.getBoundingClientRect().height === 0) hidden.push((el.className || '').toString().slice(0, 30));
    });
    // homepage hero is the hybrid portrait; story/about pages use .hero__media
    const heroEl = document.querySelector('.hero__media') || document.querySelector('.hp-hero__portrait') || null;
    return { hiddenCount: hidden.length, heroMediaOpacity: heroEl ? getComputedStyle(heroEl).opacity : 'n/a', sample: hidden.slice(0, 5) };
  });
  await rm.close();
  // 4. performance: LCP preload, hero fetchpriority, font files, sizes
  await page.goto('http://127.0.0.1:8092/?mf=4', { waitUntil: 'networkidle' });
  out.perf = await page.evaluate(async () => {
    const res = [];
    const preload = Array.from(document.querySelectorAll('link[rel="preload"]')).map(l => l.getAttribute('href'));
    res.push('preloads: ' + (preload.join(', ') || 'NONE'));
    const heroImg = document.querySelector('.hero__media img') || document.querySelector('.hp-hero__portrait img');
    res.push('hero: fetchpriority=' + heroImg.getAttribute('fetchpriority') + ' w/h=' + heroImg.getAttribute('width') + 'x' + heroImg.getAttribute('height'));
    const css = document.querySelector('link[rel="stylesheet"]');
    if (css) {
      const rr = await fetch(css.getAttribute('href')).then(r => r.text()).catch(() => '');
      res.push('css size: ' + Math.round(rr.length / 1024) + 'KB');
    }
    const js = document.querySelector('script[src]');
    if (js) {
      const jr = await fetch(js.getAttribute('src')).then(r => r.text()).catch(() => '');
      res.push('js size: ' + Math.round(jr.length / 1024) + 'KB');
    }
    return res;
  });
  console.log(JSON.stringify(out, null, 1));
  await browser.close();
})();
