const { chromium } = require('playwright');
const SIZES = [
  { w: 320, h: 568 }, { w: 360, h: 640 }, { w: 375, h: 667 }, { w: 390, h: 844 },
  { w: 414, h: 896 }, { w: 480, h: 800 }, { w: 600, h: 960 }, { w: 700, h: 900 },
  { w: 768, h: 1024 }, { w: 834, h: 1112 }, { w: 1024, h: 768 }, { w: 1080, h: 810 },
  { w: 1280, h: 800 }, { w: 1366, h: 768 }, { w: 1440, h: 900 }, { w: 1536, h: 864 },
  { w: 1680, h: 1050 }, { w: 1920, h: 1080 }, { w: 2560, h: 1440 },
  { w: 844, h: 390 }, { w: 1024, h: 600 }, { w: 1366, h: 640 },
];
(async () => {
  const browser = await chromium.launch();
  const issues = [];
  for (const s of SIZES) {
    const page = await browser.newPage({ viewport: { width: s.w, height: s.h } });
    await page.goto('http://127.0.0.1:8092/story.html?as4=1', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1400);
    const r = await page.evaluate(async () => {
      const vw = window.innerWidth, vh = window.innerHeight;
      const out = { overflow: document.documentElement.scrollWidth - vw };
      const inVp = el => {
        if (!el) return true;
        const r = el.getBoundingClientRect();
        return r.right <= vw + 1 && r.left >= -1;
      };
      const title = document.querySelector('.about-prologue__title');
      out.hero = inVp(title);
      // scroll through sections
      const stage = document.querySelector('.about-evo3d__stage');
      if (stage) {
        document.documentElement.style.scrollBehavior = 'auto';
        window.scrollTo(0, stage.getBoundingClientRect().top + window.scrollY - 2);
        await new Promise(res => setTimeout(res, 900));
        const sr = stage.getBoundingClientRect();
        out.stage = Math.abs(sr.width - vw) <= 2 && Math.abs(sr.height - vh) <= 2 && sr.top <= 8 && sr.bottom >= vh - 8;
        const card = document.querySelector('.about-evo3d__card');
        out.cardContent = inVp(card.querySelector('.about-evo3d__content'));
      }
      for (const [sel, key] of [['.about-what', 'what'], ['.about-now', 'now'], ['.about-credits', 'credits'], ['.about-curious', 'curious']]) {
        const sec = document.querySelector(sel);
        if (sec) {
          sec.scrollIntoView({ block: 'start' });
          await new Promise(res => setTimeout(res, 400));
          const inner = sec.querySelector('.container, .about-credits__inner');
          out[key] = inVp(inner || sec);
        }
      }
      return out;
    });
    const bad = [];
    if (r.overflow > 0) bad.push('overflow ' + r.overflow);
    if (!r.hero) bad.push('hero');
    if (!r.stage) bad.push('stage');
    if (!r.cardContent) bad.push('cardContent');
    if (!r.what) bad.push('what');
    if (!r.now) bad.push('now');
    if (!r.credits) bad.push('credits');
    if (bad.length) issues.push(`${s.w}x${s.h}: ${bad.join(' · ')}`);
    console.log(`${s.w}x${s.h}: ${bad.length ? 'FAIL ' + bad.join(' · ') : 'ok'} stage=${JSON.stringify(r.stage)} overflow=${r.overflow}`);
    await page.close();
  }
  console.log(issues.length ? 'RESP ISSUES:\n' + issues.join('\n') : 'RESPONSIVE EXTENDED: ALL CLEAN');
  await browser.close();
})();
