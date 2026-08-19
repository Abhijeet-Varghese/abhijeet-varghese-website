const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const results = [];
  const ok = (n, c, x = '') => results.push(`${c ? 'PASS' : 'FAIL'}  ${n}${c ? '' : '  ' + x}`);
  page.on('pageerror', e => ok('no page errors', false, String(e).slice(0, 120)));

  await page.goto('http://127.0.0.1:8092/contact.html', { waitUntil: 'networkidle' });
  ok('booking form present', await page.evaluate(() => !!document.querySelector('#contactForm')));
  await page.fill('#cfName', 'Browser Test User');
  await page.fill('#cfEmail', 'booking-flow@test.dev');
  await page.evaluate(() => document.querySelector('#dateTrigger').scrollIntoView({ block: 'center' }));
  await page.waitForTimeout(400);
  await page.click('#dateTrigger', { timeout: 8000 });
  await page.waitForTimeout(500);
  const dayPicked = await page.evaluate(() => {
    const btn = document.querySelector('#dpGrid button:not([disabled])');
    if (btn) { btn.click(); return true; }
    return false;
  });
  ok('date picker selects a day', dayPicked);
  await page.waitForTimeout(400);
  const slotPicked = await page.evaluate(() => {
    const b = document.querySelector('.tslot:not([disabled])');
    if (b) { b.click(); return true; }
    return false;
  });
  ok('time slot selectable', slotPicked);
  await page.waitForTimeout(400);
  await page.evaluate(() => document.querySelector('#contactForm').requestSubmit());
  await page.waitForTimeout(1800);
  const state = await page.evaluate(() => ({
    path: location.pathname,
    doneVisible: !!document.querySelector('#bookDone') && !document.querySelector('#bookDone').hidden,
    formHidden: !!document.querySelector('#bookView') && document.querySelector('#bookView').hidden,
    doneText: (document.querySelector('#doneSummary') || {}).textContent || '',
    calendlyScript: !!document.querySelector('script[src*="calendly"]'),
    calendlyFrame: !!document.querySelector('iframe[src*="calendly"]'),
    buttonEnabled: !(document.querySelector('#bookSubmit') || {}).disabled
  }));
  ok('request remains on contact page', state.path === '/contact.html', JSON.stringify(state));
  ok('in-page success state shown', state.doneVisible && state.formHidden && /request/i.test(state.doneText), JSON.stringify(state));
  ok('no Calendly script or iframe loaded', !state.calendlyScript && !state.calendlyFrame, JSON.stringify(state));
  ok('submit button is not left disabled', state.buttonEnabled, JSON.stringify(state));
  console.log(results.join('\n'));
  await browser.close();
})();
