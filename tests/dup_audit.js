const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('http://127.0.0.1:8092/story.html?as4=1', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2400);
  const r = await page.evaluate(() => {
    // collect visible copy, excluding nav/footer/compass/aria-hidden
    const seen = {};
    document.querySelectorAll('main p, main h1, main h2, main h3, main li, main figcaption, main a, main strong, main em, main span.about-prologue__mq-track span').forEach(el => {
      if (el.closest('.about-compass')) return;
      if (el.closest('[aria-hidden="true"]')) return;
      const t = (el.textContent || '').trim().replace(/\s+/g, ' ');
      if (t.length < 12) return;
      seen[t] = (seen[t] || 0) + 1;
    });
    const dups = Object.entries(seen).filter(([, c]) => c > 1).map(([t, c]) => `${c}× ${t.slice(0, 90)}`);
    // also check for the specific removed elements
    return {
      dups,
      removed: {
        tag: !!document.querySelector('.about-prologue__tag'),
        eyebrow: !!document.querySelector('.about-prologue__eyebrow'),
        roleLine: !!document.querySelector('.about-prologue__role:not(.about-prologue__role-chip)'),
        plaque: !!document.querySelector('.about-frame__identity'),
        littleContext: Array.from(document.querySelectorAll('p')).some(p => (p.textContent||'').includes('A little context')),
        reel: !!document.querySelector('.about-act__reel'),
        sceneNums: Array.from(document.querySelectorAll('.about-act__scene')).filter(s => getComputedStyle(s, '::before').content !== 'none').length,
        philosophy: !!document.querySelector('.about-philosophy'),
        creditsMq: !!document.querySelector('.about-credits__mq'),
        fin: !!document.querySelector('.about-credits__fin'),
        creditsImg: !!document.querySelector('.about-credits__bg, .about-credits__portrait'),
        credoDup: (document.body.textContent.match(/creative person first/gi) || []).length,
        realityDup: (document.body.textContent.match(/survive reality/gi) || []).length,
        spaceNarrDup: (document.body.textContent.match(/narrative too/gi) || []).length,
      },
    };
  });
  console.log('DUP AUDIT:', JSON.stringify(r, null, 1));
  const issues = [];
  if (r.dups.length) issues.push('DUPES: ' + r.dups.join(' | '));
  for (const [k, v] of Object.entries(r.removed)) {
    if (v && k !== 'credoDup' && k !== 'realityDup' && k !== 'spaceNarrDup') issues.push('STILL PRESENT: ' + k);
  }
  if (r.removed.credoDup > 1) issues.push('CREDO DUPLICATED ' + r.removed.credoDup);
  if (r.removed.realityDup > 1) issues.push('REALITY DUPLICATED ' + r.removed.realityDup);
  if (r.removed.spaceNarrDup > 1) issues.push('SPACE NARRATIVE DUPLICATED ' + r.removed.spaceNarrDup);
  console.log(issues.length ? 'DUP ISSUES:\n' + issues.join('\n') : 'DUP AUDIT: ALL CLEAN');
  await browser.close();
})();
