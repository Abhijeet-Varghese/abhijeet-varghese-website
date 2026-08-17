/* Pixel-geometry QA: containers, section rhythm, hero composition and shared axes. */
const { chromium } = require('playwright');

const BASE = process.argv[2] || 'http://127.0.0.1:8092';
const PAGES = [
  '/', '/story.html', '/experience.html', '/case-studies.html', '/portfolio.html',
  '/contact.html', '/insights.html', '/journal.html', '/for-recruiters.html',
  '/consulting.html', '/sitemap.html', '/privacy-policy.html', '/terms.html',
  '/search.html', '/404.html',
  '/case-study-intuitive-experiences-for-industrial-environments.html',
  '/case-study-immersive-solutions-for-the-indian-army.html',
  '/experience-design/orange-business-executive-briefing-center/',
  '/essay-technology-should-feel-human.html', '/essay-ai-isnt-replacing-creativity.html',
  '/essay-designing-experiences-people-remember.html', '/essay-why-enterprise-experiences-fail.html',
  '/journal-what-a-year-of-ai-enabled-production-taught-me.html',
  '/journal-the-experience-centre-as-a-strategic-instrument.html'
];
const VIEWPORTS = [[390,844],[768,1024],[1366,600],[1440,700],[1920,800],[3440,1440],[3840,2160]];

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const issues = [];
  let sectionCount = 0;
  await page.route('**/api/analytics/track', route => route.fulfill({ status: 200, body: '{"ok":true}' }));

  for (const path of PAGES) {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(BASE + path, { waitUntil: 'load' });
    sectionCount += await page.locator('main section').count();
    for (const [width, height] of VIEWPORTS) {
      await page.setViewportSize({ width, height });
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      const result = await page.evaluate(() => {
        const rect = element => {
          const r = element.getBoundingClientRect();
          return { left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height };
        };
        const topSections = [...document.querySelectorAll('main > section, main > article > section')];
        const overlaps = [];
        for (let i=1;i<topSections.length;i++) {
          const previous = rect(topSections[i-1]);
          const current = rect(topSections[i]);
          const amount = previous.bottom-current.top;
          const intentional = topSections[i].matches('.portfolio-index,.about-frame');
          if (amount > (intentional ? 32 : 2)) overlaps.push(`${topSections[i-1].className}→${topSections[i].className}:${Math.round(amount)}`);
        }
        const containers = [...document.querySelectorAll('main > section > .container,main > article > section > .container,.article-body > .container')]
          .map(element => rect(element))
          .filter(item => item.width > 0)
          .map(item => `${Math.round(item.left)}:${Math.round(item.width)}`);
        const uniqueAxes = [...new Set(containers)];
        const headingIssues = [...document.querySelectorAll('h1,h2,h3')].filter(element => {
          const style=getComputedStyle(element); if(style.display==='none'||!element.getClientRects().length)return false;
          let parent=element.parentElement; while(parent&&parent!==document.body){let o=getComputedStyle(parent).overflowX;if(['hidden','clip','auto','scroll'].includes(o))return false;parent=parent.parentElement;}
          const r=element.getBoundingClientRect(); const fs=parseFloat(style.fontSize)||1; const lh=parseFloat(style.lineHeight)||fs; const ratio=lh/fs;
          const badLeading=ratio < .76 || (fs >= 32 ? ratio > 1.4 : ratio > 1.72);
          return r.left < -1 || r.right > innerWidth+1 || badLeading;
        }).map(element=>`${element.tagName}.${element.className}`);
        const nav=rect(document.querySelector('.site-nav__inner'));
        const h1=rect(document.querySelector('h1'));
        const firstSection=document.querySelector('main section');
        const firstRect=firstSection?rect(firstSection):null;
        let shortHero={};
        if(document.body.classList.contains('home-arena')){
          const actions=rect(document.querySelector('.hp-hero__actions')); const avail=rect(document.querySelector('.hp-hero__avail'));
          shortHero={actionsBottom:actions.bottom,availBottom:avail.bottom};
        }
        if(document.body.classList.contains('portfolio-page')){
          const foot=rect(document.querySelector('.portfolio-hero__foot')); const next=rect(document.querySelector('.portfolio-index'));
          shortHero={footBottom:foot.bottom,nextTop:next.top};
        }
        if(document.body.classList.contains('about-page')){
          const footer=rect(document.querySelector('.about-prologue__footer')); shortHero={skipBottom:footer.bottom};
        }
        const mediaCollisions=[];
        if(document.body.classList.contains('home-arena')&&innerWidth>=768&&innerWidth<=1080){
          const lede=rect(document.querySelector('.hp-hero__lede')), portrait=rect(document.querySelector('.hp-hero__portrait'));
          if(lede.bottom>portrait.top-8)mediaCollisions.push(`home-lede/portrait:${Math.round(lede.bottom-portrait.top)}`);
        }
        return {
          overflow:document.documentElement.scrollWidth-innerWidth,
          uniqueAxes,overlaps,headingIssues,mediaCollisions,nav,h1,firstRect,shortHero,
          sectionCount:document.querySelectorAll('main section').length
        };
      });
      const at=`${path} @ ${width}×${height}`;
      if(result.overflow>1)issues.push(`${at}: overflow ${result.overflow}`);
      if(result.uniqueAxes.length>2)issues.push(`${at}: inconsistent primary axes ${result.uniqueAxes.join(',')}`);
      if(result.overlaps.length)issues.push(`${at}: section overlap ${result.overlaps.join('|')}`);
      if(result.headingIssues.length)issues.push(`${at}: heading geometry ${result.headingIssues.join('|')}`);
      if(result.mediaCollisions.length)issues.push(`${at}: ${result.mediaCollisions.join('|')}`);
      if(result.h1.top<result.nav.bottom+4 && result.h1.bottom>result.nav.top)issues.push(`${at}: H1 collides with navigation`);
      if(width>=1081&&height<=800&&path==='/'&&(result.shortHero.actionsBottom>height-24||result.shortHero.availBottom>height-16))issues.push(`${at}: homepage primary actions below first frame`);
      if(width>=901&&height<=640&&path==='/portfolio.html'&&result.shortHero.footBottom>result.shortHero.nextTop-8)issues.push(`${at}: portfolio proof strip obscured by next section`);
      if(width>=701&&height<=640&&path==='/story.html'&&result.shortHero.skipBottom>height-4)issues.push(`${at}: story CTA clipped`);
    }
  }
  await browser.close();
  if(issues.length){console.error(`VISUAL PRECISION QA: ${issues.length} issue(s)`);issues.slice(0,120).forEach(issue=>console.error(' - '+issue));process.exit(1);}
  console.log(`VISUAL PRECISION QA: ALL CLEAN (${PAGES.length} pages · ${sectionCount} semantic sections · ${VIEWPORTS.length} composition viewports)`);
})();
