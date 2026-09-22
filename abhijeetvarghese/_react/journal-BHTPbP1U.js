import{j as e,a as l,b as c,d as h,e as d,f as p,g as u,h as m,S as g,i as v,k as f}from"./useCmsSeo-C1WmqeVb.js";import{u as j,a as _}from"./useMobileChrome-BJMjfRik.js";import{r as x}from"./react-SIwY82C9.js";function y(){x.useEffect(()=>{document.body.classList.add("journal-page");const n=["/js/main.js?v=4.6.0","/js/elevate.js?v=4.4.1","/js/mobile-chrome.js?v=2.0.0"];let r=!1;return(async()=>{for(const a of n){if(r)break;document.querySelector(`script[src="${a}"]`)||await new Promise((o,i)=>{const t=document.createElement("script");t.src=a,t.defer=!0,t.onload=()=>o(),t.onerror=()=>i(new Error("Failed "+a)),document.body.appendChild(t)})}})().catch(a=>console.error("[Journal]",a)),()=>{r=!0}},[])}function w(){return e.jsx("div",{dangerouslySetInnerHTML:{__html:`<section class="page-hero" aria-label="Journal">
      <div class="container">
        <div class="chapter__meta page-hero__meta" data-reveal>
          <span class="chapter__num">06</span><span class="chapter__rule"></span><span class="chapter__tag">Journal</span>
        </div>
        <h1 class="page-hero__title" data-reveal>Notes from the <em>workbench</em>.</h1>
        <p class="page-hero__lede" data-reveal style="--d:.15s">Unpolished, honest, dated. The thinking that happens between projects.</p>
      </div>
    </section>
<section class="page-section t-light"><div class="container"><div class="entry" data-reveal style="border-top:1px solid var(--cl)"></div><article class="entry" data-reveal>
          <p class="entry__meta"><span>Journal · 4 min</span></p>
          <h2><a href="/journal-what-a-year-of-ai-enabled-production-taught-me/">What a year of AI-enabled production taught me</a></h2>
          <p>Compression is the real gift.</p>
          <p style="margin-top:12px"><a class="link-arrow" href="/journal-what-a-year-of-ai-enabled-production-taught-me/">Read the entry <svg class="btn__arrow" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M2 8h11M9 3.5 13.5 8 9 12.5" stroke="currentColor" stroke-width="1.6"/></svg></a></p>
        </article>
<article class="entry" data-reveal>
          <p class="entry__meta"><span>Journal · 3 min</span></p>
          <h2><a href="/journal-the-experience-centre-as-a-strategic-instrument/">The experience centre as a strategic instrument</a></h2>
          <p>The best centres are decision rooms, not showrooms.</p>
          <p style="margin-top:12px"><a class="link-arrow" href="/journal-the-experience-centre-as-a-strategic-instrument/">Read the entry <svg class="btn__arrow" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M2 8h11M9 3.5 13.5 8 9 12.5" stroke="currentColor" stroke-width="1.6"/></svg></a></p>
        </article></div></section>`}})}function b(){return e.jsx("svg",{width:"17",height:"17",viewBox:"0 0 18 18",fill:"none","aria-hidden":"true",children:e.jsx("path",{d:"m3 3 12 12M15 3 3 15",stroke:"currentColor",strokeWidth:"1.7",strokeLinecap:"round"})})}function k(){return l(),c(),h(),d(),j(),_(),p(),u(),m("/journal/",{title:"Journal — Abhijeet Varghese"}),y(),e.jsxs(e.Fragment,{children:[e.jsx(g,{activePath:"/journal/"}),e.jsx("a",{className:"page-close",href:"/","data-history-close":"","aria-label":"Back to previous page",children:e.jsx(b,{})}),e.jsx("main",{id:"main",children:e.jsx(w,{})}),e.jsx(v,{})]})}const s=document.getElementById("root");s&&f(s).render(e.jsx(k,{}));
