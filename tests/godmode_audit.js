const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://127.0.0.1:8000';

const ROUTES = [
  { path: '/', name: 'Home' },
  { path: '/story/', name: 'Story' },
  { path: '/experience/', name: 'Experience' },
  { path: '/case-studies/', name: 'Case Studies' },
  { path: '/case-studies/orange-business/', name: 'Case Study: Orange Business' },
  { path: '/case-studies/bharat-petroleum-corporation-limited/', name: 'Case Study: BPCL' },
  { path: '/case-studies/indian-army/', name: 'Case Study: Indian Army' },
  { path: '/portfolio/', name: 'Portfolio' },
  { path: '/for-recruiters/', name: 'For Recruiters' },
  { path: '/contact/', name: 'Contact' },
  { path: '/insights/', name: 'Insights' },
  { path: '/journal/', name: 'Journal' },
  { path: '/consulting/', name: 'Consulting' },
  { path: '/sitemap/', name: 'Sitemap' },
  { path: '/privacy-policy/', name: 'Privacy Policy' },
  { path: '/terms/', name: 'Terms' },
  { path: '/essays/technology-should-feel-human/', name: 'Essay: Tech Human' },
  { path: '/essays/ai-isnt-replacing-creativity/', name: 'Essay: AI Creativity' },
  { path: '/essays/designing-experiences-people-remember/', name: 'Essay: Designing Experiences' },
  { path: '/essays/why-enterprise-experiences-fail/', name: 'Essay: Enterprise Fail' },
  { path: '/journal/what-a-year-of-ai-enabled-production-taught-me/', name: 'Journal: AI Year' },
  { path: '/journal/the-experience-centre-as-a-strategic-instrument/', name: 'Journal: Experience Centre' }
];

const VIEWPORTS = [
  { width: 360, height: 740, label: '360px Mobile (Small)' },
  { width: 375, height: 667, label: '375px Mobile (iPhone SE)' },
  { width: 390, height: 844, label: '390px Mobile (iPhone 14)' },
  { width: 768, height: 1024, label: '768px Tablet (iPad)' },
  { width: 1024, height: 768, label: '1024px Small Desktop' },
  { width: 1280, height: 800, label: '1280px Standard Laptop' },
  { width: 1440, height: 900, label: '1440px Desktop' },
  { width: 1920, height: 1080, label: '1920px Full HD' },
  { width: 3840, height: 2160, label: '3840px 4K Ultrawide' }
];

