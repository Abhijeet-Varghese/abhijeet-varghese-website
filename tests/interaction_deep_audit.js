const { chromium } = require('playwright');

const BASE_URL = 'http://127.0.0.1:8000';

async function runInteractionAudit() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const failures = [];

  console.log('=== RUNNING DEEP INTERACTION AUDIT ===');

  // 1. Mobile Menu Test
  console.log('1. Testing Mobile Navigation Menu...');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(400);

  const toggle = await page.$('.nav-toggle');
  if (toggle) {
    await toggle.click();
    await page.waitForTimeout(400);
    const menuVisible = await page.evaluate(() => {
      const m = document.querySelector('.mobile-menu');
      return m && !m.hidden && window.getComputedStyle(m).display !== 'none';
    });
    console.log(' Mobile menu opens:', menuVisible);
    if (!menuVisible) failures.push('Mobile menu failed to open on toggle click');

    const closeBtn = await page.$('.mobile-menu__close, #mobileClose');
    if (closeBtn) {
      await closeBtn.click();
      await page.waitForTimeout(600);
      const menuHidden = await page.evaluate(() => {
        const m = document.querySelector('.mobile-menu');
        return !m || m.hidden || !m.classList.contains('is-open');
      });
      console.log(' Mobile menu closes:', menuHidden);
      if (!menuHidden) failures.push('Mobile menu failed to close on close click');
    }
  }

  // 2. Recruiters Accordions
  console.log('2. Testing Recruiters Page Accordions...');
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${BASE_URL}/for-recruiters/`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(600);

  // Leadership stack layer click
  const layer = await page.$('.rp-stack__layer');
  if (layer) {
    await layer.click();
    await page.waitForTimeout(300);
    const isActive = await page.evaluate(() => {
      const l = document.querySelector('.rp-stack__layer');
      return l && l.classList.contains('is-active');
    });
    console.log(' Leadership layer accordion toggles:', isActive);
    if (!isActive) failures.push('Leadership layer failed to toggle is-active');
  }

  // FAQ accordion click
  const faqBtn = await page.$('.rp-faq__q');
  if (faqBtn) {
    await faqBtn.click();
    await page.waitForTimeout(300);
    const faqOpen = await page.evaluate(() => {
      const item = document.querySelector('.rp-faq__item');
      return item && item.classList.contains('is-open');
    });
    console.log(' FAQ accordion item opens:', faqOpen);
    if (!faqOpen) failures.push('FAQ accordion failed to expand on click');
  }

  // 3. Skip Link & Focus
  console.log('3. Testing Skip Link...');
  await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
  await page.keyboard.press('Tab');
  const focusedTag = await page.evaluate(() => document.activeElement ? document.activeElement.tagName + '.' + document.activeElement.className : '');
  console.log(' First focused element:', focusedTag);
  if (!focusedTag.includes('skip-link')) {
    failures.push(`First Tab expected skip-link, found ${focusedTag}`);
  }

  // 4. Reduced Motion
  console.log('4. Testing Reduced Motion on Recruiters...');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(`${BASE_URL}/for-recruiters/`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(400);
  const revealsVisible = await page.evaluate(() => {
    const srs = Array.from(document.querySelectorAll('.rp-sr'));
    return srs.every(el => window.getComputedStyle(el).opacity === '1');
  });
  console.log(' All reveals visible under reduced-motion:', revealsVisible);
  if (!revealsVisible) failures.push('Reduced motion failed: some elements not visible');

  await browser.close();
  console.log('======================================');
  if (failures.length > 0) {
    console.log('INTERACTION FAILURES:\n' + failures.join('\n'));
    process.exit(1);
  } else {
    console.log('✅ ALL INTERACTION CHECKS PASSED!');
    process.exit(0);
  }
}

runInteractionAudit().catch(e => {
  console.error(e);
  process.exit(1);
});
