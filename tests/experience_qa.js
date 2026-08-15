/* Experience page QA: structure, content, responsive, expand interaction */
const { chromium } = require('playwright');
const WIDTHS = [[320,800],[360,800],[375,812],[390,844],[414,896],[430,932],[768,1024],[820,1180],[1024,768],[1280,720],[1366,768],[1440,900],[1920,1080]];
const EXPECTED = [
  ['RAMS Creative Technologies', 'Creative Head', 'Sep 2024 — Jan 2026', 'Immersive & Brand Systems'],
  ['PlugXR Reality', 'Creative Head', 'Jan 2024 — May 2024', 'AR/VR Platform & Experience Design'],
  ['Independent', 'Creative Director', 'Oct 2022 — Jan 2024', 'Experience & Innovation Consultant'],
  ['RAMS Creative Technologies', 'Creative Head', 'Sep 2021 — Sep 2022', ''],
  ['Angel Creations', 'Creative Director', 'Jan 2016 — Apr 2021', ''],
  ['Arena Animation', 'Creative Project Manager', 'Jan 2014 — Jan 2016', ''],
];
(async () => {
  const browser = await chromium.launch();
  const issues = [];
  // 1. content + order + expand at desktop
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errs = [];
  page.on('pageerror', e => errs.push(e.message.slice(0, 90)));
  await page.goto('http://127.0.0.1:8092/experience.html?eq=1', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);
  const content = await page.evaluate(() => {
    const jobs = Array.from(document.querySelectorAll('.exp-job')).map(j => ({
      role: (j.querySelector('.exp-job__role') || {}).textContent || '',
      roleSub: (j.querySelector('.exp-job__role-sub') || {}).textContent || '',
      company: (j.querySelector('.exp-job__company') || {}).textContent || '',
      date: (j.querySelector('.exp-job__date time') || {}).textContent || '',
      summary: (j.querySelector('.exp-job__summary') || {}).textContent || '',
      disc: Array.from(j.querySelectorAll('.exp-job__disc span')).map(s => s.textContent),
      visResp: j.querySelectorAll('.exp-job__list:not([hidden]) li').length,
      hiddenResp: (j.querySelector('.exp-job__list[hidden]') || { children: [] }).children.length || 0,
      more: (j.querySelector('.exp-job__more') || {}).textContent || '',
      img: !!j.querySelector('.exp-job__img'),
    }));
    return jobs;
  });
  let okOrder = content.length === 6;
  for (let i = 0; i < 6; i++) {
    const j = content[i], e = EXPECTED[i];
    if (j.role !== e[1] || !j.company.startsWith(e[0]) || j.date !== e[2]) {
      okOrder = false; issues.push(`JOB ${i} MISMATCH: ${JSON.stringify(j)} vs ${JSON.stringify(e)}`);
    }
    if (e[3] && !j.roleSub.includes(e[3])) issues.push(`JOB ${i} role_sub missing: ${e[3]} (got: ${j.roleSub})`);
    if (!j.disc.length) issues.push(`JOB ${i} no disciplines`);
    if (j.visResp < 5) issues.push(`JOB ${i} only ${j.visResp} visible responsibilities`);
    if (j.hiddenResp === 0 && j.more) issues.push(`JOB ${i} has more button but no hidden list`);
  }
  console.log('CONTENT:', okOrder ? '6/6 jobs correct order + data' : 'MISMATCH', '| discipline counts:', content.map(j => j.disc.length).join(','));
  // expand interaction
  const exp = await page.evaluate(async () => {
    const btn = document.querySelector('.exp-job__more');
    const list = document.getElementById(btn.getAttribute('aria-controls'));
    const before = list.querySelectorAll('li').length;
    btn.click();
    await new Promise(r => setTimeout(r, 400));
    return { aria: btn.getAttribute('aria-expanded'), revealed: list.querySelectorAll('li').length, hiddenNow: list.hidden, before };
  });
  const expOk = exp.aria === 'true' && exp.hiddenNow === false && exp.revealed === exp.before;
  console.log('EXPAND:', expOk ? 'PASS' : 'FAIL', JSON.stringify(exp));
  if (!expOk) issues.push('EXPAND FAIL: ' + JSON.stringify(exp));
  // 2. responsive sweep
  for (const [w, h] of WIDTHS) {
    const p = await browser.newPage({ viewport: { width: w, height: h } });
    await p.goto('http://127.0.0.1:8092/experience.html?w=' + w, { waitUntil: 'domcontentloaded' });
    await p.waitForTimeout(1600);
    const r = await p.evaluate(() => {
      const out = { overflow: document.documentElement.scrollWidth - window.innerWidth, jobs: document.querySelectorAll('.exp-job').length, clipped: [] };
      document.querySelectorAll('.exp-job__role, .exp-job__date time, .exp-job__company').forEach(el => {
        if (el.scrollWidth > el.clientWidth + 2) out.clipped.push(el.className + ' ' + (el.textContent || '').slice(0, 24));
      });
      const tl = document.querySelector('.exp-timeline');
      const tr = tl.getBoundingClientRect();
      out.timelineVisible = tl && tr.width > 0;
      return out;
    });
    if (r.overflow > 0) issues.push(`OVERFLOW +${r.overflow} @${w}x${h}`);
    if (r.jobs !== 6) issues.push(`JOBS ${r.jobs} @${w}x${h}`);
    if (r.clipped.length) issues.push(`CLIPPED @${w}x${h}: ${r.clipped.join('|')}`);
    if (!r.timelineVisible) issues.push(`NO TIMELINE @${w}x${h}`);
    await p.close();
  }
  if (errs.length) issues.push('JS ERR: ' + errs.join('|'));
  console.log(issues.length ? 'ISSUES:\n' + issues.join('\n') : 'EXPERIENCE QA: ALL CLEAN (13 widths)');
  await browser.close();
})();
