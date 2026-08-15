/* Browser sweep of the AV OS admin app — every view, console error free. */
const { chromium } = require('playwright');

const BASE = 'http://127.0.0.1:8092';
const EMAIL = 'admin@avos.test';
const PASS = 'AV2E2E!2345xY';

const views = [
  'publishing', 'versions', 'emailtemplates', 'campaigns',
  'dashboard', 'homepage', 'pages', 'navigation', 'projects', 'casestudies',
  'clients', 'thinking', 'journal', 'futurelab',
  'crm', 'contacts', 'companies', 'meetings', 'bizprojects', 'proposals', 'campaigns', 'automations',
  'media', 'downloads', 'testimonials', 'speaking', 'forms', 'bookings', 'leads', 'seo', 'analytics',
  'aistudio', 'copilot', 'knowledge', 'designsystem',
  'notifications', 'platform', 'health', 'security', 'users', 'emailtemplates',
  'settings', 'backups', 'integrations', 'logs',
  'research', 'knowledgegraph', 'socialhub'
];

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push('[console] ' + m.text().slice(0, 200)); });
  page.on('pageerror', e => errors.push('[pageerror] ' + String(e).slice(0, 200)));
  page.on('requestfailed', r => errors.push('[reqfail] ' + r.url().slice(0, 120) + ' ' + (r.failure() || {}).errorText));

  // login
  await page.goto(BASE + '/admin/login.php', { waitUntil: 'networkidle' });
  await page.fill('input[name="email"], input[type="email"], #email, input[type="text"]', EMAIL).catch(() => {});
  await page.fill('input[type="password"]', PASS);
  await page.click('button[type="submit"], .btn--primary');
  await page.waitForURL(/admin\/app/, { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(2500);

  const failures = [];
  for (const v of views) {
    errors.length = 0;
    try {
      await page.evaluate(v => { location.hash = v; }, v);
      await page.waitForTimeout(1600);
      const bodyText = await page.evaluate(() => document.body.innerText.slice(0, 300));
      if (/No route|undefined|Internal server error/.test(bodyText)) failures.push(v + ' :: BAD RENDER :: ' + bodyText.slice(0, 120));
      if (errors.length) failures.push(v + ' :: ' + errors.slice(0, 3).join(' | '));
    } catch (e) {
      failures.push(v + ' :: EXCEPTION ' + String(e).slice(0, 150));
    }
  }
  console.log(failures.length ? 'FAILURES:\n' + failures.join('\n') : 'ALL ' + views.length + ' VIEWS CLEAN');
  await browser.close();
  process.exit(failures.length ? 1 : 0);
})();
