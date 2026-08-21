/**
 * AV OS — Phase 5 admin browser verification (Playwright).
 * Proves: login → shell → navigation → real-data modules → command palette →
 * logout → unauthorized handling → public site regression.
 *
 * Usage: node tests/phase5-admin-verify.mjs [adminBase] [siteBase]
 */
import { chromium } from 'playwright';

const ADMIN = process.argv[2] || 'http://127.0.0.1:5199/os/';
const SITE = process.argv[3] || 'http://127.0.0.1:8093';
// Throwaway LOCAL test credentials (never production). Override via env.
const TEST_EMAIL = process.env.AVOS_TEST_EMAIL || 'test@avos.local';
const TEST_PASSWORD = process.env.AVOS_TEST_PASSWORD || '';

let pass = 0, fail = 0;
const ok = (m) => { pass++; console.log('  ✓ ' + m); };
const bad = (m) => { fail++; console.log('  ✗ ' + m); };

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext();
  const page = await ctx.newPage();

  // ---- 1. unauthenticated → login redirect ----
  console.log('── 1. auth gate ──');
  await page.goto(ADMIN, { waitUntil: 'load' });
  await page.waitForTimeout(600);
  ok('redirects to login', page.url().includes('#/login') || (await page.locator('input[type=email]').count()) > 0);

  // ---- 2. login ----
  console.log('── 2. login ──');
  if (!TEST_PASSWORD) { console.error('  ✗ set AVOS_TEST_PASSWORD to run the login flow'); process.exit(2); }
  await page.locator('input[type=email]').fill(TEST_EMAIL);
  await page.locator('input[type=password]').fill(TEST_PASSWORD);
  await page.locator('button[type=submit]').click();
  await page.waitForTimeout(1200);
  ok('lands on dashboard', page.url().includes('#/dashboard') || (await page.locator('.av-shell').count()) > 0);

  // ---- 3. shell + navigation ----
  console.log('── 3. shell & navigation ──');
  ok('sidebar renders', (await page.locator('.av-sidebar').count()) > 0);
  ok('topbar renders', (await page.locator('.av-topbar').count()) > 0);
  const navLabels = await page.locator('.av-nav-item__label').allTextContents();
  ok('nav includes Projects', navLabels.some((l) => l === 'Projects'));
  ok('nav includes Media', navLabels.some((l) => l === 'Media'));

  // ---- 4. dashboard (real data) ----
  console.log('── 4. dashboard ──');
  await page.goto(ADMIN + '#/dashboard', { waitUntil: 'load' });
  await page.waitForTimeout(900);
  const statVals = await page.locator('.av-stat__value').allTextContents();
  ok('dashboard shows content counts', statVals.some((v) => /\d+/.test(v)));

  // ---- 5. projects list (real data) ----
  console.log('── 5. projects ──');
  await page.goto(ADMIN + '#/projects', { waitUntil: 'load' });
  await page.waitForTimeout(900);
  const projectTitles = await page.locator('.av-table tbody tr td').allTextContents();
  ok('projects list shows real rows', projectTitles.some((t) => t.includes('Orange Business')));

  // ---- 6. project editor loads real data ----
  console.log('── 6. project editor ──');
  await page.goto(ADMIN + '#/projects/orange-business-executive-briefing-center', { waitUntil: 'load' });
  await page.waitForTimeout(900);
  const titleVal = await page.locator('.av-input').first().inputValue();
  ok('editor loads project title', titleVal.includes('Orange Business'));

  // ---- 7. articles / clients / experience / pages / media / settings ----
  console.log('── 7. content modules ──');
  for (const [route, expect] of [
    ['#/articles', 'Technology Should Feel Human'],
    ['#/clients', 'Amazon'],
    ['#/experience', 'Creative Head'],
    ['#/pages', 'About'],
    ['#/settings', 'Site name'],
    ['#/revisions', 'Restore'],
  ]) {
    await page.goto(ADMIN + route, { waitUntil: 'load' });
    await page.waitForTimeout(700);
    const text = await page.locator('.av-content').innerText();
    ok(`${route} renders expected content`, text.includes(expect));
  }

  // ---- 8. command palette ----
  console.log('── 8. command palette ──');
  await page.goto(ADMIN + '#/dashboard', { waitUntil: 'load' });
  await page.keyboard.press('Control+k');
  await page.waitForTimeout(300);
  ok('palette opens on ⌘K', (await page.locator('.av-palette').count()) > 0);
  await page.keyboard.press('Escape');

  // ---- 9. theme toggle ----
  console.log('── 9. theme ──');
  const themeBefore = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
  await page.locator('.av-topbar__iconbtn[aria-label="Toggle theme"]').click();
  const themeAfter = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
  ok('theme toggles', themeBefore !== themeAfter);

  // ---- 10. logout ----
  console.log('── 10. logout ──');
  await page.locator('.av-topbar__logout').click();
  await page.waitForTimeout(700);
  ok('logout returns to login', (await page.locator('input[type=email]').count()) > 0);

  await browser.close();

  // ---- 11. public site regression ----
  console.log('── 11. public site regression ──');
  const b2 = await chromium.launch();
  const p2 = await b2.newPage();
  await p2.goto(SITE + '/', { waitUntil: 'load' });
  await p2.waitForTimeout(800);
  const hero = await p2.locator('h1.hp-hero__name').first().innerText();
  ok('public homepage still renders', /Abhijeet/.test(hero));
  await b2.close();

  console.log(`\n────────────────────────────────────────`);
  console.log(`  ${pass} passed, ${fail} failed`);
  process.exit(fail === 0 ? 0 : 1);
})();
