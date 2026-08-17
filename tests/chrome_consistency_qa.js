/* Public-site invariant: every content page reuses the homepage nav and footer. */
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
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const issues = [];
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.route('**/api/analytics/track', route => route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true,"data":{}}' }));

  const inspect = async path => {
    const response = await page.goto(BASE + path, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(100);
    return page.evaluate(() => {
      const header = document.querySelector('header.site-nav');
      const footer = document.querySelector('footer.footer--arena');
      const absolutePath = element => {
        const href = element.getAttribute('href') || '';
        if (/^(mailto:|tel:)/.test(href)) return href;
        try { return new URL(href, location.href).pathname; } catch { return href; }
      };
      const stylePick = (element, properties) => {
        if (!element) return null;
        const style = getComputedStyle(element);
        return Object.fromEntries(properties.map(property => [property, style.getPropertyValue(property)]));
      };
      const inner = document.querySelector('.site-nav__inner');
      const footerInner = document.querySelector('.footer__inner');
      return {
        headerCount: document.querySelectorAll('header.site-nav').length,
        footerCount: document.querySelectorAll('footer.footer--arena').length,
        bespokeCount: document.querySelectorAll('.case-nav,.case-footer').length,
        navLabels: [...document.querySelectorAll('.nav-links a')].map(a => a.textContent.trim()),
        navPaths: [...document.querySelectorAll('.nav-links a')].map(absolutePath),
        mobileLabels: [...document.querySelectorAll('.mobile-menu__list a')].map(a => a.textContent.replace(/^\d+/, '').trim()),
        mobilePaths: [...document.querySelectorAll('.mobile-menu__list a')].map(absolutePath),
        navCta: absolutePath(document.querySelector('.site-nav__inner > .btn--small')),
        footerLabels: [...document.querySelectorAll('.footer__col > .footer__label')].map(x => x.textContent.trim()),
        footerPaths: [...document.querySelectorAll('.footer__links a')].map(absolutePath),
        footerSocials: [...document.querySelectorAll('.footer__social a')].map(x => x.textContent.trim()),
        footerBrand: document.querySelector('.footer__name')?.textContent.trim(),
        footerColumns: document.querySelectorAll('.footer__col').length,
        currentCount: document.querySelectorAll('.nav-links [aria-current="page"]').length,
        navStyle: stylePick(inner, ['width','height','padding','gap','background-color','border-radius','border-top-color','box-shadow','display']),
        footerStyle: stylePick(footer, ['background-color','padding-top','padding-bottom','border-top-color','color']),
        footerInnerStyle: stylePick(footerInner, ['width','display','flex-wrap','align-items','justify-content','column-gap','row-gap'])
      };
    });
  };

  const reference = await inspect('/');
  for (const path of PAGES) {
    const actual = path === '/' ? reference : await inspect(path);
    if (actual.headerCount !== 1 || actual.footerCount !== 1) issues.push(`${path}: shared header/footer count ${actual.headerCount}/${actual.footerCount}`);
    if (actual.bespokeCount) issues.push(`${path}: bespoke chrome remains (${actual.bespokeCount})`);
    for (const key of ['navLabels','navPaths','mobileLabels','mobilePaths','footerLabels','footerPaths','footerSocials']) {
      if (JSON.stringify(actual[key]) !== JSON.stringify(reference[key])) issues.push(`${path}: ${key} differs from homepage`);
    }
    for (const key of ['navCta','footerBrand','footerColumns']) {
      if (actual[key] !== reference[key]) issues.push(`${path}: ${key} differs (${JSON.stringify(actual[key])})`);
    }
    if (actual.currentCount > 1) issues.push(`${path}: multiple aria-current destinations`);
    for (const key of ['navStyle','footerStyle','footerInnerStyle']) {
      if (JSON.stringify(actual[key]) !== JSON.stringify(reference[key])) {
        issues.push(`${path}: computed ${key} differs from homepage\n  home=${JSON.stringify(reference[key])}\n  page=${JSON.stringify(actual[key])}`);
      }
    }
  }

  // The shared mobile menu must retain the homepage dialog behavior on the nested case study.
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(BASE + '/experience-design/orange-business-executive-briefing-center/', { waitUntil: 'domcontentloaded' });
  await page.click('#navToggle');
  await page.waitForTimeout(100);
  const mobile = await page.evaluate(() => ({
    open: document.querySelector('#navToggle')?.getAttribute('aria-expanded'),
    visible: !document.querySelector('#mobileMenu')?.hidden && document.querySelector('#mobileMenu')?.classList.contains('is-open'),
    role: document.querySelector('#mobileMenu')?.getAttribute('role'),
    modal: document.querySelector('#mobileMenu')?.getAttribute('aria-modal'),
    portfolio: !![...document.querySelectorAll('.mobile-menu__list a')].find(a => a.textContent.includes('Portfolio')),
    overflow: document.documentElement.scrollWidth - innerWidth
  }));
  if (mobile.open !== 'true' || !mobile.visible || mobile.role !== 'dialog' || mobile.modal !== 'true' || !mobile.portfolio || mobile.overflow > 0) {
    issues.push(`nested mobile menu failed: ${JSON.stringify(mobile)}`);
  }
  await page.keyboard.press('Escape');
  if ((await page.locator('#navToggle').getAttribute('aria-expanded')) !== 'false') issues.push('nested mobile menu did not close with Escape');

  if (errors.length) issues.push(...errors.map(error => `page error: ${error}`));
  await browser.close();
  if (issues.length) {
    console.error(`CHROME CONSISTENCY QA: ${issues.length} issue(s)`);
    issues.forEach(issue => console.error(' - ' + issue));
    process.exit(1);
  }
  console.log(`CHROME CONSISTENCY QA: ALL CLEAN (${PAGES.length} public pages; homepage nav/footer DOM + computed materials + mobile dialog)`);
})();
