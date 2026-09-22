import{u as b,c as v,j as a,a as g,b as w,d as E,e as T,f as _,g as f,h as y,S as I,i as A,k as O}from"./useCmsSeo-C1WmqeVb.js";import{r as R}from"./react-SIwY82C9.js";import{u as C,a as L}from"./useMobileChrome-BJMjfRik.js";function N(){R.useEffect(()=>{var l,o;document.body.classList.add("bpcl-case"),(()=>{const e=document.getElementById("main");e&&e.classList.add("bpcl-case")})();const p=["/case-studies/bharat-petroleum-corporation-limited/assets/js/config.js?v=4.4.5","/case-studies/bharat-petroleum-corporation-limited/assets/js/core.js","/case-studies/bharat-petroleum-corporation-limited/assets/js/navigation.js","/case-studies/bharat-petroleum-corporation-limited/assets/js/imageViewer.js","/case-studies/bharat-petroleum-corporation-limited/assets/js/dayNightSlider.js","/case-studies/bharat-petroleum-corporation-limited/assets/js/blueprintViewer.js","/case-studies/bharat-petroleum-corporation-limited/assets/js/walkthrough.js?v=4.4.4","/case-studies/bharat-petroleum-corporation-limited/assets/js/content.js","/case-studies/bharat-petroleum-corporation-limited/assets/js/scrollAnimations.js"];let i=!1;(async()=>{for(const e of p){if(i)break;document.querySelector(`script[src="${e}"]`)||await new Promise((u,n)=>{const d=document.createElement("script");d.src=e,d.async=!1,d.onload=()=>u(),d.onerror=()=>n(new Error(`Failed to load ${e}`)),document.body.appendChild(d)})}})().catch(e=>{console.error("[BPCL] legacy scripts failed",e)});const s=[...document.querySelectorAll(".reveal, .bp-reveal")];let t=null;const r=((o=(l=window.matchMedia)==null?void 0:l.call(window,"(prefers-reduced-motion: reduce)"))==null?void 0:o.matches)??!1;return"IntersectionObserver"in window&&!r&&s.length&&(t=new IntersectionObserver((e,u)=>{e.forEach(n=>{n.isIntersecting&&(n.target.classList.add("is-in"),u.unobserve(n.target))})},{threshold:.15}),s.forEach(e=>t.observe(e))),()=>{i=!0,t==null||t.disconnect()}},[])}function S(){const{data:c,source:p}=b("projects",null),i=p!=="cms"||!Array.isArray(c)?null:c.find(l=>{var o;return l.slug==="bharat-petroleum-corporation-limited"||((o=l.caseStudyPath)==null?void 0:o.includes("bharat-petroleum-corporation-limited"))})??null;let s=`

  <!-- 01 · HERO -->
  <section class="hero" id="hero" aria-labelledby="heroTitle">
    <div class="hero__media">
      <picture>
        <source type="image/webp"
                srcset="/case-studies/bharat-petroleum-corporation-limited/assets/images/miniature/night-720.webp 720w, /case-studies/bharat-petroleum-corporation-limited/assets/images/miniature/night-1100.webp 1100w, /case-studies/bharat-petroleum-corporation-limited/assets/images/miniature/night-1672.webp 1672w"
                sizes="100vw">
        <img id="heroImg" src="/case-studies/bharat-petroleum-corporation-limited/assets/images/miniature/night-1280.jpg"
             alt="Physical miniature of the Bharat Petroleum Corporation Limited Palakkad Top Installation at night, its integrated lighting tracing the internal roads, tank farm and buildings."
             width="1672" height="941" fetchpriority="high" decoding="async">
      </picture>
    </div>
    <div class="hero__veil" aria-hidden="true"></div>
    <div class="hero__inner">
      <p class="hero__place mono">BHARAT PETROLEUM CORPORATION LIMITED · PALAKKAD</p>
      <h1 class="hero__title" id="heroTitle">
        <span class="line"><span>MAKING</span></span>
        <span class="line"><span>COMPLEXITY</span></span>
        <span class="line"><span>VISIBLE.</span></span>
      </h1>
      <p class="hero__lede">A spatial visualization project translating a complex industrial site into something people could see, understand and experience.</p>
      <p class="hero__meta mono">STRATEGY · CREATIVE DIRECTION · SPATIAL VISUALIZATION · 3D WALKTHROUGH</p>
      <a class="hero__cta mono" href="#challenge">EXPLORE THE PROJECT <span aria-hidden="true">↓</span></a>
    </div>
  </section>

  <!-- 02 · CHALLENGE + STRATEGY -->
  <section class="section section--paper" id="challenge" aria-labelledby="challengeTitle">
    <div class="wrap">
      <p class="label mono">THE CHALLENGE</p>
      <h2 class="display" id="challengeTitle">THE SITE WAS COMPLEX.<br>THE STORY COULDN'T BE.</h2>
      <div class="cols" id="challengeCopy"></div>

      <h3 class="close-line">START WITH WHAT PEOPLE<br>NEED TO UNDERSTAND.</h3>

      <div class="strategy">
        <p class="label mono">STRATEGIC RESPONSE</p>
        <ol class="strategy__list" id="strategyList"></ol>
      </div>

      <div class="bridge" id="bridge" aria-label="From site to experience"></div>

      <p class="contribution mono" id="contribution"></p>
    </div>
  </section>

  <!-- 03 · MINIATURE -->
  <section class="section section--ink" id="miniature" aria-labelledby="miniatureTitle">
    <div class="wrap">
      <p class="label mono">01 / PHYSICAL MINIATURE</p>
      <h2 class="display" id="miniatureTitle">FIRST, THE SITE<br>HAD TO BE SEEN<br>AS A WHOLE.</h2>
      <p class="lede lede--wide">The installation was built as a physical miniature at roughly 8 × 10 ft — detailed enough to hold storage areas, operational buildings, internal roads, parking, landscape, utilities and boundary in a single view.</p>
      <p class="body body--wide">Seen together, the relationships between the parts became obvious in a way no single image of the site could achieve.</p>
      <dl class="metarow" id="modelMeta"></dl>
    </div>

    <figure class="viewer" id="viewer" aria-label="Physical miniature viewer">
      <div class="viewer__stage" id="viewerStage"></div>
      <figcaption class="viewer__hud">
        <span class="mono viewer__tag" id="viewerTag">VIEW 02</span>
        <span class="mono viewer__count" id="viewerCount">02 / 07</span>
      </figcaption>
      <div class="viewer__nav">
        <button class="vnav" id="viewerPrev" type="button" aria-label="Previous miniature view"><span aria-hidden="true">←</span></button>
        <div class="viewer__dots" id="viewerDots" role="tablist" aria-label="Miniature views"></div>
        <button class="vnav" id="viewerNext" type="button" aria-label="Next miniature view"><span aria-hidden="true">→</span></button>
        <button class="inspect" id="viewerInspect" type="button"><span class="mono">INSPECT</span></button>
      </div>
    </figure>

    <div class="wrap dnwrap">
      <p class="label mono">MINIATURE LIGHTING</p>
      <h3 class="close-line">SAME MODEL.<br>DIFFERENT CONDITION.</h3>
      <p class="body body--wide">Daylight reveals the organization of the installation. Integrated lighting reveals another layer after dark.</p>
    </div>

    <div class="dn" id="dn">
      <div class="dn__frame" id="dnFrame">
        <img class="dn__img" id="dnNight"
             src="/case-studies/bharat-petroleum-corporation-limited/assets/images/miniature/night-1280.jpg"
             srcset="/case-studies/bharat-petroleum-corporation-limited/assets/images/miniature/night-720.webp 720w, /case-studies/bharat-petroleum-corporation-limited/assets/images/miniature/night-1100.webp 1100w, /case-studies/bharat-petroleum-corporation-limited/assets/images/miniature/night-1672.webp 1672w"
             sizes="(max-width:900px) 96vw, 92vw"
             alt="Physical miniature of the Bharat Petroleum Corporation Limited Palakkad Top Installation at night, with integrated lighting along roads, buildings and tanks."
             width="1672" height="941" loading="lazy" decoding="async">
        <div class="dn__clip" id="dnClip">
          <img class="dn__img" id="dnDay"
               src="/case-studies/bharat-petroleum-corporation-limited/assets/images/miniature/day-1280.jpg"
               srcset="/case-studies/bharat-petroleum-corporation-limited/assets/images/miniature/day-720.webp 720w, /case-studies/bharat-petroleum-corporation-limited/assets/images/miniature/day-1100.webp 1100w, /case-studies/bharat-petroleum-corporation-limited/assets/images/miniature/day-1672.webp 1672w"
               sizes="(max-width:900px) 96vw, 92vw"
               alt="Physical miniature of the Bharat Petroleum Corporation Limited Palakkad Top Installation in daylight, showing the full site layout."
               width="1672" height="941" loading="lazy" decoding="async">
        </div>
        <div class="dn__handle" id="dnHandle" role="slider" tabindex="0"
             aria-label="Day to night comparison of the physical miniature"
             aria-valuemin="0" aria-valuemax="100" aria-valuenow="50" aria-valuetext="50 percent day">
          <span class="dn__grip" aria-hidden="true"></span>
        </div>
        <span class="dn__tag dn__tag--l mono">DAY</span>
        <span class="dn__tag dn__tag--r mono">NIGHT</span>
      </div>
      <p class="dn__cap mono">DRAG TO COMPARE</p>
    </div>
  </section>

  <!-- 04 · BLUEPRINT -->
  <section class="section section--ink" id="blueprint" aria-labelledby="blueprintTitle">
    <div class="wrap link">
      <p class="link__from mono">MODEL</p>
      <span class="link__arrow" aria-hidden="true"></span>
      <p class="link__to mono">BLUEPRINT</p>
      <p class="link__copy">The physical model established the spatial whole. The blueprint translated it into a structured technical view.</p>
    </div>

    <div class="wrap">
      <p class="label mono">02 / TECHNICAL TRANSLATION</p>
      <h2 class="display" id="blueprintTitle">THE MODEL<br>BECAME A LANGUAGE.</h2>
      <p class="sub-line mono">THE SITE, DRAWN AS A SYSTEM.</p>
    </div>

    <figure class="bpv" id="bpv">
      <div class="bpv__viewport" id="bpvViewport" tabindex="0" role="group"
           aria-label="Blueprint viewer. Use plus and minus keys to zoom, arrow keys to pan, zero to reset.">
        <div class="bpv__canvas" id="bpvCanvas">
          <picture>
            <source type="image/webp"
                    srcset="/case-studies/bharat-petroleum-corporation-limited/assets/images/blueprint/blueprint-720.webp 720w, /case-studies/bharat-petroleum-corporation-limited/assets/images/blueprint/blueprint-1100.webp 1100w, /case-studies/bharat-petroleum-corporation-limited/assets/images/blueprint/blueprint-1672.webp 1672w"
                    sizes="(max-width:900px) 96vw, 92vw">
            <img id="bpvImg" src="/case-studies/bharat-petroleum-corporation-limited/assets/images/blueprint/blueprint-1280.jpg"
                 alt="Technical blueprint of the Bharat Petroleum Corporation Limited Palakkad Top Installation showing the tank farm, internal roads, parking and site layout."
                 width="1672" height="941" loading="lazy" decoding="async" draggable="false">
          </picture>
        </div>
        <div class="bpv__cross" id="bpvCross" aria-hidden="true"><i></i><i></i></div>
      </div>
      <figcaption class="bpv__note mono" id="bpvNote"></figcaption>
      <div class="bpv__bar">
        <div class="bpv__ctl">
          <button class="btn" id="bpvOut" type="button" aria-label="Zoom out">−</button>
          <span class="mono bpv__val" id="bpvVal">1.0×</span>
          <button class="btn" id="bpvIn" type="button" aria-label="Zoom in">+</button>
          <button class="btn btn--wide" id="bpvReset" type="button">RESET</button>
        </div>
      </div>
    </figure>
  </section>

  <!-- 05 · 3D WALKTHROUGH -->
  <section class="section section--ink" id="walkthrough" aria-labelledby="walkthroughTitle">
    <div class="wrap">
      <p class="label mono">03 / 3D ARCHITECTURAL WALKTHROUGH</p>
      <h2 class="display" id="walkthroughTitle">FROM PLAN<br>TO PRESENCE.</h2>
      <p class="lede lede--wide">The 3D walkthrough translates the site into an explorable architectural environment — bringing buildings, storage infrastructure, roads, movement, landscape and context into one continuous experience.</p>
      <h3 class="close-line">NOW,<br>ENTER THE SITE.</h3>
    </div>

    <figure class="film" id="film" aria-label="3D architectural walkthrough">
      <div class="film__frame" id="filmFrame">
        <div class="film__stage" id="filmStage"></div>
        <div class="film__grid" aria-hidden="true"></div>
        <div class="film__bars" aria-hidden="true"><i></i><i></i></div>
      </div>
      <figcaption class="film__hud">
        <span class="mono film__count" id="filmCount">01 / 10</span>
        <span class="mono film__cap" id="filmCap">3D ARCHITECTURAL WALKTHROUGH — FRAME 01</span>
      </figcaption>
      <div class="film__ctrl">
        <button class="vnav" id="filmPrev" type="button" aria-label="Previous frame"><span aria-hidden="true">←</span></button>
        <div class="film__rail" id="filmRail" role="tablist" aria-label="Walkthrough frames"></div>
        <button class="vnav" id="filmNext" type="button" aria-label="Next frame"><span aria-hidden="true">→</span></button>
      </div>
    </figure>

    <div class="wrap closeups">
      <h3 class="close-line">DETAIL<br>MAKES THE ENVIRONMENT<br>BELIEVABLE.</h3>
      <p class="body body--wide">The environment was resolved beyond the masterplan — down to architecture, infrastructure, materials, landscape and lighting.</p>
      <div class="closeups__grid" id="closeups"></div>
    </div>
  </section>

  <!-- 06 · LEADERSHIP + DELIVERY -->
  <section class="section section--paper" id="leadership" aria-labelledby="leadershipTitle">
    <div class="wrap">
      <p class="label mono">04 / LEADERSHIP</p>
      <h2 class="display" id="leadershipTitle">ONE VISION.<br>MANY MOVING PARTS.</h2>
      <p class="lede lede--wide">The work ran through concept development, creative direction, team guidance, stakeholder management, vendor coordination, production and quality control. The harder task was holding one coherent vision across all of it.</p>

      <ol class="flow" id="flow" aria-label="Delivery flow"></ol>

      <h3 class="close-line">THE VISION HAD<br>TO SURVIVE<br>PRODUCTION.</h3>

      <div class="areas" id="areas"></div>

      <h3 class="close-line senior-line">MORE THAN THE OUTPUT.<br>I DROVE THE JOURNEY<br>FROM CONCEPT TO DELIVERY.</h3>

      <dl class="foot__info" id="footInfo" aria-label="Project at a glance"></dl>
    </div>
  </section>

  <!-- 07 · OUTCOME -->
  <section class="section section--paper" id="outcome" aria-labelledby="outcomeTitle">
    <div class="wrap">
      <p class="label mono">OUTCOME</p>
      <h2 class="display" id="outcomeTitle">THE SITE COULD NOW<br>BE UNDERSTOOD<br>FROM EVERY SCALE.</h2>
      <ol class="chain-out" id="outcomes"></ol>
    </div>
  </section>

  `;if(i!=null&&i.image){const r=v(String(i.image));r&&s.includes("src=")&&!s.includes(r)&&(s=s.replace(/src="\/[^"]+\.(webp|jpg|jpeg|png)"/,`src="${r}"`))}const t=i?' data-cms-source="cms"':' data-cms-source="fallback"';return a.jsx("div",{dangerouslySetInnerHTML:{__html:`<div${t}>${s}</div>`}})}function P(){return a.jsx("svg",{width:"17",height:"17",viewBox:"0 0 18 18",fill:"none","aria-hidden":"true",children:a.jsx("path",{d:"m3 3 12 12M15 3 3 15",stroke:"currentColor",strokeWidth:"1.7",strokeLinecap:"round"})})}function j(){return g(),w(),E(),T(),C(),L(),_(),f(),y("/case-studies/bharat-petroleum-corporation-limited/",{title:"Bharat Petroleum Corporation Limited — Abhijeet Varghese"}),N(),a.jsxs(a.Fragment,{children:[a.jsx(I,{activePath:"/case-studies/bharat-petroleum-corporation-limited/"}),a.jsx("a",{className:"page-close",href:"/case-studies/","data-history-close":"","aria-label":"Back to Case Studies",children:a.jsx(P,{})}),a.jsx("main",{id:"main",className:"bpcl-case",children:a.jsx(S,{})}),a.jsx(A,{})]})}const m=document.getElementById("root");if(!m)throw new Error("BPCL mount target is missing.");O(m).render(a.jsx(j,{}));
