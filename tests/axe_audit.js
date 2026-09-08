/* AV OS — axe-core accessibility audit (WCAG 2.1 A + AA) on the public site.
   Usage: node tests/axe_audit.js [baseUrl]   (requires: npm i axe-core playwright) */
const { chromium } = require('playwright');
const axe = require('axe-core');
const fs = require('fs');

const BASE = process.argv[2] || 'http://127.0.0.1:8092';
const PAGES = ['/', '/story.html', '/experience.html', '/case-studies.html', '/portfolio.html', '/insights.html',
  '/journal.html', '/consulting.html', '/contact.html', '/for-recruiters.html', '/privacy-policy.html', '/terms.html', '/search.html',
  '/experience-design/orange-business-executive-briefing-center/'];

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  let serious = 0, moderate = 0;
  const report = [];

  for (const p of PAGES) {
    await page.goto(BASE + p, { waitUntil: 'networkidle', timeout: 30000 }).catch(() => {});
    // let intro/arrival sequences finish so transient mid-fade states
    // are never audited (homepage flagship arrival + staggered reveals)
    await page.waitForFunction(() => {
      const a = document.getElementById('hpArrival');
      const done = !a || a.classList.contains('is-done');
      const steps = Array.from(document.querySelectorAll('.hp-journey__step, .hp-thesis__chip'));
      const settled = steps.every(s => getComputedStyle(s).opacity === '1');
      return done && settled;
    }, { timeout: 6000 }).catch(() => {});
    await page.addScriptTag({ content: axe.source });
    const results = await page.evaluate(async () => {
      return await window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] } });
    });
    const v = results.violations || [];
    for (const vx of v) {
      const impact = vx.impact || 'moderate';
      if (impact === 'critical' || impact === 'serious') serious++;
      else moderate++;
      report.push({ page: p, rule: vx.id, impact, help: vx.help, nodes: vx.nodes.length, targets: vx.nodes.slice(0, 3).map(n => (n.target || []).join(' ')) });
    }
  }
  await browser.close();

  console.log(`PAGES AUDITED: ${PAGES.length}`);
  console.log(`CRITICAL/SERIOUS: ${serious}   MODERATE: ${moderate}`);
  for (const r of report) {
    console.log(`  [${r.impact.toUpperCase()}] ${r.page} :: ${r.rule} (${r.nodes} node${r.nodes > 1 ? 's' : ''}) — ${r.help}`);
    r.targets.slice(0, 2).forEach(t => console.log(`      @ ${t.slice(0, 110)}`));
  }
  fs.writeFileSync('/tmp/axe-report.json', JSON.stringify(report, null, 2));
  process.exit(serious > 0 ? 1 : 0);
})();
