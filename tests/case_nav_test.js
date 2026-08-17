const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const results = [];
  const ok = (n, c, x = '') => results.push(`${c ? 'PASS' : 'FAIL'}  ${n}${c ? '' : '  ' + x}`);
  // 1. nav → dedicated pages (Portfolio and Case Studies are intentionally separate)
  for (const [label, href] of [['Story', 'story.html'], ['Experience', 'experience.html'], ['Case Studies', 'case-studies.html'], ['Portfolio', 'portfolio.html']]) {
    await page.goto('http://127.0.0.1:8092/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(400);
    const clicked = await page.evaluate(({ label, href }) => {
      const a = Array.from(document.querySelectorAll('.nav-links a')).find(x => x.textContent.trim() === label);
      if (!a) return 'no link';
      if (a.getAttribute('href') !== href) return 'href=' + a.getAttribute('href');
      a.click(); return 'ok';
    }, { label, href });
    await page.waitForTimeout(900);
    const url = page.url();
    ok(`nav "${label}" → dedicated page`, clicked === 'ok' && url.endsWith(href), url);
  }
  await page.goto('http://127.0.0.1:8092/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(400);
  const ctaNav = await page.evaluate(() => {
    const a = document.querySelector('.site-nav__inner .btn--small');
    if (!a) return null;
    const href = a.getAttribute('href');
    a.click();
    return href;
  });
  await page.waitForTimeout(900);
  ok('nav CTA button → contact page', ctaNav === 'contact.html' && page.url().endsWith('contact.html'), ctaNav + ' → ' + page.url());
  // 2. Orange Business card → supplied long-form canonical case study
  await page.goto('http://127.0.0.1:8092/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(500);
  const cta = await page.evaluate(() => {
    const a = document.querySelector('.case__card-cta');
    if (!a) return null;
    const href = a.getAttribute('href');
    a.click();
    return href;
  });
  await page.waitForTimeout(1000);
  const orangeRoute = 'experience-design/orange-business-executive-briefing-center/';
  ok('Orange Business card → canonical long-form page', cta === orangeRoute && page.url().includes('/' + orangeRoute), cta + ' → ' + page.url());
  const detail = await page.evaluate(() => ({
    h1: (document.querySelector('h1') || {}).textContent.trim() || '',
    sections: document.querySelectorAll('main article > section').length,
    caseNav: !!document.querySelector('.site-nav a[href="../../case-studies.html"]'),
    portfolioNav: !!document.querySelector('.site-nav a[href="../../portfolio.html"]'),
    portfolioFooter: !!document.querySelector('.footer a[href="../../portfolio.html"]')
  }));
  ok('long-form page renders full narrative and onward navigation', /EXECUTIVE/.test(detail.h1) && detail.sections >= 10 && detail.caseNav && detail.portfolioNav && detail.portfolioFooter, JSON.stringify(detail));
  // 3. duplicate CTA gone
  await page.goto('http://127.0.0.1:8092/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(400);
  const navCount = await page.evaluate(() => document.querySelectorAll('.nav-links a').length);
  const navTexts = await page.evaluate(() => Array.from(document.querySelectorAll('.nav-links a')).map(a => a.textContent.trim()));
  ok('nav has no duplicate Start a conversation', navCount === 4 && navTexts.includes('Portfolio') && !navTexts.includes('Start a conversation'), JSON.stringify(navTexts));
  const btnCount = await page.evaluate(() => document.querySelectorAll('.site-nav__inner > .btn--small').length);
  ok('single CTA button remains in nav', btnCount === 1, 'buttons=' + btnCount);
  console.log(results.join('\n'));
  await browser.close();
})();
