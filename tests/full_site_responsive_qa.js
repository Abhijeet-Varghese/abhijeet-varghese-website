/* Entire public website: predefined matrix, continuous resizing and high-DPI QA. */
const { chromium } = require('playwright');

const BASE = process.argv[2] || 'http://127.0.0.1:8092';
const PAGES = [
  '/', '/story.html', '/experience.html', '/case-studies.html', '/portfolio.html',
  '/contact.html', '/insights.html', '/journal.html', '/for-recruiters.html',
  '/consulting.html', '/sitemap.html', '/privacy-policy.html', '/terms.html',
  '/search.html', '/404.html',
  '/case-study-intuitive-experiences-for-industrial-environments.html',
  '/case-study-immersive-solutions-for-the-indian-army.html',
  '/experience-design/orange-business-executive-briefing-center/',
  '/essay-technology-should-feel-human.html', '/essay-ai-isnt-replacing-creativity.html',
  '/essay-designing-experiences-people-remember.html', '/essay-why-enterprise-experiences-fail.html',
  '/journal-what-a-year-of-ai-enabled-production-taught-me.html',
  '/journal-the-experience-centre-as-a-strategic-instrument.html'
];
const SIZES = [
  [280, 653], [320, 568], [360, 640], [375, 667], [390, 844], [414, 896], [480, 800],
  [600, 960], [768, 1024], [834, 1112], [900, 900], [901, 900], [1024, 768], [1280, 800],
  [1366, 768], [1440, 900], [1536, 864], [1920, 1080], [2560, 1440],
  [3440, 1440], [3840, 2160], [568, 320], [667, 375], [844, 390], [1024, 600]
];
const SWEEP_PAGES = ['/', '/story.html', '/experience.html', '/case-studies.html', '/portfolio.html', '/contact.html', '/experience-design/orange-business-executive-briefing-center/'];

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 320, height: 568 } });
  const issues = [];
  let currentPath = '';
  page.on('pageerror', error => issues.push(`${currentPath}: JS ${error.message}`));
  page.on('requestfailed', request => {
    if (request.url().includes('/api/analytics/track')) return;
    issues.push(`${currentPath}: request failed ${request.url()} (${request.failure()?.errorText || 'unknown'})`);
  });
  await page.route('**/api/analytics/track', route => route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true,"data":{}}' }));

  const inspect = () => page.evaluate(() => {
    const visible = element => {
      const style = getComputedStyle(element);
      return style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity) > 0 && element.getClientRects().length > 0;
    };
    const intentionallyClipped = element => {
      let parent = element.parentElement;
      while (parent && parent !== document.body) {
        const overflow = getComputedStyle(parent).overflowX;
        if (overflow === 'hidden' || overflow === 'clip' || overflow === 'auto' || overflow === 'scroll') return true;
        parent = parent.parentElement;
      }
      return false;
    };
    const outside = [...document.querySelectorAll('h1,h2,h3,.btn,button')]
      .filter(visible)
      .filter(element => {
        const rect = element.getBoundingClientRect();
        return !intentionallyClipped(element) && (rect.left < -1 || rect.right > innerWidth + 1);
      })
      .slice(0, 5)
      .map(element => `${element.tagName}.${element.className || ''}:${element.textContent.trim().replace(/\s+/g, ' ').slice(0, 40)}`);
    const nav = document.querySelector('.site-nav__inner');
    const navRect = nav?.getBoundingClientRect();
    const compact = innerWidth <= 900;
    const navLinks = document.querySelector('.nav-links');
    const navToggle = document.querySelector('#navToggle');
    const mediaOutside = [...document.querySelectorAll('img,video,iframe')]
      .filter(visible)
      .filter(element => {
        if (intentionallyClipped(element)) return false;
        const rect = element.getBoundingClientRect();
        return rect.left < -2 || rect.right > innerWidth + 2;
      })
      .slice(0, 5)
      .map(element => element.currentSrc || element.src || element.tagName);
    return {
      overflow: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - innerWidth,
      h1: document.querySelectorAll('h1').length,
      outside,
      mediaOutside,
      navInside: !navRect || (navRect.left >= -1 && navRect.right <= innerWidth + 1),
      navHeight: navRect?.height || 0,
      navMode: {
        compact,
        links: navLinks ? getComputedStyle(navLinks).display : 'missing',
        toggle: navToggle ? getComputedStyle(navToggle).display : 'missing'
      },
      footer: document.querySelectorAll('footer.footer--arena').length,
      header: document.querySelectorAll('header.site-nav').length
    };
  });

  for (const path of PAGES) {
    currentPath = path;
    await page.setViewportSize({ width: 320, height: 568 });
    const response = await page.goto(BASE + path, { waitUntil: 'domcontentloaded', timeout: 30000 });
    if (!response || response.status() !== 200) issues.push(`${path}: HTTP ${response?.status()}`);
    for (const [width, height] of SIZES) {
      await page.setViewportSize({ width, height });
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      const result = await inspect();
      const at = `${path} @ ${width}×${height}`;
      if (result.overflow > 1) issues.push(`${at}: horizontal overflow +${result.overflow}px`);
      if (result.h1 !== 1) issues.push(`${at}: H1 count ${result.h1}`);
      if (result.outside.length) issues.push(`${at}: viewport escape ${result.outside.join(' | ')}`);
      if (result.mediaOutside.length) issues.push(`${at}: media escape ${result.mediaOutside.join(' | ')}`);
      if (!result.navInside || result.navHeight > 100) issues.push(`${at}: navbar bounds/height ${result.navHeight}`);
      if (result.header !== 1 || result.footer !== 1) issues.push(`${at}: shared chrome ${result.header}/${result.footer}`);
      if (width <= 900 && (result.navMode.links !== 'none' || result.navMode.toggle === 'none')) issues.push(`${at}: compact nav mode failed`);
      if (width > 900 && (result.navMode.links === 'none' || result.navMode.toggle !== 'none')) issues.push(`${at}: desktop nav mode failed`);
    }

    // Traverse every lazy-loaded image once and verify it decodes.
    await page.setViewportSize({ width: 390, height: 844 });
    await page.evaluate(async () => {
      for (let y = 0; y < document.documentElement.scrollHeight; y += innerHeight * .85) {
        scrollTo(0, y);
        await new Promise(resolve => setTimeout(resolve, 12));
      }
    });
    await page.waitForTimeout(80);
    const broken = await page.evaluate(() => [...document.images]
      .filter(image => image.complete && image.naturalWidth === 0)
      .map(image => image.currentSrc || image.src));
    if (broken.length) issues.push(`${path}: broken images ${broken.join(', ')}`);
  }

  // Continuous widths catch breakage between named breakpoints without reloading.
  for (const path of SWEEP_PAGES) {
    currentPath = `${path} continuous sweep`;
    await page.goto(BASE + path, { waitUntil: 'domcontentloaded' });
    for (let width = 320; width <= 1920; width += 37) {
      await page.setViewportSize({ width, height: width < 700 ? 760 : 900 });
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(resolve)));
      const result = await inspect();
      if (result.overflow > 1 || !result.navInside || result.outside.length || result.mediaOutside.length) {
        issues.push(`${path} continuous @${width}: ${JSON.stringify(result)}`);
        break;
      }
    }
  }

  // Retina/high-DPI rendering does not change CSS geometry or break media.
  for (const dpr of [2, 3]) {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: dpr });
    const retina = await context.newPage();
    await retina.route('**/api/analytics/track', route => route.fulfill({ status: 200, body: '{"ok":true}' }));
    for (const path of ['/', '/story.html', '/portfolio.html', '/experience-design/orange-business-executive-briefing-center/']) {
      await retina.goto(BASE + path, { waitUntil: 'domcontentloaded' });
      const result = await retina.evaluate(() => ({ overflow: document.documentElement.scrollWidth - innerWidth, h1: document.querySelectorAll('h1').length }));
      if (result.overflow > 1 || result.h1 !== 1) issues.push(`${path} DPR${dpr}: ${JSON.stringify(result)}`);
    }
    await context.close();
  }

  await browser.close();
  if (issues.length) {
    console.error(`FULL RESPONSIVE QA: ${issues.length} issue(s)`);
    issues.slice(0, 120).forEach(issue => console.error(' - ' + issue));
    process.exit(1);
  }
  console.log(`FULL RESPONSIVE QA: ALL CLEAN (${PAGES.length} pages × ${SIZES.length} viewports + ${SWEEP_PAGES.length} continuous sweeps + DPR 2/3)`);
})();
