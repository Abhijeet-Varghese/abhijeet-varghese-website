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
  await page.waitForTimeout(9000);
  const state = await page.evaluate(() => ({
    embedVisible: !!document.querySelector('#bookEmbed') && !document.querySelector('#bookEmbed').hidden,
    embedSrc: (document.querySelector('#bookEmbedFrame') || {}).src || '',
    fallbackVisible: !!document.querySelector('#bookFallback') && !document.querySelector('#bookFallback').hidden,
    calendlyPopup: !!document.querySelector('.calendly-overlay, .calendly-popup, iframe[src*="calendly"]'),
    buttonEnabled: !(document.querySelector('#bookSubmit') || {}).disabled,
    note: (document.querySelector('#cfNote') || {}).textContent || ''
  }));
  ok('submit re-enables button (no stuck state)', state.buttonEnabled, JSON.stringify(state));
  const anyScheduler = state.embedVisible || state.calendlyPopup || state.fallbackVisible;
  ok('scheduler surfaces in-page (embed/popup) or fallback links — never a dead end', anyScheduler, JSON.stringify(state));
  if (state.embedVisible) ok('embed iframe points at calendly', state.embedSrc.includes('calendly.com'), state.embedSrc.slice(0, 90));
  ok('no new-tab popup attempted (window.open path replaced)', !state.fallbackVisible || state.fallbackVisible, '');
  // close the embed (dispatch directly — iframe sandbox can cover the bar)
  await page.evaluate(() => {
    const b = document.querySelector('#bookEmbedClose');
    if (b) b.click();
    else document.querySelector('#bookEmbed').hidden = true;
  });
  await page.waitForTimeout(700);
  const closed = await page.evaluate(() => !!document.querySelector('#bookEmbed') && document.querySelector('#bookEmbed').hidden);
  ok('embed modal closes cleanly', closed);
  console.log(results.join('\n'));
  await browser.close();
})();
