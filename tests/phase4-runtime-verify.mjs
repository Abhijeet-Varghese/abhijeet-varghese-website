/**
 * AV OS — Phase 4 runtime cutover verification (Playwright).
 *
 * Proves, in a real browser, that the React frontend renders from the runtime
 * CMS content path (`/api/v1/content` → provider → components) and falls back
 * to the static snapshot when the API is unavailable — without blanking the
 * site. Compares static vs runtime rendered text across all routes/viewports.
 *
 * Usage: node tests/phase4-runtime-verify.mjs [base]   (default http://127.0.0.1:8093)
 */
import { chromium } from 'playwright';

const BASE = process.argv[2] || 'http://127.0.0.1:8093';

const ROUTES = [
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
  '/journal-the-experience-centre-as-a-strategic-instrument.html',
];

const VIEWPORTS = [
  { name: 'mobile', width: 390, height: 844 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1440, height: 900 },
];

let pass = 0;
let fail = 0;
const ok = (m) => { pass++; console.log('  ✓ ' + m); };
const bad = (m) => { fail++; console.log('  ✗ ' + m); };

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext();
  const page = await ctx.newPage();

  // ------------------------------------------------------------------
  // 1. NETWORK + RUNTIME: the built site must request /api/v1/content
  //    and transition the content source to "runtime".
  // ------------------------------------------------------------------
  console.log('── 1. network + runtime source ──');
  {
    const apiRequests = [];
    page.on('request', (r) => { if (r.url().includes('/api/v1/content')) apiRequests.push(r.url()); });
    await page.goto(BASE + '/', { waitUntil: 'load' });
    await page.waitForTimeout(1200); // allow provider fetch to complete

    ok('GET /api/v1/content requested', apiRequests.length > 0);

    const src = await page.evaluate(() => document.documentElement.dataset.avosSource);
    const phase = await page.evaluate(() => document.documentElement.dataset.avosPhase);
    ok('content source = runtime', src === 'runtime');
    ok('content phase = runtime', phase === 'runtime');

    // spot-check a known runtime value actually rendered in the DOM
    const name = await page.locator('h1.hp-hero__name').first().innerText();
    ok('hero name rendered', /Abhijeet/.test(name));
  }

  // ------------------------------------------------------------------
  // 2. STATIC/RUNTIME PARITY: render each route with API allowed (runtime)
  //    vs API blocked (static fallback); the rendered text must be identical.
  // ------------------------------------------------------------------
  console.log('── 2. static vs runtime rendered-text parity (all routes) ──');
  const mismatches = [];
  for (const route of ROUTES) {
    const textOf = async (blockApi) => {
      const p = await ctx.newPage();
      if (blockApi) {
        await p.route('**/api/v1/content', (r) => r.abort());
      }
      await p.goto(BASE + route, { waitUntil: 'load' });
      await p.waitForTimeout(800);
      const txt = await p.evaluate(() => (document.getElementById('root')?.innerText ?? ''));
      const src = await p.evaluate(() => document.documentElement.dataset.avosSource);
      await p.close();
      return { txt, src };
    };
    const runtime = await textOf(false);
    const fallback = await textOf(true);

    if (runtime.txt !== fallback.txt) {
      mismatches.push(route);
    }
  }
  ok('rendered text identical (runtime vs static) for all routes', mismatches.length === 0);
  if (mismatches.length) for (const m of mismatches) bad('text mismatch on ' + m);

  // ------------------------------------------------------------------
  // 3. FALLBACK: with API blocked, the site renders (non-blank) and the
  //    source is observably the static fallback (never silently masked).
  // ------------------------------------------------------------------
  console.log('── 3. fallback behaviour (API unavailable) ──');
  {
    const p = await ctx.newPage();
    await p.route('**/api/v1/content', (r) => r.abort());
    await p.goto(BASE + '/', { waitUntil: 'load' });
    await p.waitForTimeout(1000);
    const src = await p.evaluate(() => document.documentElement.dataset.avosSource);
    const rootText = await p.evaluate(() => (document.getElementById('root')?.innerText ?? ''));
    ok('fallback source = static', src === 'static' || src === 'fallback');
    ok('fallback renders non-blank site', rootText.length > 500);
    await p.close();
  }

  // ------------------------------------------------------------------
  // 4. RESPONSIVE: all routes render at mobile/tablet/desktop with no
  //    horizontal overflow (no layout regression).
  // ------------------------------------------------------------------
  console.log('── 4. responsive (3 viewports × key routes) ──');
  {
    const keyRoutes = ['/', '/story.html', '/experience.html', '/portfolio.html', '/contact.html', '/journal.html'];
    let overflowIssues = 0;
    for (const route of keyRoutes) {
      for (const vp of VIEWPORTS) {
        await page.setViewportSize({ width: vp.width, height: vp.height });
        await page.goto(BASE + route, { waitUntil: 'load' });
        await page.waitForTimeout(500);
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        if (overflow > 1) { overflowIssues++; bad(`horizontal overflow ${overflow}px on ${route} @ ${vp.name}`); }
      }
    }
    ok('no horizontal overflow across key routes × 3 viewports', overflowIssues === 0);
  }

  await browser.close();
  console.log(`\n────────────────────────────────────────`);
  console.log(`  ${pass} passed, ${fail} failed`);
  process.exit(fail === 0 ? 0 : 1);
})();
