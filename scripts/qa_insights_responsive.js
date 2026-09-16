const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const base = 'http://127.0.0.1:8092';
const routes = [
  ['/insights/', 'listing'],
  ['/insights/technology-should-feel-human/', 'human'],
  ['/insights/ai-isnt-replacing-creativity/', 'ai'],
  ['/insights/designing-experiences-people-remember/', 'memory'],
  ['/insights/why-enterprise-experiences-fail/', 'enterprise']
];
const viewports = [
  { name: '320', width: 320, height: 720 },
  { name: '390', width: 390, height: 844 },
  { name: '768', width: 768, height: 1024 },
  { name: '1024', width: 1024, height: 768 },
  { name: '1440', width: 1440, height: 1000 },
  { name: '2560', width: 2560, height: 1440 },
  { name: '3840', width: 3840, height: 2160 }
];
const out = path.resolve('qa-insights-responsive-v2');
fs.mkdirSync(out, { recursive: true });
(async () => {
 const browser = await chromium.launch({headless:true});
 const report = { created: new Date().toISOString(), routes: [], errors: [], failedAssets: [] };
 for (const [route, slug] of routes) {
  for (const viewport of viewports) {
   const page = await browser.newPage({ viewport });
   const errors=[]; const failed=[];
   page.on('console', msg => { if (msg.type()==='error') errors.push(msg.text()); });
   page.on('pageerror', error => errors.push(String(error)));
   page.on('requestfailed', request => { if (!request.url().includes('/api/analytics/track')) failed.push(`${request.url()} — ${request.failure()?.errorText}`); });
   const response=await page.goto(base+route, {waitUntil:'networkidle',timeout:45000});
   await page.waitForTimeout(200);
   const check = await page.evaluate(() => {
      const d=document.documentElement, body=document.body;
      const h1=[...document.querySelectorAll('h1')].map(x=>x.innerText.replace(/\s+/g,' ').trim());
      const root=document.querySelector('main');
      const overflow=(d.scrollWidth-window.innerWidth);
      return {
       title:document.title, h1, statusRoot:root?.className || '', overflow,
       hasFooter:!!document.querySelector('footer'), hasContact:[...document.links].some(a=>a.href.includes('/contact/')),
       links:[...document.querySelectorAll('a[href^="/insights/"]')].length,
       frameworkCanvases:document.querySelectorAll('.irs-scroll').length,
       readingWidth:(() => { const p=document.querySelector('.ht1-prose,.ai2-prose,.me2-prose,.ee4-prose'); return p ? Math.round(p.getBoundingClientRect().width) : null; })(),
       mainRight:root ? Math.round(root.getBoundingClientRect().right) : null,
       viewportWidth:window.innerWidth
      };
   });
   // Capture a representative first viewport for every page at mobile, tablet, desktop and ultrawide.
   if (['320','768','1440','2560'].includes(viewport.name)) await page.screenshot({path:path.join(out,`${slug}-${viewport.name}.png`), fullPage:false});
   const row={route,slug,viewport:viewport.name,status:response?.status(),...check,errors,failed};
   report.routes.push(row); report.errors.push(...errors.map(e=>({route,viewport:viewport.name,error:e}))); report.failedAssets.push(...failed.map(e=>({route,viewport:viewport.name,error:e})));
   await page.close();
  }
 }
 // Mobile interaction checks: tab panels retain semantic, tap/keyboard discoverable explanations.
 for (const [route, target, panel, phrase] of [
  ['/insights/technology-should-feel-human/','#ht-test-control','#ht-panel-control','feel in control'],
  ['/insights/ai-isnt-replacing-creativity/','#ai-test-human','#ai-panel-human','human still own the decision'],
  ['/insights/designing-experiences-people-remember/','#memory-tab-image','#memory-panel-image','One image:'],
  ['/insights/designing-experiences-people-remember/','#memory-tab-feeling','#memory-panel-feeling','One feeling:'],
  ['/insights/designing-experiences-people-remember/','#memory-tab-idea','#memory-panel-idea','One idea:'],
  ['/insights/designing-experiences-people-remember/','#memory-tab-action','#memory-panel-action','One action:'],
  ['/insights/designing-experiences-people-remember/','#memory-tab-story','#memory-panel-story','One story:']
 ]) {
   const page=await browser.newPage({viewport:{width:390,height:844}});
   await page.goto(base+route,{waitUntil:'networkidle',timeout:45000});
   await page.locator(target).scrollIntoViewIfNeeded(); await page.locator(target).click();
   const details=await page.evaluate(([target,panel,phrase])=>{const tab=document.querySelector(target),content=document.querySelector(panel);return {selected:tab.getAttribute('aria-selected'),hidden:content.hidden,text:content.innerText,passed:tab.getAttribute('aria-selected')==='true'&&!content.hidden&&content.innerText.includes(phrase)}},[target,panel,phrase]);
   report.routes.push({route,interaction:target,...details}); await page.close();
 }
 // The enterprise Blueprint remains a contained keyboard-scrollable visual canvas rather than forcing page overflow.
 { const page=await browser.newPage({viewport:{width:390,height:844}}); await page.goto(base+'/insights/why-enterprise-experiences-fail/',{waitUntil:'networkidle',timeout:45000}); const figure=page.locator('.ee4-blueprint__figure'); await figure.scrollIntoViewIfNeeded(); const before=await figure.evaluate(e=>({width:e.scrollWidth,client:e.clientWidth,left:e.scrollLeft})); await figure.focus(); await page.keyboard.press('ArrowRight'); await page.waitForTimeout(120); const after=await figure.evaluate(e=>e.scrollLeft); report.routes.push({route:'/insights/why-enterprise-experiences-fail/',interaction:'enterprise blueprint keyboard canvas',before,after,passed:before.width>before.client&&after>before.left}); await page.close(); }
 // Shared mobile navigation remains reachable and exposes its conversion path.
 { const page=await browser.newPage({viewport:{width:320,height:720}}); await page.goto(base+'/insights/',{waitUntil:'networkidle',timeout:45000}); await page.locator('#navToggle').click(); await page.waitForTimeout(80); const state=await page.evaluate(()=>({expanded:document.querySelector('#navToggle').getAttribute('aria-expanded'),open:document.querySelector('#mobileMenu').classList.contains('is-open'),visible:!document.querySelector('#mobileMenu').hidden,contact:!!document.querySelector('#mobileMenu a[href="/contact/"]')})); report.routes.push({route:'/insights/',interaction:'mobile navigation',...state,passed:state.expanded==='true'&&state.open&&state.visible&&state.contact}); await page.close(); }
 const isReadingMeasureValid = x => !x.readingWidth || (['768','1024'].includes(x.viewport) ? x.readingWidth >= 600 && x.readingWidth <= 700 : ['1440','2560','3840'].includes(x.viewport) ? x.readingWidth >= 680 && x.readingWidth <= 780 : true);
 const routeFailures=report.routes.filter(x=>x.viewport && (x.status!==200 || x.overflow>1 || (x.h1 && x.h1.length!==1) || x.errors?.length || x.failed?.length || !isReadingMeasureValid(x)));
 const interactionFailures=report.routes.filter(x=>x.interaction&&!x.passed);
 const failures=routeFailures.concat(interactionFailures);
 fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));
 fs.writeFileSync(path.join(out,'summary.txt'),[
   `Routes / viewport checks: ${report.routes.filter(x=>x.viewport).length}`,
   `Unexpected failures: ${failures.length}`,
   `Console errors: ${report.errors.length}`,
   `Failed requests: ${report.failedAssets.length}`,
   `Interaction checks: ${report.routes.filter(x=>x.interaction).length}`
 ].join('\n')+'\n');
 console.log(fs.readFileSync(path.join(out,'summary.txt'),'utf8'));
 await browser.close();
 if(failures.length) process.exitCode=2;
})();