async function runAudit() {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  const auditReport = {
    timestamp: new Date().toISOString(),
    routesChecked: 0,
    failures: [],
    warnings: [],
    caseCardAudit: {},
    recruitersAudit: {},
    responsiveAudit: [],
    seoAudit: [],
    linkAudit: { total: 0, broken: 0, badHrefs: [] }
  };

  const failedRequests = [];
  page.on('requestfailed', req => {
    // ignore optional video / analytics in mock environment
    if (!req.url().includes('video') && !req.url().includes('analytics')) {
      failedRequests.push({ url: req.url(), failure: req.failure() ? req.failure().errorText : 'failed' });
    }
  });

  const pageErrors = [];
  page.on('pageerror', err => pageErrors.push(err.message));

  console.log('--- 1. AUDITING CASE STUDY CARDS ---');
  await page.goto(`${BASE_URL}/case-studies/`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(600);

  const caseCards = await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('.case__card, .case-card, figure.case'));
    return cards.map(c => {
      const cat = c.querySelector('.case__cat')?.textContent?.trim() || '';
      const client = c.querySelector('.case__client')?.textContent?.trim() || '';
      const title = c.querySelector('.case__title')?.textContent?.trim() || '';
      const work = c.querySelector('.case__work')?.textContent?.trim() || '';
      const cta = c.querySelector('.case__card-cta, .case__cta');
      const ctaText = cta?.textContent?.trim() || '';
      const ctaHref = cta?.getAttribute('href') || '';
      const hasArrow = !!cta?.querySelector('svg');
      const img = c.closest('figure, .case')?.querySelector('img')?.getAttribute('src') || '';
      const rect = c.getBoundingClientRect();
      const style = window.getComputedStyle(c);

      return {
        cat,
        client,
        title,
        work,
        ctaText,
        ctaHref,
        hasArrow,
        img,
        width: rect.width,
        height: rect.height,
        borderRadius: style.borderRadius,
        display: style.display
      };
    });
  });

  auditReport.caseCardAudit = caseCards;
  console.log(`Found ${caseCards.length} Case Study Cards on /case-studies/:`);
  caseCards.forEach((c, idx) => {
    console.log(` Card ${idx + 1}: ${c.client} | ${c.title} -> ${c.ctaHref} (Arrow: ${c.hasArrow})`);
    if (!c.cat || !c.client || !c.title || !c.work || !c.ctaHref || !c.hasArrow) {
      auditReport.failures.push(`Case card ${idx + 1} (${c.client}) missing canonical fields`);
    }
  });

  console.log('\n--- 2. AUDITING RECRUITERS PAGE INTEGRATION ---');
  await page.goto(`${BASE_URL}/for-recruiters/`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(600);

  const recruitersAudit = await page.evaluate(() => {
    const nav = document.querySelector('.site-nav');
    const footer = document.querySelector('footer');
    const h1 = document.querySelector('.rp-hero__title, h1');
    const acts = document.querySelectorAll('main > section');
    const buttons = document.querySelectorAll('.rp-btn');
    const bodyStyle = window.getComputedStyle(document.body);
    const wrap = document.querySelector('.rp-wrap');
    const wrapStyle = wrap ? window.getComputedStyle(wrap) : null;
    const navLinks = Array.from(document.querySelectorAll('.site-nav .nav-links a')).map(a => a.textContent.trim());

    return {
      hasSiteNav: !!nav,
      navLinks,
      hasFooter: !!footer,
      hasH1: !!h1,
      h1Text: h1?.textContent?.trim() || '',
      actCount: acts.length,
      buttonCount: buttons.length,
      bodyBg: bodyStyle.backgroundColor,
      bodyColor: bodyStyle.color,
      fontFamily: bodyStyle.fontFamily,
      wrapMaxWidth: wrapStyle?.maxWidth || ''
    };
  });

  auditReport.recruitersAudit = recruitersAudit;
  console.log('Recruiters Page Audit Results:', JSON.stringify(recruitersAudit, null, 2));
  if (!recruitersAudit.hasSiteNav) auditReport.failures.push('Recruiters page missing canonical .site-nav');
  if (!recruitersAudit.hasFooter) auditReport.failures.push('Recruiters page missing canonical footer');
  if (!recruitersAudit.hasH1) auditReport.failures.push('Recruiters page missing H1 heading');
  if (recruitersAudit.actCount < 14) auditReport.failures.push(`Recruiters page expected 14+ acts, found ${recruitersAudit.actCount}`);
  if (recruitersAudit.wrapMaxWidth !== '1280px') auditReport.failures.push(`Recruiters wrap max-width is ${recruitersAudit.wrapMaxWidth}, expected 1280px`);

  console.log('\n--- 3. AUDITING ALL ROUTES ACROSS MULTIPLE VIEWPORTS & SEO ---');
  for (const route of ROUTES) {
    auditReport.routesChecked++;
    const url = `${BASE_URL}${route.path}`;
    await page.setViewportSize({ width: 1440, height: 900 });
    const response = await page.goto(url, { waitUntil: 'domcontentloaded' });
    const status = response ? response.status() : 0;
    if (status !== 200) {
      auditReport.failures.push(`Route ${route.path} returned status ${status}`);
    }

    // SEO checks
    const seo = await page.evaluate(() => {
      const title = document.title;
      const desc = document.querySelector('meta[name="description"]')?.getAttribute('content') || '';
      const canonical = document.querySelector('link[rel="canonical"]')?.getAttribute('href') || '';
      const ogTitle = document.querySelector('meta[property="og:title"]')?.getAttribute('content') || '';
      const ogUrl = document.querySelector('meta[property="og:url"]')?.getAttribute('content') || '';
      const jsonLd = Array.from(document.querySelectorAll('script[type="application/ld+json"]')).map(s => {
        try { return JSON.parse(s.textContent); } catch (e) { return null; }
      }).filter(Boolean);
      const h1Count = document.querySelectorAll('h1').length;
      return { title, desc, canonical, ogTitle, ogUrl, jsonLdCount: jsonLd.length, h1Count };
    });

    if (!seo.title) auditReport.failures.push(`Route ${route.path} missing title`);
    if (!seo.canonical) auditReport.failures.push(`Route ${route.path} missing canonical link`);
    if (seo.h1Count !== 1) auditReport.failures.push(`Route ${route.path} expected 1 H1, found ${seo.h1Count}`);

    // Responsive checks
    for (const vp of VIEWPORTS) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.waitForTimeout(100);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      if (overflow > 1) {
        auditReport.failures.push(`Route ${route.path} @ ${vp.label} (${vp.width}px) has ${overflow}px horizontal overflow`);
      }
    }
  }

  console.log(`\n--- 4. INTERNAL LINK AUDIT ---`);
  const internalLinks = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('a[href]')).map(a => a.getAttribute('href'));
  });
  console.log(`Scanned links, sample: ${internalLinks.slice(0, 5).join(', ')}`);

  console.log('\n=============================================');
  console.log(`AUDIT FINISHED: ${auditReport.routesChecked} routes tested.`);
  console.log(`Total Failures: ${auditReport.failures.length}`);
  console.log(`Total Warnings: ${auditReport.warnings.length}`);
  console.log(`Total Failed Requests: ${failedRequests.length}`);
  console.log(`Total Page JS Errors: ${pageErrors.length}`);

  if (auditReport.failures.length > 0) {
    console.log('\nFAILURES LIST:');
    auditReport.failures.forEach(f => console.log(' ❌ ' + f));
  } else {
    console.log('\n✅ ALL FORENSIC CHECKS PASSED PERFECTLY!');
  }

  await browser.close();
  fs.writeFileSync('/tmp/godmode-audit-results.json', JSON.stringify({ auditReport, failedRequests, pageErrors }, null, 2));
  process.exit(auditReport.failures.length > 0 ? 1 : 0);
}

runAudit().catch(err => {
  console.error('Fatal audit error:', err);
  process.exit(1);
});
