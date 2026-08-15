/* Functional tests: dashboard, campaigns, email templates, automations, SEO, AI studio, proposals PDF */
const { chromium } = require('playwright');
const BASE = 'http://127.0.0.1:8092';
const EMAIL = 'admin@avos.test', PASS = 'AV2E2E!2345xY';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const fails = [];
  const ok = (name, cond, extra = '') => {
    console.log((cond ? 'PASS' : 'FAIL') + '  ' + name + (cond ? '' : '  ' + extra));
    if (!cond) fails.push(name);
  };

  await page.goto(BASE + '/admin/login.php', { waitUntil: 'networkidle' });
  await page.fill('input[type="email"], input[type="text"]', EMAIL);
  await page.fill('input[type="password"]', PASS);
  await page.click('button[type="submit"], .btn--primary');
  await page.waitForTimeout(2500);

  /* 1. Dashboard real data */
  await page.evaluate(() => { location.hash = 'dashboard'; });
  await page.waitForTimeout(2500);
  const dashText = await page.evaluate(() => document.body.innerText);
  ok('dashboard shows content health score', /Content health: \d+\/100/.test(dashText), dashText.slice(0, 200));
  ok('dashboard shows system health rows', /Version/.test(dashText));
  ok('dashboard shows real stat cards', /Visitors \(30d\)/.test(dashText) && /Page views \(30d\)/.test(dashText));

  /* 2. Campaigns create via UI */
  await page.evaluate(() => { location.hash = 'campaigns'; });
  await page.waitForTimeout(1800);
  await page.click('[data-add]');
  await page.waitForTimeout(600);
  await page.fill('.f-name', 'Playwright test campaign');
  await page.fill('.f-src', 'test');
  await page.fill('.f-med', 'manual');
  await page.fill('.f-camp', 'pw-test');
  await page.click('[data-s]');
  await page.waitForTimeout(1500);
  const campText = await page.evaluate(() => document.body.innerText);
  ok('campaign created via UI', /Playwright test campaign/.test(campText));

  /* 3. Email templates — save edit via UI */
  await page.evaluate(() => { location.hash = 'emailtemplates'; });
  await page.waitForTimeout(1800);
  const tplText = await page.evaluate(() => document.body.innerText);
  ok('email templates list renders', /New Lead \(admin alert\)/.test(tplText) && /Delivery log/.test(tplText));
  await page.click('[data-edit="2"]'); // lead_confirmation
  await page.waitForTimeout(600);
  await page.fill('.f-subject', 'Thanks, {name} — received ✓');
  await page.click('[data-s]');
  await page.waitForTimeout(1200);
  const tplSaved = await page.evaluate(() => document.body.innerText);
  ok('email template edit saved', /Thanks, \{name\} — received ✓/.test(tplSaved));

  /* 4. Automations — run inactivity check via UI */
  await page.evaluate(() => { location.hash = 'automations'; });
  await page.waitForTimeout(1800);
  await page.click('[data-inactive]');
  await page.waitForTimeout(1500);
  const autoText = await page.evaluate(() => document.body.innerText);
  ok('inactivity sweep button works', /Inactivity sweep/.test(autoText));

  /* 5. SEO view — real health */
  await page.evaluate(() => { location.hash = 'seo'; });
  await page.waitForTimeout(2500);
  const seoText = await page.evaluate(() => document.body.innerText);
  ok('seo shows real health score', /Content health/.test(seoText), seoText.slice(0, 250));
  ok('seo shows missing-title badges', /missing title/.test(seoText) || /title ✓/.test(seoText));

  /* 6. AI Studio — real provider status + usage */
  await page.evaluate(() => { location.hash = 'aistudio'; });
  await page.waitForTimeout(2500);
  const aiText = await page.evaluate(() => document.body.innerText);
  ok('ai studio shows provider status', /provider/.test(aiText) && /Copilot tools still work|with keys/.test(aiText), aiText.slice(0, 300));
  ok('ai studio usage chip has real numbers', /call\(s\)/.test(aiText));
  await page.click('[data-seo-scan]');
  await page.waitForTimeout(1500);
  const aiScan = await page.evaluate(() => document.body.innerText);
  ok('seo assistant scan lists missing items', /missing SEO metadata|All .* have SEO/.test(aiScan));

  /* 7. Proposals — PDF download (self-sufficient: create one if none exist) */
  await page.evaluate(async () => {
    const has = await (await fetch('/api/proposals', { credentials: 'same-origin' })).json();
    if (!(has.data || []).length) {
      await fetch('/api/proposals', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': AV.api.csrf }, body: JSON.stringify({ title: 'PDF Test Proposal', client_name: 'Test Co', summary: 'generated for PDF verification' }) });
    }
  });
  await page.evaluate(() => { location.hash = 'proposals'; });
  await page.waitForTimeout(1800);
  const dlPromise = page.waitForEvent('download', { timeout: 8000 }).catch(() => null);
  await page.click('[data-pdf]:last-of-type, [data-pdf]').catch(() => {});
  const dl = await dlPromise;
  ok('proposal PDF downloads', !!dl);

  await browser.close();
  console.log(fails.length ? `\n${fails.length} FAILURES` : '\nALL FUNCTIONAL TESTS PASS');
  process.exit(fails.length ? 1 : 0);
})();
