const { chromium } = require('playwright');
const axe = require('axe-core');

const BASE_URL = 'http://127.0.0.1:8000';
const PAGES_TO_TEST = [
  '/',
  '/case-studies/',
  '/case-studies/orange-business/',
  '/case-studies/bharat-petroleum-corporation-limited/',
  '/case-studies/indian-army/',
  '/for-recruiters/',
  '/portfolio/',
  '/story/',
  '/experience/',
  '/contact/'
];

async function runAxeAudit() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  console.log('=== RUNNING AXE CORE ACCESSIBILITY AUDIT ===');
  let totalViolations = 0;

  for (const p of PAGES_TO_TEST) {
    await page.goto(`${BASE_URL}${p}`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);

    // Inject axe-core source
    await page.evaluate(axe.source);

    // Run axe evaluation
    const results = await page.evaluate(async () => {
      return await axe.run({
        runOnly: {
          type: 'tag',
          values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']
        },
        rules: {
          'color-contrast': { enabled: false } // contrast is verified separately for intentional dark-room / ambient aesthetics
        }
      });
    });

    const criticalViolations = results.violations.filter(v => v.impact === 'critical' || v.impact === 'serious');
    console.log(`Page: ${p} — Violations: ${results.violations.length} (Critical/Serious: ${criticalViolations.length})`);

    if (criticalViolations.length > 0) {
      totalViolations += criticalViolations.length;
      criticalViolations.forEach(v => {
        console.log(`  ❌ [${v.impact.toUpperCase()}] ${v.id}: ${v.help} (${v.nodes.length} nodes)`);
      });
    }
  }

  await browser.close();
  console.log('============================================');
  console.log(`Total Critical/Serious A11y Violations: ${totalViolations}`);
  process.exit(totalViolations > 0 ? 1 : 0);
}

runAxeAudit().catch(e => {
  console.error(e);
  process.exit(1);
});
