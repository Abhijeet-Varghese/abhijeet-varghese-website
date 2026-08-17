/* Accessibility resilience: no-JS, reduced motion, forced colors, text scaling, focus and touch. */
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

(async () => {
  const browser = await chromium.launch();
  const issues = [];
  const routeAnalytics = page => page.route('**/api/analytics/track', route => route.fulfill({ status: 200, body: '{"ok":true}' }));

  // Every page remains readable without JavaScript.
  const noJsContext = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  const noJs = await noJsContext.newPage();
  for (const path of PAGES) {
    await noJs.goto(BASE + path, { waitUntil: 'domcontentloaded' });
    const result = await noJs.evaluate(() => ({
      h1: document.querySelectorAll('h1').length,
      overflow: document.documentElement.scrollWidth - innerWidth,
      hiddenContent: [...document.querySelectorAll('[data-reveal],.reveal')].filter(node => {
        const style = getComputedStyle(node);
        return style.display !== 'none' && (style.visibility === 'hidden' || Number(style.opacity) < .95);
      }).length,
      header: document.querySelectorAll('header.site-nav').length,
      footer: document.querySelectorAll('footer.footer--arena').length
    }));
    if (result.h1 !== 1 || result.overflow > 1 || result.hiddenContent || result.header !== 1 || result.footer !== 1) {
      issues.push(`${path} no-JS: ${JSON.stringify(result)}`);
    }
  }
  await noJsContext.close();

  // Reduced motion renders final states instead of invisible/vestibular sequences.
  const reducedContext = await browser.newContext({ reducedMotion: 'reduce', viewport: { width: 390, height: 844 } });
  const reduced = await reducedContext.newPage();
  await routeAnalytics(reduced);
  for (const path of PAGES) {
    await reduced.goto(BASE + path, { waitUntil: 'domcontentloaded' });
    await reduced.waitForTimeout(50);
    const result = await reduced.evaluate(() => ({
      overflow: document.documentElement.scrollWidth - innerWidth,
      hiddenContent: [...document.querySelectorAll('[data-reveal],.reveal')].filter(node => {
        const style = getComputedStyle(node);
        return style.display !== 'none' && (style.visibility === 'hidden' || Number(style.opacity) < .95);
      }).length
    }));
    if (result.overflow > 1 || result.hiddenContent) issues.push(`${path} reduced motion: ${JSON.stringify(result)}`);
  }
  await reducedContext.close();

  // Forced-colors mode retains structure and keyboard focus.
  const forcedContext = await browser.newContext({ forcedColors: 'active', viewport: { width: 390, height: 844 } });
  const forced = await forcedContext.newPage();
  await routeAnalytics(forced);
  for (const path of ['/', '/story.html', '/contact.html', '/experience-design/orange-business-executive-briefing-center/']) {
    await forced.goto(BASE + path, { waitUntil: 'domcontentloaded' });
    await forced.keyboard.press('Tab');
    const result = await forced.evaluate(() => {
      const active = document.activeElement;
      const style = active ? getComputedStyle(active) : null;
      return {
        overflow: document.documentElement.scrollWidth - innerWidth,
        focusable: !!active && active !== document.body,
        focusVisible: !!style && (style.outlineStyle !== 'none' || style.boxShadow !== 'none')
      };
    });
    if (result.overflow > 1 || !result.focusable || !result.focusVisible) issues.push(`${path} forced colors: ${JSON.stringify(result)}`);
  }
  await forcedContext.close();

  // Text-only scaling at 200% must reflow rather than crop core content.
  const scaleContext = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const scaled = await scaleContext.newPage();
  await routeAnalytics(scaled);
  for (const path of PAGES) {
    await scaled.goto(BASE + path, { waitUntil: 'domcontentloaded' });
    const result = await scaled.evaluate(() => {
      document.documentElement.style.setProperty('font-size', '200%', 'important');
      document.body.offsetHeight;
      const headings = [...document.querySelectorAll('h1,h2,h3')].filter(node => {
        const style = getComputedStyle(node);
        if (style.display === 'none' || !node.getClientRects().length) return false;
        let parent = node.parentElement;
        while (parent && parent !== document.body) {
          const overflow = getComputedStyle(parent).overflowX;
          if (['hidden','clip','auto','scroll'].includes(overflow)) return false;
          parent = parent.parentElement;
        }
        const rect = node.getBoundingClientRect();
        return rect.left < -1 || rect.right > innerWidth + 1;
      }).length;
      return { overflow: document.documentElement.scrollWidth - innerWidth, headings };
    });
    if (result.overflow > 1 || result.headings) issues.push(`${path} 200% text: ${JSON.stringify(result)}`);
  }
  await scaleContext.close();

  // Primary controls retain comfortable touch targets; inline prose links are excluded.
  const touchContext = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true });
  const touch = await touchContext.newPage();
  await routeAnalytics(touch);
  for (const path of PAGES) {
    await touch.goto(BASE + path, { waitUntil: 'domcontentloaded' });
    const tooSmall = await touch.evaluate(() => [...document.querySelectorAll('button,.btn,.nav-toggle,.page-close,.footer__top,.footer__links a,.footer__contact a,.footer__social a,.mobile-menu__mail,.case__card-cta,.link-arrow')]
      .filter(node => {
        const style = getComputedStyle(node);
        return style.display !== 'none' && style.visibility !== 'hidden' && node.getClientRects().length;
      })
      .map(node => ({ node, rect: node.getBoundingClientRect() }))
      .filter(({ rect }) => rect.width < 40 || rect.height < 40)
      .slice(0, 8)
      .map(({ node, rect }) => `${node.tagName}.${node.className}:${Math.round(rect.width)}×${Math.round(rect.height)}`));
    if (tooSmall.length) issues.push(`${path} touch targets: ${tooSmall.join(' | ')}`);
    const undersizedFields = await touch.evaluate(() => [...document.querySelectorAll('input,select,textarea')]
      .filter(node => getComputedStyle(node).display !== 'none' && node.getClientRects().length)
      .filter(node => parseFloat(getComputedStyle(node).fontSize) < 16)
      .map(node => `${node.id || node.name || node.tagName}:${getComputedStyle(node).fontSize}`));
    if (undersizedFields.length) issues.push(`${path} iOS field text: ${undersizedFields.join(' | ')}`);
  }
  await touchContext.close();

  await browser.close();
  if (issues.length) {
    console.error(`ACCESSIBILITY RESILIENCE QA: ${issues.length} issue(s)`);
    issues.slice(0, 120).forEach(issue => console.error(' - ' + issue));
    process.exit(1);
  }
  console.log(`ACCESSIBILITY RESILIENCE QA: ALL CLEAN (${PAGES.length} pages: no-JS + reduced motion + 200% text + touch; forced colors on key journeys)`);
})();
