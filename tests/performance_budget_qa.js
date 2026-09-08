/* Local deterministic performance/CWV guardrails (production still requires field data). */
const { chromium } = require('playwright');
const fs = require('fs');
const zlib = require('zlib');
const path = require('path');

const BASE = process.argv[2] || 'http://127.0.0.1:8092';
const ROOT = path.resolve(__dirname, '..');
const PAGES = ['/', '/story.html', '/portfolio.html', '/contact.html', '/experience-design/orange-business-executive-briefing-center/', '/essay-technology-should-feel-human.html'];

(async () => {
  const browser = await chromium.launch();
  const issues = [];
  const rows = [];

  for (const route of PAGES) {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    const bodyPromises = [];
    let pageErrors = 0;
    page.on('pageerror', () => pageErrors++);
    page.on('response', response => {
      const url = response.url();
      if (!url.startsWith(BASE) || url.includes('/api/analytics/track')) return;
      bodyPromises.push(response.body().then(body => body.length).catch(() => 0));
    });
    await page.route('**/api/analytics/track', route => route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true,"data":{}}' }));
    await page.addInitScript(() => {
      window.__avPerf = { cls: 0, lcp: 0, longTasks: 0, longTaskMs: 0 };
      try {
        new PerformanceObserver(list => {
          for (const entry of list.getEntries()) if (!entry.hadRecentInput) window.__avPerf.cls += entry.value;
        }).observe({ type: 'layout-shift', buffered: true });
        new PerformanceObserver(list => {
          const entries = list.getEntries();
          if (entries.length) window.__avPerf.lcp = entries[entries.length - 1].startTime;
        }).observe({ type: 'largest-contentful-paint', buffered: true });
        new PerformanceObserver(list => {
          for (const entry of list.getEntries()) { window.__avPerf.longTasks++; window.__avPerf.longTaskMs += entry.duration; }
        }).observe({ type: 'longtask', buffered: true });
      } catch (_) {}
    });
    const client = await context.newCDPSession(page);
    await client.send('Performance.enable');
    const started = Date.now();
    const response = await page.goto(BASE + route, { waitUntil: 'load', timeout: 30000 });
    await page.waitForTimeout(1800);
    const elapsed = Date.now() - started;
    const bytes = (await Promise.all(bodyPromises)).reduce((sum, value) => sum + value, 0);
    const perf = await page.evaluate(() => ({
      ...window.__avPerf,
      domNodes: document.getElementsByTagName('*').length,
      resources: performance.getEntriesByType('resource').length,
      nav: (() => { const n = performance.getEntriesByType('navigation')[0]; return n ? { dcl: n.domContentLoadedEventEnd, load: n.loadEventEnd } : {}; })()
    }));
    const metrics = Object.fromEntries((await client.send('Performance.getMetrics')).metrics.map(item => [item.name, item.value]));
    const row = { route, status: response?.status(), bytes, elapsed, ...perf, layouts: metrics.LayoutCount || 0, recalcs: metrics.RecalcStyleCount || 0 };
    rows.push(row);
    if (row.status !== 200) issues.push(`${route}: HTTP ${row.status}`);
    if (pageErrors) issues.push(`${route}: ${pageErrors} page error(s)`);
    if (row.cls > 0.1) issues.push(`${route}: CLS ${row.cls.toFixed(3)} > 0.1`);
    if (row.lcp && row.lcp > 4000) issues.push(`${route}: local LCP ${Math.round(row.lcp)}ms > 4000ms`);
    if (row.bytes > 1_500_000) issues.push(`${route}: initial decoded resources ${row.bytes} bytes > 1.5MB`);
    if (row.domNodes > 2500) issues.push(`${route}: DOM ${row.domNodes} > 2500 nodes`);
    if (row.longTaskMs > 500) issues.push(`${route}: long tasks total ${Math.round(row.longTaskMs)}ms`);
    await context.close();
  }
  await browser.close();

  const sourceBudgets = [
    ['css/styles.css', 45_000], ['js/main.js', 18_000],
    ['css/orange-business-case-study.css', 12_000], ['js/orange-business-case-study.js', 7_000]
  ];
  for (const [relative, budget] of sourceBudgets) {
    const file = path.join(ROOT, 'abhijeetvarghese', relative);
    const gzip = zlib.gzipSync(fs.readFileSync(file), { level: 9 }).length;
    if (gzip > budget) issues.push(`${relative}: gzip ${gzip} > ${budget}`);
  }

  rows.forEach(row => console.log(`${row.route.padEnd(68)} bytes=${String(row.bytes).padStart(7)} LCP=${String(Math.round(row.lcp || 0)).padStart(4)}ms CLS=${row.cls.toFixed(3)} DOM=${row.domNodes} long=${Math.round(row.longTaskMs)}ms`));
  if (issues.length) {
    console.error(`PERFORMANCE BUDGET QA: ${issues.length} issue(s)`);
    issues.forEach(issue => console.error(' - ' + issue));
    process.exit(1);
  }
  console.log('PERFORMANCE BUDGET QA: ALL CLEAN');
})();
