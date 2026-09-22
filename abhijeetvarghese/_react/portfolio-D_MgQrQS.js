import{j as l,a as J,b as Y,d as X,e as K,f as U,g as G,h as Q,S as Z,i as ee,k as ae}from"./useCmsSeo-C1WmqeVb.js";import{u as se,a as ie}from"./useMobileChrome-BJMjfRik.js";import{r as te}from"./react-SIwY82C9.js";function ne(){te.useEffect(()=>{const y=window.matchMedia("(prefers-reduced-motion: reduce)").matches,N=window.matchMedia("(hover: hover) and (pointer: fine)").matches,g=(e,a=document)=>(a||document).querySelector(e),A=(e,a=document)=>[...(a||document).querySelectorAll(e)],_=(e,a,i)=>e<a?a:e>i?i:e;document.body.classList.add("portfolio-page");const M=document.getElementById("main");M&&M.classList.add("pf");const B=A("[data-pf-open]"),j=A("[data-pf-live]");let u=null,b=null;"IntersectionObserver"in window?(u=new IntersectionObserver(e=>{e.forEach(a=>{a.isIntersecting&&(a.target.classList.add("is-open"),u.unobserve(a.target))})},{threshold:.22,rootMargin:"0px 0px -8% 0px"}),B.forEach(e=>u.observe(e)),b=new IntersectionObserver(e=>{e.forEach(a=>{a.target.classList.toggle("is-live",a.isIntersecting)})},{threshold:.05}),j.forEach(e=>b.observe(e))):(B.forEach(e=>e.classList.add("is-open")),j.forEach(e=>e.classList.add("is-live")));const D=g(".pf-overture");D&&requestAnimationFrame(()=>D.classList.add("is-open"));const H="R1O0VanJfTo",W=A("[data-pf-player]"),O=()=>{document.getElementById("pf-yt-pre")||["https://www.youtube-nocookie.com","https://www.youtube.com"].forEach(e=>{const a=document.createElement("link");a.id="pf-yt-pre",a.rel="preconnect",a.href=e,a.crossOrigin="anonymous",document.head.appendChild(a)})},$=(e,a)=>{const i=e.getAttribute("data-yt")||H,s=document.createElement("iframe");s.className="pf-player__frame",s.title=e.getAttribute("data-yt-title")||"Portfolio reel — Abhijeet Varghese",s.src=`https://www.youtube-nocookie.com/embed/${i}?rel=0&modestbranding=1&playsinline=1&hl=en&autoplay=1`,s.setAttribute("allow","accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"),s.setAttribute("allowfullscreen","true"),s.setAttribute("referrerpolicy","strict-origin-when-cross-origin"),s.loading="lazy",e.innerHTML="",e.appendChild(s),e.classList.add("is-playing");try{s.focus()}catch{}};W.forEach(e=>{const a=g(".pf-player__poster",e);a&&a.addEventListener("click",()=>{O(),$(e)})});const R=g(".pf-film");if(R&&"IntersectionObserver"in window){const e=new IntersectionObserver(a=>{a[0].isIntersecting&&(O(),e.disconnect())},{rootMargin:"600px 0px"});e.observe(R)}const x=g(".pf-film__frame"),f=g(".pf-seam");let z=!1;const F=()=>{z=!1;const e=window.innerHeight;if(x&&!y){const a=x.getBoundingClientRect(),i=e*.45,s=_((i-a.bottom)/i,0,1);x.style.setProperty("--exit",s.toFixed(3))}if(f&&!y){const a=f.getBoundingClientRect(),i=_((e-a.top)/(e+a.height),0,1),s=_(i/.22,0,1)*_((1-i)/.28,0,1);f.style.setProperty("--p",i.toFixed(4)),f.style.setProperty("--o",s.toFixed(3)),f.style.setProperty("--o2",_((i-.42)/.25,0,1).toFixed(3))}},C=()=>{z||(z=!0,requestAnimationFrame(F))};(x||f)&&(window.addEventListener("scroll",C,{passive:!0}),window.addEventListener("resize",C,{passive:!0}),F());let I=null;if(N&&!y){const e=g(".pf-cursor"),a=e==null?void 0:e.querySelector(".pf-cursor span");if(e&&a){let i=0,s=0,p=0,d=0,m=null,h=!1;const v=()=>{p+=(i-p)*.18,d+=(s-d)*.18,e.style.transform=`translate3d(${p.toFixed(1)}px,${d.toFixed(1)}px,0)`,Math.abs(i-p)>.1||Math.abs(s-d)>.1?m=requestAnimationFrame(v):(m=null,h=!1)},E=c=>{c.pointerType==="mouse"&&(i=c.clientX,s=c.clientY,h||(h=!0,m=requestAnimationFrame(v)))},k=c=>{var r,n;const t=(n=(r=c.target)==null?void 0:r.closest)==null?void 0:n.call(r,"[data-cursor]");t&&(a.textContent=t.getAttribute("data-cursor")||"",e.classList.add("is-on","is-big"),document.body.classList.add("pf-cursor-active"))},L=c=>{var n,w,S,V;const t=(w=(n=c.target)==null?void 0:n.closest)==null?void 0:w.call(n,"[data-cursor]");!t||((V=(S=c.relatedTarget)==null?void 0:S.closest)==null?void 0:V.call(S,"[data-cursor]"))===t||(e.classList.remove("is-on","is-big"),document.body.classList.remove("pf-cursor-active"))},P=()=>{e.classList.remove("is-on","is-big"),document.body.classList.remove("pf-cursor-active")};document.addEventListener("pointermove",E,{passive:!0}),document.addEventListener("pointerover",k),document.addEventListener("pointerout",L),window.addEventListener("blur",P),I=()=>{m&&cancelAnimationFrame(m),document.removeEventListener("pointermove",E),document.removeEventListener("pointerover",k),document.removeEventListener("pointerout",L),window.removeEventListener("blur",P)}}}const o=document.getElementById("pfProofRail");let T=null;if(o){const e=Array.prototype.slice.call(o.querySelectorAll(".r-proof__panel")),a=document.getElementById("pfProofCur"),i=document.getElementById("pfProofPrev"),s=document.getElementById("pfProofNext"),p=document.getElementById("pfProofProgress");if(e.length){let d=0;const m=t=>{d=t,e.forEach((r,n)=>r.classList.toggle("is-active",n===t)),a&&(a.textContent=String(t+1).padStart(2,"0")),i&&(i.disabled=t===0),s&&(s.disabled=t===e.length-1)},h=()=>{const t=o.scrollLeft+o.clientWidth/2;let r=0;if(e.forEach((n,w)=>{t>=n.offsetLeft&&(r=w)}),m(r),p){const n=o.scrollWidth-o.clientWidth,w=o.scrollLeft;p.style.width=(n>0?w/n*100:0).toFixed(2)+"%"}},v=t=>{const r=e[t];r&&o.scrollTo({left:r.offsetLeft,behavior:y?"auto":"smooth"})},E=()=>h(),k=()=>h(),L=()=>v(Math.max(0,d-1)),P=()=>v(Math.min(e.length-1,d+1)),c=t=>{t.key==="ArrowRight"?(t.preventDefault(),v(Math.min(e.length-1,d+1))):t.key==="ArrowLeft"&&(t.preventDefault(),v(Math.max(0,d-1)))};o.addEventListener("scroll",E,{passive:!0}),window.addEventListener("resize",k,{passive:!0}),i&&i.addEventListener("click",L),s&&s.addEventListener("click",P),o.addEventListener("keydown",c),h(),T=()=>{o.removeEventListener("scroll",E),window.removeEventListener("resize",k),i&&i.removeEventListener("click",L),s&&s.removeEventListener("click",P),o.removeEventListener("keydown",c)}}}return()=>{u==null||u.disconnect(),b==null||b.disconnect(),(x||f)&&(window.removeEventListener("scroll",C),window.removeEventListener("resize",C)),I==null||I(),T==null||T()}},[])}function re(){return l.jsx("div",{dangerouslySetInnerHTML:{__html:`

    <!-- ═══════════════ 01 · PORTFOLIO — the opening frame ═══════════════ -->
    <section class="pf-overture" id="portfolio" data-pf-chapter aria-label="Portfolio introduction">
      <span class="pf-overture__aura" aria-hidden="true"></span>
      <div class="pf-wrap">
        <div class="pf-overture__top">
          <p class="pf-eyebrow">Portfolio</p>
          <p class="pf-overture__idx">Selected practice · 2014 — 2026</p>
        </div>

        <div class="pf-overture__body">
          <h1 class="pf-display pf-overture__title">
            <span class="pf-line"><i>Creative</i></span>
            <span class="pf-line"><i>Director</i></span>
            <span class="pf-line pf-suffix"><i><em>Portfolio</em></i></span>
            <span class="pf-sr"> — Abhijeet Varghese</span>
          </h1>
        </div>

        <div class="pf-overture__foot">
          <p class="pf-overture__disc">Design. Animation.<br>Immersive Experiences.</p>
          <div class="pf-overture__right">
            <p class="pf-lede">A curated overview of my work and creative direction across brands, experiences, animation and immersive environments.</p>
            <p class="pf-scroll"><i aria-hidden="true"></i>Scroll</p>
          </div>
        </div>
      </div>
    </section>

    <!-- ═══════════════ 02 · THE FILM ═══════════════ -->
    <section class="pf-sec pf-film" id="film" data-pf-chapter aria-labelledby="film-title">
      <div class="pf-wrap">
        <div class="pf-film__frame" data-pf-open>
          <div class="pf-film__bar">
            <p class="pf-eyebrow">The film</p>
            <p class="pf-film__stamp">Portfolio reel</p>
          </div>

          <div class="pf-film__stage">
            <div class="pf-film__media">
              <div class="pf-player" data-pf-player data-yt="R1O0VanJfTo" data-yt-title="Creative Director Portfolio — Abhijeet Varghese">
                <button class="pf-player__poster" type="button" data-cursor="Play"
                        aria-label="Play the portfolio film: Creative Director Portfolio">
                  <img src="/assets/media/reel-poster-1280.webp" fetchpriority="high"
                       srcset="/assets/media/reel-poster-768.webp 768w, /assets/media/reel-poster-1280.webp 1280w"
                       sizes="(max-width: 900px) 92vw, 88vw"
                       width="1280" height="720" decoding="async"
                       alt="Portfolio film — Creative Director Portfolio, a showreel of design, animation and immersive experience work by Abhijeet Varghese">
                  <span class="pf-player__scrim" aria-hidden="true"></span>
                  <span class="pf-player__play" aria-hidden="true">
                    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.2v13.6L19 12z"/></svg>
                    <b>Play reel</b>
                  </span>
                </button>
              </div>
            </div>
            <span class="pf-film__panel pf-film__panel--t" aria-hidden="true"></span>
            <span class="pf-film__panel pf-film__panel--b" aria-hidden="true"></span>
            <span class="pf-film__edge" aria-hidden="true"><i></i><i></i><i></i><i></i></span>
          </div>

          <div class="pf-film__caption">
            <div>
              <h2 id="film-title">Creative Director Portfolio</h2>
              <p>Design, animation and immersive experiences — cut as one continuous piece.</p>
            </div>
            <a class="pf-film__yt" href="https://youtu.be/R1O0VanJfTo" target="_blank" rel="noopener">
              <u>Watch on YouTube</u>
              <svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M5 11 11 5M6 4h5v5" stroke="currentColor" stroke-width="1.5"/></svg>
            </a>
          </div>
        </div>
      </div>
    </section>

    <!-- ═══════════════ 03 · THE CONTEXT ═══════════════ -->
    <section class="pf-sec pf-context" id="context" data-pf-chapter aria-labelledby="context-title">
      <div class="pf-wrap pf-context__grid">
        <div class="pf-context__copy">
          <p class="pf-eyebrow" data-reveal>The context</p>
          <h2 id="context-title" data-pf-open>
            <span class="pf-line"><i>Different mediums.</i></span>
            <span class="pf-line" style="--d:.1s"><i><em>One standard of clarity.</em></i></span>
          </h2>
          <p class="pf-lede" data-reveal>The reel gathers selected work across enterprise technology, industrial environments, immersive communication and brand experience — the mediums where complexity has to become legible before it can become convincing.</p>
          <p class="pf-lede" data-reveal>Abhijeet Varghese is a creative director and experience designer working across brand, motion, spatial and immersive work — shaping complex ideas into experiences people can read at a glance.</p>
        </div>

        <dl class="pf-credits" data-reveal>
          <div><dt>Role</dt><dd>Creative Director</dd></div>
          <div><dt>Disciplines</dt><dd class="pf-credits__list">Brand Experience · Motion · 3D · Immersive · Digital</dd></div>
          <div><dt>Location</dt><dd>India</dd></div>
        </dl>
      </div>
    </section>

    <!-- ═══════════════ 04 · PRACTICE SPECTRUM — established chapter, preserved ═══════════════ -->
    <section class="portfolio-practice t-dark" id="practice" data-pf-chapter aria-label="Practice areas">
      <div class="container portfolio-practice__inner">
        <header><p data-reveal>Practice spectrum</p><h2 data-reveal>The medium changes. The work is always about clarity.</h2></header>
        <ol><li data-reveal style="--d:0s"><span>01</span><h3>Creative Strategy</h3><p>Direction before decoration. I turn ambiguity into a shared point of view — the idea everything else hangs on — so teams stop debating taste and start building against intent.</p></li>
<li data-reveal style="--d:0.06s"><span>02</span><h3>Brand Systems</h3><p>Systems, not style guides. Identities engineered to survive real organizations — coherent across products, print, motion and environments, and simple enough for everyone else to use without me.</p></li>
<li data-reveal style="--d:0.12s"><span>03</span><h3>Digital Products</h3><p>Interfaces that respect the person using them. From enterprise dashboards to consumer apps, I design products where the complexity lives in the system — never on the screen.</p></li>
<li data-reveal style="--d:0.18s"><span>04</span><h3>Experience Centres</h3><p>Physical spaces where organizations explain themselves. I architect centres that turn strategy into something visitors can walk through, touch — and finally understand.</p></li>
<li data-reveal style="--d:0.24s"><span>05</span><h3>Creative Leadership</h3><p>Teams make the work; leaders make the conditions. Mentoring, standards, reviews and rituals that raise the ceiling of what a creative team believes it can ship.</p></li>
<li data-reveal style="--d:0.3s"><span>06</span><h3>AI-Enabled Creative Production</h3><p>Machines for momentum, humans for judgment. I design workflows where AI compresses weeks of exploration into days — while taste, ethics and craft remain unmistakably human.</p></li></ol>
      </div>
    </section>

    <!-- transition: the void gives way to paper -->
    <div class="pf-fade pf-fade--to-light" aria-hidden="true"></div>

    <!-- ═══════════════ 05 · CLIENTS — established chapter, preserved ═══════════════ -->
    <section class="chapter clients t-light" id="clients" data-pf-chapter aria-label="Selected organisations">
      <div class="container">
        <header class="chapter__head chapter__head--split">
          <div>
            <div class="chapter__meta" data-reveal><span class="chapter__rule"></span><span class="chapter__tag">Selected organisations</span></div>
            <h2 class="chapter__title" data-reveal>Trusted when the work<br><em>had to be understood.</em></h2>
          </div>
        </header>
        <ul class="logo-wall" data-reveal-group aria-label="Selected organisations">
          <li class="logo-tile" data-reveal><img src="/assets/logos/amazon.webp" alt="Amazon" width="160" height="48" loading="lazy" decoding="async"></li>
          <li class="logo-tile" data-reveal><img src="/assets/logos/orange-business.webp" alt="Orange Business" width="160" height="48" loading="lazy" decoding="async"></li>
          <li class="logo-tile" data-reveal><img src="/assets/logos/indian-army.webp" alt="Indian Army" width="160" height="48" loading="lazy" decoding="async"></li>
          <li class="logo-tile" data-reveal><img src="/assets/logos/tata-advanced-systems.webp" alt="TATA Advanced Systems" width="160" height="48" loading="lazy" decoding="async"></li>
          <li class="logo-tile" data-reveal><img src="/assets/logos/indian-oil.webp" alt="Indian Oil" width="160" height="48" loading="lazy" decoding="async"></li>
          <li class="logo-tile" data-reveal><img src="/assets/logos/bpcl.webp" alt="Bharat Petroleum Corporation Limited" width="160" height="48" loading="lazy" decoding="async"></li>
          <li class="logo-tile" data-reveal><img src="/assets/logos/samsung-sds.webp" alt="Samsung SDS" width="160" height="48" loading="lazy" decoding="async"></li>
          <li class="logo-tile" data-reveal><img src="/assets/logos/sony-bbc-earth.webp" alt="Sony BBC Earth" width="160" height="48" loading="lazy" decoding="async"></li>
          <li class="logo-tile" data-reveal><img src="/assets/logos/nickelodeon.webp" alt="Nickelodeon" width="160" height="48" loading="lazy" decoding="async"></li>
          <li class="logo-tile" data-reveal><img src="/assets/logos/rockwell-automation.webp" alt="Rockwell Automation" width="160" height="48" loading="lazy" decoding="async"></li>
          <li class="logo-tile" data-reveal><img src="/assets/logos/govt-of-rajasthan.webp" alt="Govt. of Rajasthan" width="160" height="48" loading="lazy" decoding="async"></li>
          <li class="logo-tile" data-reveal><img src="/assets/logos/metabloqs.webp" alt="Metabloqs" width="160" height="48" loading="lazy" decoding="async"></li>
          <li class="logo-tile" data-reveal><img src="/assets/logos/papa-johns.webp" alt="Papa John&#039;s" width="160" height="48" loading="lazy" decoding="async"></li>
          <li class="logo-tile" data-reveal><img src="/assets/logos/dunkin.webp" alt="Dunkin&#039; Donuts" width="160" height="48" loading="lazy" decoding="async"></li>
          <li class="logo-tile" data-reveal><img src="/assets/logos/jk-lakshmi-cement.webp" alt="JK Lakshmi Cement" width="160" height="48" loading="lazy" decoding="async"></li>
          <li class="logo-tile" data-reveal><img src="/assets/logos/regional-express.webp" alt="Regional Express" width="160" height="48" loading="lazy" decoding="async"></li>
        </ul>
      </div>
    </section>

    <!-- transition: paper returns to the void -->
    <div class="pf-fade pf-fade--to-dark" aria-hidden="true"></div>

    <!-- ═══════════════ 06 · SEAM — into the second act ═══════════════ -->
    <section class="pf-seam" data-pf-chapter aria-hidden="true">
      <div class="pf-seam__inner">
        <span class="pf-seam__word">more</span>
        <span class="pf-seam__line"></span>
        <span class="pf-seam__label">Beyond the reel</span>
      </div>
    </section>

    <!-- ═══════════════ 07 · BEYOND THE REEL ═══════════════ -->


    <!-- ═══════════════ 08 · MORE WORK — COMING SOON ═══════════════ -->
    <section class="pf-sec pf-soon" id="more-work" data-pf-chapter aria-label="More work — coming soon">
      <div class="pf-wrap">
        <div class="pf-soon__panel" data-pf-soon-empty data-pf-live>
          <span class="pf-soon__frag pf-soon__frag--1" aria-hidden="true"></span>
          <span class="pf-soon__frag pf-soon__frag--2" aria-hidden="true"></span>
          <span class="pf-soon__frag pf-soon__frag--3" aria-hidden="true"></span>
          <span class="pf-soon__frag pf-soon__frag--4" aria-hidden="true"></span>
          <span class="pf-soon__frag pf-soon__frag--5" aria-hidden="true"></span>
          <span class="pf-soon__sweep" aria-hidden="true"></span>
          <span class="pf-soon__noise" aria-hidden="true"></span>

          <div class="pf-soon__body">
            <p class="pf-soon__status"><span class="pf-soon__dot" aria-hidden="true"></span>Beyond the reel · In curation</p>
            <h2 class="pf-soon__title" data-pf-open>
              <span class="pf-line"><i>Coming</i></span>
              <span class="pf-line" style="--d:.09s"><i><em>Soon</em></i></span>
            </h2>
            <p class="pf-lede pf-soon__lede">Additional films, projects and experiences are currently being curated.</p>
            <ul class="pf-soon__kinds">
              <li>Brand films</li>
              <li>Motion design</li>
              <li>3D</li>
              <li>Interactive installations</li>
              <li>Immersive environments</li>
              <li>Experimental</li>
            </ul>
            <a class="pf-soon__cta" href="/contact/">
              Ask for a private preview
              <svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M2 8h11M9 3.5 13.5 8 9 12.5" stroke="currentColor" stroke-width="1.6"/></svg>
            </a>
          </div>
        </div>
      </div>
    </section>

<!-- ═══════════════ 09 · SELECTED PROOF — case-study rail (recruiter component) ═══════════════ -->    <section class="pf-sec pf-sec--deep pf-proofwrap" id="case-studies" data-pf-chapter aria-label="Selected proof">
      <div class="pf-wrap">
        <p class="pf-eyebrow" data-reveal>Selected proof <span>Evidence · 03 projects</span></p>
        <div class="r-proof__head" data-reveal>
          <h2 class="r-h2">Three projects that show <em>how I work.</em></h2>
          <div class="r-proof__meta">
            <p class="r-proof__count"><span id="pfProofCur" aria-live="polite">01</span> / 03</p>
            <div class="r-proof__nav">
              <button class="r-nav" id="pfProofPrev" type="button" aria-label="Previous project"><svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M14 8H3M7 3.5 3 8l4 4.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
              <button class="r-nav" id="pfProofNext" type="button" aria-label="Next project"><svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M2 8h11M9 3.5 13.5 8 9 12.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
            </div>
          </div>
        </div>
        <div class="r-proof__rail" id="pfProofRail" tabindex="0" role="region" aria-label="Selected projects — scroll horizontally">
          <article class="r-proof__panel" id="pp-0" aria-label="Orange Experience Center">
            <p class="r-proof__ghost" aria-hidden="true">01</p>
            <figure class="r-proof__media">
              <picture><source type="image/avif" srcset="/assets/case-orange-experience-in-action-800.avif 800w, /assets/case-orange-experience-in-action-1280.avif 1280w, /assets/case-orange-experience-in-action.avif 1672w" sizes="(max-width: 480px) 90vw, (max-width: 720px) 86vw, (max-width: 1080px) 74vw, 780px"><img src="/assets/case-orange-experience-in-action.webp" srcset="/assets/case-orange-experience-in-action-800.webp 800w, /assets/case-orange-experience-in-action-1280.webp 1280w, /assets/case-orange-experience-in-action.webp 1672w" sizes="(max-width: 480px) 90vw, (max-width: 720px) 86vw, (max-width: 1080px) 74vw, 780px" alt="Orange Experience Center — immersive brand experience environment" width="1672" height="941" loading="lazy" decoding="async"></picture>
              <span class="r-proof__sweep" aria-hidden="true"></span>
            </figure>
            <div class="r-proof__body">
              <p class="r-proof__sector">Enterprise Technology</p>
              <h3 class="r-proof__name">Orange <em>Experience Center</em></h3>
              <p class="r-proof__role">Experience Strategy &amp; Creative Technology Lead</p>
              <p class="r-proof__desc">Physical space, storytelling, interactive technology, visual communication and immersive experiences — brought together and made to work as one experience.</p>
              <ul class="r-proof__tags"><li>Experience Strategy</li><li>Creative Direction</li><li>UI / UX</li><li>Content</li><li>VR</li><li>Interactive Experience</li><li>Spatial Experience</li><li>Stakeholder &amp; Team Coordination</li></ul>
              <a class="r-arrow" href="/case-studies/orange-business/">View case study →</a>
            </div>
          </article>
          <article class="r-proof__panel" id="pp-1" aria-label="Indian Army Immersive Training">
            <p class="r-proof__ghost" aria-hidden="true">02</p>
            <figure class="r-proof__media">
              <picture><source type="image/avif" srcset="/assets/case-army-800.avif 800w, /assets/case-army-1280.avif 1280w, /assets/case-army.avif 1672w" sizes="(max-width: 480px) 90vw, (max-width: 720px) 86vw, (max-width: 1080px) 74vw, 780px"><img src="/assets/case-army.webp" srcset="/assets/case-army-800.webp 800w, /assets/case-army-1280.webp 1280w, /assets/case-army.webp 1672w" sizes="(max-width: 480px) 90vw, (max-width: 720px) 86vw, (max-width: 1080px) 74vw, 780px" alt="Indian Army immersive training — VR training and qualification environment" width="1672" height="941" loading="lazy" decoding="async"></picture>
              <span class="r-proof__sweep" aria-hidden="true"></span>
            </figure>
            <div class="r-proof__body">
              <p class="r-proof__sector">Defence &amp; Training</p>
              <h3 class="r-proof__name">Indian Army <em>Immersive Training</em></h3>
              <p class="r-proof__role">Immersive Training · XR · Qualification · System Design</p>
              <p class="r-proof__desc">A dedicated training room with 15 high-end computers and live trainer monitoring — immersive training with qualification and testing built in. VR stops being a visual simulation and becomes part of a larger training, observation, assessment, qualification and progression system.</p>
              <ul class="r-proof__tags"><li>Immersive Training</li><li>VR</li><li>Qualification</li><li>Testing</li><li>Trainer Monitoring</li><li>System Thinking</li></ul>
              <a class="r-arrow" href="/case-studies/indian-army/">View case study →</a>
            </div>
          </article>
          <article class="r-proof__panel" id="pp-2" aria-label="Bharat Petroleum Corporation Limited">
            <p class="r-proof__ghost" aria-hidden="true">03</p>
            <figure class="r-proof__media">
              <picture><source type="image/avif" srcset="/assets/case-bpcl-800.avif 800w, /assets/case-bpcl-1280.avif 1280w, /assets/case-bpcl.avif 1672w" sizes="(max-width: 480px) 90vw, (max-width: 720px) 86vw, (max-width: 1080px) 74vw, 780px"><img src="/assets/case-bpcl.webp" srcset="/assets/case-bpcl-800.webp 800w, /assets/case-bpcl-1280.webp 1280w, /assets/case-bpcl.webp 1672w" sizes="(max-width: 480px) 90vw, (max-width: 720px) 86vw, (max-width: 1080px) 74vw, 780px" alt="Bharat Petroleum Corporation Limited — immersive experience visualisation" width="1672" height="941" loading="lazy" decoding="async"></picture>
              <span class="r-proof__sweep" aria-hidden="true"></span>
            </figure>
            <div class="r-proof__body">
              <p class="r-proof__sector">Energy</p>
              <h3 class="r-proof__name">Bharat Petroleum <em>Corporation Limited</em></h3>
              <p class="r-proof__role">Brand Experience · Visualization · Creative Direction · Production</p>
              <p class="r-proof__desc">Visualisation and experience design used to communicate complex enterprise environments — a carefully structured visual language, from the miniature environment to the 3D walkthrough. The real work was making a complex environment understandable.</p>
              <ul class="r-proof__tags"><li>Brand Experience</li><li>Visualization</li><li>Creative Direction</li><li>Production</li><li>Stakeholder Coordination</li></ul>
              <a class="r-arrow" href="/case-studies/bharat-petroleum-corporation-limited/">View case study →</a>
            </div>
          </article>
        </div>
        <div class="r-proof__progress" aria-hidden="true"><i id="pfProofProgress"></i></div>
      </div>
    </section>

  `}})}function oe(){return l.jsx("svg",{width:"17",height:"17",viewBox:"0 0 18 18",fill:"none","aria-hidden":"true",children:l.jsx("path",{d:"m3 3 12 12M15 3 3 15",stroke:"currentColor",strokeWidth:"1.7",strokeLinecap:"round"})})}function le(){return J(),Y(),X(),K(),se(),ie(),U(),G(),Q("/portfolio/",{title:"Portfolio — Abhijeet Varghese"}),ne(),l.jsxs(l.Fragment,{children:[l.jsx(Z,{activePath:"/portfolio/"}),l.jsx("a",{className:"page-close",href:"/","data-history-close":"","aria-label":"Back to previous page",children:l.jsx(oe,{})}),l.jsx("main",{id:"main",className:"pf",children:l.jsx(re,{})}),l.jsx(ee,{})]})}const q=document.getElementById("root");if(!q)throw new Error("Portfolio mount missing");ae(q).render(l.jsx(le,{}));
