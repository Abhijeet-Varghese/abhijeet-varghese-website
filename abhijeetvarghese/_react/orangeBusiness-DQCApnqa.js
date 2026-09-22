import{u as ae,c as ie,j as l,a as se,b as ne,d as oe,e as re,f as ce,g as de,h as le,S as pe,i as ue,k as ve}from"./useCmsSeo-C1WmqeVb.js";import{u as be,a as me}from"./useMobileChrome-BJMjfRik.js";import{r as he}from"./react-SIwY82C9.js";function ge(){he.useEffect(()=>{var $,Z,J;document.body.classList.add("orange-business-case","ob-page");const h=document.getElementById("main");h&&(h.classList.add("ob-page"),h.classList.contains("orange-business-case")||h.classList.add("orange-business-case"));const n=(t,e=document)=>e.querySelector(t),d=(t,e=document)=>[...e.querySelectorAll(t)],B=((Z=($=window.matchMedia)==null?void 0:$.call(window,"(prefers-reduced-motion: reduce)"))==null?void 0:Z.matches)??!1,o=document.querySelector(".ob-pano__scroller");let E=null;if(o){let t=!1,e=0,a=0;const i=v=>{t=!0,o.classList.add("is-dragging"),e=v.pageX-o.offsetLeft,a=o.scrollLeft},s=()=>{t=!1,o.classList.remove("is-dragging")},r=v=>{if(!t)return;v.preventDefault();const te=(v.pageX-o.offsetLeft-e)*1.2;o.scrollLeft=a-te};o.addEventListener("mousedown",i),o.addEventListener("mouseleave",s),o.addEventListener("mouseup",s),o.addEventListener("mousemove",r),E=()=>{o.removeEventListener("mousedown",i),o.removeEventListener("mouseleave",s),o.removeEventListener("mouseup",s),o.removeEventListener("mousemove",r)}}const b=n(".ob-hero");b&&requestAnimationFrame(()=>requestAnimationFrame(()=>b.classList.add("is-in")));const u=d(".ob-pin"),f=n("#panoTitle"),D=n("#panoDesc"),O=n("#panoText");let p=null,C=0,R=!1;const V=t=>{t&&(u.forEach(e=>e.classList.toggle("is-active",e===t)),f&&(f.textContent=t.dataset.title??""),D&&(D.textContent=t.dataset.desc??""),O&&(O.classList.remove("is-swap"),O.offsetWidth,O.classList.add("is-swap")),u.forEach(e=>{e!==t&&e.removeAttribute("aria-current")}),t.setAttribute("aria-current","true"))},H=[];if(u.length&&f&&(u.forEach(t=>{const e=()=>{R=!0,p&&(clearInterval(p),p=null),V(t)};t.addEventListener("click",e),H.push({el:t,fn:e})}),!B)){const t=n(".ob-pano");t&&"IntersectionObserver"in window&&new IntersectionObserver(([a])=>{if(!a.isIntersecting){p&&(clearInterval(p),p=null);return}R||p||setTimeout(()=>{R||p||document.hidden||(p=window.setInterval(()=>{document.hidden||(C=(C+1)%u.length,V(u[C]))},4200))},2200)},{threshold:.5}).observe(t)}const S=d(".ob-stages__list button"),L=n(".ob-stages__panel"),U=[];if(S.length&&L){const t=n(".ob-stages__body",L);S.forEach(e=>{const a=()=>{S.forEach(s=>{s.classList.toggle("is-active",s===e),s.setAttribute("aria-selected",s===e?"true":"false")}),L.dataset.i=e.dataset.i;const i=(e.dataset.b||"").split("|").filter(Boolean).map(s=>"<li>"+s+"</li>").join("");t&&(t.innerHTML='<span class="ob-stages__tag">'+(e.dataset.tag??"")+"</span><h3>"+(e.dataset.i??"")+" — "+(e.dataset.title??"")+"</h3><p>"+(e.dataset.desc??"")+"</p><ul>"+i+"</ul>",t.classList.remove("is-swap"),t.offsetWidth,t.classList.add("is-swap"))};e.addEventListener("click",a),U.push({el:e,fn:a})})}const g=document.querySelector(".room-response"),m=document.querySelector(".response-toggle");let x=null;if(g&&m){const t=e=>{g.dataset.state=e?"active":"standby";const a=g.querySelector(".response-visitor"),i=g.querySelector(".response-curtains"),s=g.querySelector(".response-lights"),r=g.querySelector(".response-mode");a&&(a.textContent=e?"DETECTED":"NO VISITOR"),i&&(i.textContent=e?"CLOSED":"OPEN"),s&&(s.textContent=e?"ON":"OFF"),r&&(r.textContent=e?"ACTIVE":"STANDBY"),m.firstChild&&(m.firstChild.textContent=e?"LEAVE ROOM ":"ENTER ROOM "),m.setAttribute("aria-pressed",String(e)),m.setAttribute("aria-label",e?"Set room to standby":"Activate room response")};t(!1),x=()=>t(g.dataset.state!=="active"),m.addEventListener("click",x)}const A=d(".ob-media__tabs button"),N=d(".ob-media__frame"),j=n(".ob-media__stage"),G=[];let T=null;if(A.length&&N.length){N.forEach(e=>{const a=n("source",e),i=n("video",e),s=()=>{var r;return(r=n(".ob-media__vid",e))==null?void 0:r.classList.add("is-missing")};a&&a.addEventListener("error",s),i&&i.addEventListener("error",s,!0)});const t=()=>n(".ob-media__frame.is-active video");A.forEach(e=>{const a=()=>{var s;A.forEach(r=>{r.classList.toggle("is-active",r===e),r.setAttribute("aria-selected",r===e?"true":"false")}),N.forEach(r=>{const v=r.id===e.dataset.target;r.classList.toggle("is-active",v);const M=n("video",r);M&&!v&&M.pause()});const i=t();i&&(i.load(),(s=i.play)==null||s.call(i).catch(()=>{}))};e.addEventListener("click",a),G.push({el:e,fn:a})}),j&&"IntersectionObserver"in window&&(T=new IntersectionObserver(([e])=>{var i;const a=t();a&&(e.isIntersecting?(a.readyState===0&&a.load(),(i=a.play)==null||i.call(a).catch(()=>{})):a.pause())},{threshold:.15}),T.observe(j))}const w=d(".reveal, .ob-reveal");let I=null;if("IntersectionObserver"in window&&w.length){I=new IntersectionObserver((e,a)=>{e.forEach(i=>{i.isIntersecting&&(i.target.classList.add("is-in"),a.unobserve(i.target))})},{threshold:.16}),w.forEach(e=>I.observe(e));const t=n(".ob-closing");t&&new IntersectionObserver(([a],i)=>{a.isIntersecting&&(t.classList.add("is-in"),i.disconnect())},{threshold:.3}).observe(t)}else w.forEach(t=>t.classList.add("is-in")),(J=n(".ob-closing"))==null||J.classList.add("is-in");const _=d(".role-chain button"),Y=n(".role-chain-output p"),F=[];_.length&&Y&&_.forEach(t=>{const e=()=>{_.forEach(a=>a.classList.toggle("active",a===t)),Y.textContent=t.dataset.copy||""};t.addEventListener("click",e),F.push({el:t,fn:e})});const k=d(".purpose-strip button"),q=[];if(k.length){const t=n(".purpose-output > div:first-child p"),e=n(".purpose-output > div:last-child p");k.forEach(a=>{const i=()=>{k.forEach(s=>s.classList.toggle("active",s===a)),t&&(t.textContent=a.dataset.experience||""),e&&(e.textContent=a.dataset.business||"")};a.addEventListener("click",i),q.push({el:a,fn:i})})}const P=d(".architecture-branches button"),W=[];if(P.length){const t=n(".architecture-output b"),e=n(".architecture-output > div:nth-child(2) p"),a=n(".architecture-output > div:nth-child(3) p"),i=n(".architecture-output > div:nth-child(4) p");P.forEach(s=>{const r=()=>{P.forEach(v=>v.classList.toggle("active",v===s)),t&&(t.textContent=s.dataset.title||""),e&&(e.textContent=s.dataset.what||""),a&&(a.textContent=s.dataset.experience||""),i&&(i.textContent=s.dataset.business||"")};s.addEventListener("click",r),W.push({el:s,fn:r})})}const c=n(".summary-dialog"),ee=d(".summary-open"),y=c==null?void 0:c.querySelector(".dialog-close"),X=[];ee.forEach(t=>{const e=()=>c==null?void 0:c.showModal();t.addEventListener("click",e),X.push({el:t,fn:e})});const z=()=>c==null?void 0:c.close();y==null||y.addEventListener("click",z);const K=t=>{t.target===c&&(c==null||c.close())};return c==null||c.addEventListener("click",K),()=>{p&&clearInterval(p),E==null||E(),H.forEach(({el:t,fn:e})=>t.removeEventListener("click",e)),U.forEach(({el:t,fn:e})=>t.removeEventListener("click",e)),m&&x&&m.removeEventListener("click",x),G.forEach(({el:t,fn:e})=>t.removeEventListener("click",e)),T==null||T.disconnect(),I==null||I.disconnect(),F.forEach(({el:t,fn:e})=>t.removeEventListener("click",e)),q.forEach(({el:t,fn:e})=>t.removeEventListener("click",e)),W.forEach(({el:t,fn:e})=>t.removeEventListener("click",e)),X.forEach(({el:t,fn:e})=>t.removeEventListener("click",e)),y==null||y.removeEventListener("click",z),c==null||c.removeEventListener("click",K)}},[])}function Ee(){const{data:h,source:n}=ae("projects",null),d=n!=="cms"||!Array.isArray(h)?null:h.find(u=>{var f;return u.slug==="orange-business"||u.id==="prj-orange-business"||((f=u.caseStudyPath)==null?void 0:f.includes("orange-business"))})??null;let o=`
    <article>
      <!-- 01 HERO -->
      <section class="ob-hero tracked" id="top" data-index="01" data-title="Hero">
        <div class="container">
          <p class="ob-hero__eyebrow"><span>ORANGE BUSINESS</span><span>MUMBAI · <b>EXECUTIVE BRIEFING CENTER</b></span></p>
          <h1 class="ob-hero__title"><span class="line"><span>THE ROOM IS</span></span><span class="line"><span><em>THE INTERFACE.</em></span></span></h1>
          <p class="ob-hero__deck">A strategy-led physical-digital experience for Orange Business — every surface, sensor and seat designed as one system. This is the actual briefing center, Mumbai. Pinpointed below: the hardware that made it work.</p>
          <figure class="ob-pano">
            <div class="ob-pano__frame">
              <div class="ob-pano__scroller">
                <div class="ob-pano__track">
                  <img class="ob-pano__img" src="/assets/media/orange-business-executive-briefing-center-mumbai-panoramic-1280.webp" alt="Panoramic view of the Orange Business Executive Briefing Center in Mumbai with pinned hardware" width="1280" height="422" fetchpriority="high" decoding="async">
                  <button class="ob-pin is-active" style="left:34.8%;top:49.8%" data-n="01" data-title="Rotoscope" data-desc="The physical sliding display — moving it navigates digital content states during the briefing." aria-label="Rotoscope physical sliding display" type="button"><i></i></button>
                  <button class="ob-pin" style="left:48.8%;top:45.5%" data-n="02" data-title="Interactive video wall · 2 × 2" data-desc="The room's large-format canvas — presentation, product media, touch exploration and conferencing." aria-label="Interactive video wall two by two" type="button"><i></i></button>
                  <button class="ob-pin" style="left:58%;top:65.6%" data-n="03" data-title="Immersive virtual reality chair" data-desc="Custom-designed for Orange — the seat of the immersive product-knowledge experience." aria-label="Immersive virtual reality chair" type="button"><i></i></button>
                </div>
              </div>
            </div>
            <figcaption class="ob-pano__details">
              <div class="ob-pano__text" id="panoText"><h3 id="panoTitle">Rotoscope</h3><p id="panoDesc">The physical sliding display — moving it navigates digital content states during the briefing.</p></div>
              <span class="ob-pano__hint">19.0760° N · 72.8777° E<br>TAP A POINT · EXACT HARDWARE</span>
            </figcaption>
          </figure>
          <div class="ob-hero__meta"><span>EXPERIENCE STRATEGY</span><span>CREATIVE TECHNOLOGY</span><span>CONTENT</span><span>XR / VR</span><span>DELIVERY</span></div>
        </div>
      </section>

      <div class="ob-facts ob-light" aria-label="Project at a glance">
        <div class="container">
          <div><span>CLIENT</span><b>Orange Business</b></div>
          <div><span>WHAT WAS BUILT</span><b>An executive briefing center where space, content and technology behave as one experience</b></div>
          <div><span>WHERE</span><b>Mumbai, India</b></div>
          <div><span>MY ROLE</span><b>Experience Strategy &amp; Creative Technology Lead</b></div>
          <button class="summary-open" type="button"><span>30 SEC READ</span><i>↗</i></button>
        </div>
      </div>
      </div>



      <!-- 02 WHY -->
      <section class="why section ob-light tracked" id="why" data-index="02" data-title="Why">
        <div class="container">
          <header class="section-head reveal"><div><p>Why</p></div><h2>From briefing room<br>to <em>business experience.</em></h2></header>
          <div class="why-layout no-media">
            <div class="why-copy reveal"><p class="lead">Orange Business created its Mumbai Executive Briefing Center as a destination for customers and prospects to explore its capabilities, solutions and future-facing technologies in an executive environment.</p><p>The brief called for a futuristic, minimal environment integrating interactive media, VR, audio, networking, automation, branding and collaboration.</p></div>
          </div>
          <div class="why-cards reveal"><article><span>BUSINESS CONTEXT</span><p>Complex enterprise capabilities across connectivity, cloud, cybersecurity and digital experience.</p></article><article><span>STRATEGIC CHALLENGE</span><p>Move executive audiences beyond static presentation into active understanding.</p></article><article><span>EXPERIENCE OPPORTUNITY</span><p>Create a journey from arrival and discovery to immersion and conversation.</p></article><article><span>DESIGN RESPONSE</span><p>Architect space, content and technology as one connected system.</p></article></div>
          <blockquote class="why-statement reveal"><span>THE CHALLENGE WAS NOT<br>TO INSTALL TECHNOLOGY.</span><b>IT WAS TO MAKE<br>TECHNOLOGY, CONTENT,<br>SPACE AND PEOPLE<br>BEHAVE AS ONE EXPERIENCE.</b></blockquote>
        </div>
      </section>

      <!-- 03 MY ROLE -->
      <section class="role section ob-light tracked" id="role" data-index="03" data-title="My Role">
        <div class="container">
          <header class="section-head reveal"><div><p>My Role</p></div><h2>Strategy before <em>execution.</em></h2></header>
          <p class="role-statement reveal">I worked across the chain from strategy and consultancy through creative direction, content, technology coordination and months of on-site realization.</p>
          <div class="role-chain reveal" role="group" aria-label="Project responsibility chain">
            <button class="active" data-copy="Client consultancy, business requirements and experience direction." type="button"><b>STRATEGY</b><i>→</i></button>
            <button data-copy="Visitor journey, interaction and personalization." type="button"><b>EXPERIENCE</b><i>→</i></button>
            <button data-copy="Storyboards, visual design, video, voice-over, presentations and interactive content." type="button"><b>CONTENT</b><i>→</i></button>
            <button data-copy="XR, interactive systems, AV, conferencing and dynamic content." type="button"><b>TECHNOLOGY</b><i>→</i></button>
            <button data-copy="Senior stakeholders, Mumbai and Gurgaon teams, vendors and implementation partners." type="button"><b>LEADERSHIP</b><i>→</i></button>
            <button data-copy="Fabrication, installation, testing, refinement and delivery." type="button"><b>SITE</b></button>
          </div>
          <div class="role-chain-output reveal" aria-live="polite"><span>ACTIVE RESPONSIBILITY</span><p>Client consultancy, business requirements and experience direction.</p></div>
          <blockquote class="role-authorship reveal">I did not just design the output.<br><b>I helped lead the system that produced it.</b></blockquote>
        </div>
      </section>

      <!-- 04 THE EXPERIENCE -->
      <section class="experience section ob-light tracked" id="experience" data-index="04" data-title="The Experience">
        <div class="container">
          <header class="section-head inverse reveal"><div><p>The Experience</p></div><h2>Design the journey before <em>designing the room.</em></h2></header>
          <div class="ob-stages reveal" role="group" aria-label="Visitor experience journey">
            <div class="ob-stages__list" role="tablist" aria-label="Experience stages">
              <button class="is-active" data-i="01" data-title="Arrive" data-tag="REGISTRATION · IDENTITY" data-desc="The visitor enters a deliberately controlled executive environment. Registration captures identity and the personalized visit begins at the door." data-b="Deliberately controlled executive environment|Visitor registration captures identity|Personalization starts at arrival" aria-selected="true" type="button">Arrive</button>
              <button data-i="02" data-title="Recognize" data-tag="ENTRY DISPLAY · PERSONALIZATION" data-desc="The entry display establishes identity and the potential for a personalized visit — the room already knows who it is hosting." data-b="Entry display establishes identity|Content orients to the visitor|The system prepares the journey" aria-selected="false" type="button">Recognize</button>
              <button data-i="03" data-title="Activate" data-tag="PRESENCE · AUTOMATION" data-desc="Presence detection moves the room from standby into an active experience state — curtains, lighting and content respond without a manual setup." data-b="Sensors read room occupancy|Curtains and lighting respond|The room prepares itself" aria-selected="false" type="button">Activate</button>
              <button data-i="04" data-title="Explore" data-tag="ROTOSCOPE · PHYSICAL INTERFACE" data-desc="The Rotoscope turns physical movement into digital content navigation — sliding the physical display changes the content state." data-b="Physical sliding display interface|Video, presentations and interactive media|Movement becomes navigation" aria-selected="false" type="button">Explore</button>
              <button data-i="05" data-title="Immerse" data-tag="VR · CUSTOM CHAIR" data-desc="The custom VR chair transforms product knowledge into an immersive experience — designed and fabricated specifically for Orange." data-b="Chair custom-designed for Orange|Product knowledge as spatial experience|Sales enablement through immersion" aria-selected="false" type="button">Immerse</button>
              <button data-i="06" data-title="Connect" data-tag="VIDEO WALL · COLLABORATION" data-desc="The video wall supports presentation, collaboration and conferencing — one large-format interface for multiple executive modes." data-b="Present, demonstrate, interact, connect|Touch-driven enterprise interface|Conferencing with remote experts" aria-selected="false" type="button">Connect</button>
              <button data-i="07" data-title="Converse" data-tag="LOUNGE · EXECUTIVE DIALOGUE" data-desc="Technology recedes as executive discussion begins in the lounge — the experience continues, unobtrusively." data-b="Technology recedes into the room|Executive dialogue takes over|The platform stays available" aria-selected="false" type="button">Converse</button>
            </div>
            <div class="ob-stages__panel" data-i="01">
              <div class="ob-stages__body" aria-live="polite">
                <span class="ob-stages__tag">REGISTRATION · IDENTITY</span>
                <h3>01 — Arrive</h3>
                <p>The visitor enters a deliberately controlled executive environment. Registration captures identity and the personalized visit begins at the door.</p>
                <ul><li>Deliberately controlled executive environment</li><li>Visitor registration captures identity</li><li>Personalization starts at arrival</li></ul>
              </div>
            </div>
          </div></div>
        </div>
      </section>

      <!-- 05 THE EXPERIENCE SYSTEM -->
      <section class="system section tracked" id="system" data-index="05" data-title="The Experience System">
        <div class="container">
          <header class="section-head reveal"><div><p>The Experience System</p></div><h2>The intellectual center of <em>the room.</em></h2></header>
          <div class="system-intro reveal"><p class="lead">Instead of treating every technology as an isolated installation, the experience was designed as a connected system.</p><blockquote>The technology disappeared behind the experience.</blockquote></div>
          <div class="architecture-diagram reveal">
            <div class="architecture-spine"><span>VISITOR</span><i>↓</i><span>REGISTRATION</span><i>↓</i><span>IDENTITY</span><i>↓</i><strong>EXPERIENCE LAYER</strong></div>
            <div class="architecture-branches" role="group" aria-label="Experience system nodes">
              <button class="active" data-title="Registration" data-what="Captures visitor information at the beginning of the visit." data-experience="Establishes identity and enables personalization." data-business="Creates more contextual executive engagement." type="button">REGISTRATION</button>
              <button data-title="Rotoscope" data-what="Connects display position to digital content states." data-experience="Makes content navigation physical and memorable." data-business="Supports more engaging product storytelling." type="button">ROTOSCOPE</button>
              <button data-title="Video Wall" data-what="Unifies presentation, media, touch and conferencing." data-experience="Creates one large-format collaboration interface." data-business="Supports multiple executive use cases." type="button">VIDEO WALL</button>
              <button data-title="VR" data-what="Delivers immersive product-knowledge modules." data-experience="Turns complex concepts into spatial experience." data-business="Supports sales enablement." type="button">VR</button>
              <button data-title="Sensors" data-what="Detect room occupancy and visitor presence." data-experience="Triggers the responsive environment." data-business="Creates controlled automated room operation." type="button">SENSORS</button>
              <button data-title="Automation" data-what="Coordinates curtains, lighting and active room state." data-experience="Makes the room respond without manual setup." data-business="Reduces operational friction." type="button">AUTOMATION</button>
              <button data-title="Conferencing" data-what="Connects the room to remote specialists and teams." data-experience="Extends collaboration beyond the physical center." data-business="Provides access to distributed expertise." type="button">CONFERENCING</button>
            </div>
            <i class="architecture-down">↓</i><div class="architecture-connected">CONNECTED EXPERIENCE</div><i class="architecture-down">↕</i><div class="architecture-backend">DYNAMIC BACKEND</div>
            <div class="architecture-output" aria-live="polite"><div><span>ACTIVE SYSTEM</span><b>Registration</b></div><div><span>WHAT IT DOES</span><p>Captures visitor information at the beginning of the visit.</p></div><div><span>EXPERIENCE VALUE</span><p>Establishes identity and enables personalization.</p></div><div><span>BUSINESS VALUE</span><p>Creates more contextual executive engagement.</p></div></div>
          </div>
          <div class="room-response reveal" data-state="standby">
            <div class="room-response-media"><img src="/assets/media/orange-business-executive-briefing-center-mumbai-panoramic.jpeg" alt="Panoramic Orange Business Executive Briefing Center used to demonstrate environmental automation" width="1280" height="422" loading="lazy" decoding="async"><div class="response-curtain left"></div><div class="response-curtain right"></div><div class="response-light top"></div><div class="response-light bottom"></div></div>
            <div class="room-response-control"><span>06 · THE ROOM KNOWS YOU’RE THERE.</span><h3>Environmental response, made visible.</h3><div class="response-readout"><p>VISITOR <b class="response-visitor">NO VISITOR</b></p><p>CURTAINS <b class="response-curtains">OPEN</b></p><p>LIGHTS <b class="response-lights">OFF</b></p><p>EXPERIENCE <b class="response-mode">STANDBY</b></p></div><button class="response-toggle" type="button">ENTER ROOM <i></i></button></div>
          </div>
        </div>
              </section>

      <!-- 07 REAL MEDIA · REAL INTERACTION -->
      <section class="action section section-muted tracked" id="action" data-index="07" data-title="Experience in Action">
        <div class="container">
          <header class="section-head reveal"><div><p>Real Media · Real Interaction</p></div><h2>Real media.<br><em>Real interaction.</em></h2></header>
          <div class="ob-media reveal">
            <div class="ob-media__tabs" role="tablist" aria-label="Live capture footage">
              <button class="is-active" data-i="01" data-target="obm-overview" aria-selected="true" type="button">Overview</button>
              <button data-i="02" data-target="obm-entry" aria-selected="false" type="button">Entry</button>
              <button data-i="03" data-target="obm-rotoscope" aria-selected="false" type="button">Rotoscope</button>
              <button data-i="04" data-target="obm-videowall" aria-selected="false" type="button">Videowall</button>
              <button data-i="05" data-target="obm-vr" aria-selected="false" type="button">Virtual reality</button>
            </div>
            <div class="ob-media__stage">
              <article class="ob-media__frame is-active" id="obm-overview">
                <div class="ob-media__vid"><video class="evidence-video" muted loop playsinline preload="none" poster="/assets/media/orange-business-executive-briefing-center-mumbai-panoramic-1280.webp" aria-label="Overview of the Orange Business Executive Briefing Center experience"><source src="/assets/media/overview.mp4?v=4.4.2" type="video/mp4"></video></div>
                <div class="ob-media__info"><h3>Overview</h3><p>The complete journey in one continuous capture — arrival, recognition, activation, immersion and conversation across the Executive Briefing Center.</p><small>FULL WALKTHROUGH · MUMBAI</small></div>
              </article>
              <article class="ob-media__frame" id="obm-entry">
                <div class="ob-media__vid"><video class="evidence-video" muted loop playsinline preload="none" poster="/assets/media/orange-business-arrival-display-848.webp" aria-label="Entry sequence of the Orange Business experience"><source src="/assets/media/entry.mp4?v=4.4.2" type="video/mp4"></video></div>
                <div class="ob-media__info"><h3>Entry</h3><p>The entry sequence — registration at the touchscreen, identity established on the entry display, and the room preparing itself as the visitor approaches.</p><small>REGISTRATION · PERSONALIZATION</small></div>
              </article>
              <article class="ob-media__frame" id="obm-rotoscope">
                <div class="ob-media__vid"><video class="evidence-video" muted loop playsinline preload="none" poster="/assets/media/orange-business-rotoscope-experience-848.webp" aria-label="The Rotoscope physical interface changing digital content states"><source src="/assets/media/rotoscope.mp4?v=4.4.2" type="video/mp4"></video></div>
                <div class="ob-media__info"><h3>Rotoscope</h3><p>The visitor slides the physical display — the content state changes with it. Physical movement becomes digital navigation through video, presentations and interactive media.</p><small>PHYSICAL INTERFACE · LIVE CAPTURE</small></div>
              </article>
              <article class="ob-media__frame" id="obm-videowall">
                <div class="ob-media__vid"><video class="evidence-video" muted loop playsinline preload="none" poster="/assets/media/orange-business-interactive-video-wall-848.webp" aria-label="The interactive video wall in use"><source src="/assets/media/videowall.mp4?v=4.4.2" type="video/mp4"></video></div>
                <div class="ob-media__info"><h3>Videowall</h3><p>One wall, multiple executive modes — presentation, product demonstration, touch-driven interaction and conferencing with remote experts, backed by high-performance computing and professional audio.</p><small>PRESENT · DEMONSTRATE · INTERACT · CONNECT</small></div>
              </article>
              <article class="ob-media__frame" id="obm-vr">
                <div class="ob-media__vid"><video class="evidence-video" muted loop playsinline preload="none" poster="/assets/media/orange-business-vr-experience-848.webp" aria-label="Visitor using the custom VR immersion chair"><source src="/assets/media/VR.mp4?v=4.4.2" type="video/mp4"></video></div>
                <div class="ob-media__info"><h3>Virtual reality</h3><p>The custom VR chair — designed specifically for Orange, with direct involvement through fabrication and refinement — turns product knowledge into immersive storytelling and sales enablement.</p><small>CUSTOM PHYSICAL INTERFACE · LIVE CAPTURE</small></div>
              </article>
            </div>
          </div></div>
      </section>

      <!-- 08 TECHNOLOGY WITH PURPOSE -->
      <section class="purpose section ob-light tracked" id="purpose" data-index="08" data-title="Technology with Purpose">
        <div class="container">
          <header class="section-head reveal"><div><p>Technology with Purpose</p></div><h2>Every system<br><em>had a reason.</em></h2></header>
          <div class="purpose-strip reveal" role="group" aria-label="Technology value">
            <button class="active" data-experience="A personalized visitor journey." data-business="More contextual executive engagement." type="button"><span>REGISTRATION</span><b>PERSONALIZATION</b></button>
            <button data-experience="A room that responds to presence." data-business="Automated and controlled room operation." type="button"><span>SENSORS</span><b>RESPONSE</b></button>
            <button data-experience="Physical navigation through digital content." data-business="More engaging product storytelling." type="button"><span>ROTOSCOPE</span><b>INTERACTION</b></button>
            <button data-experience="Presentation, interaction and remote collaboration." data-business="One interface for multiple executive use cases." type="button"><span>VIDEO WALL</span><b>COLLABORATION</b></button>
            <button data-experience="Immersive product understanding." data-business="Product knowledge and sales enablement." type="button"><span>VR</span><b>IMMERSION</b></button>
            <button data-experience="Continuously editable digital content." data-business="Long-term platform flexibility." type="button"><span>BACKEND</span><b>CONTINUITY</b></button>
          </div>
          <div class="purpose-output reveal" aria-live="polite"><div><span>EXPERIENCE VALUE</span><p>A personalized visitor journey.</p></div><div><span>BUSINESS VALUE</span><p>More contextual executive engagement.</p></div></div>
          <blockquote class="purpose-closing reveal">Technology was not the destination.<br><b>It was the enabler.</b></blockquote>
        </div>
      </section>

      <!-- 09 FROM STRATEGY TO SITE -->
      <section class="delivery section ob-light tracked" id="delivery" data-index="09" data-title="Strategy to Site">
        <div class="container">
          <header class="section-head inverse reveal"><div><p>From Strategy to Site</p></div><h2>The design wasn’t finished when <em>the drawings were approved.</em></h2></header>
          <div class="delivery-copy compact reveal"><p class="lead">I remained involved at the Experience Center for months while vendors worked through fabrication, installation, technology integration, content deployment, testing and refinement.</p><p>The project required coordination across Orange Business stakeholders, Mumbai and Gurgaon teams, creative teams, technology teams, vendors and fabricators.</p><div class="chair-note"><span>CUSTOM PHYSICAL DESIGN</span><b>The VR chair was designed specifically for Orange, with direct involvement during fabrication and refinement.</b></div></div>
          <div class="delivery-timeline reveal"><span>STRATEGY</span><i>→</i><span>DESIGN</span><i>→</i><span>BUILD</span><i>→</i><span>TEST</span><i>→</i><span>REFINE</span><i>→</i><span>DELIVER</span></div>
          <div class="authorship-strip reveal"><div><span>I LED</span><p>Strategy · Creative Direction · Experience Direction</p></div><div><span>I DESIGNED</span><p>UI/UX · Content · Storyboards · Interaction · VR Chair</p></div><div><span>I COORDINATED</span><p>Stakeholders · Teams · Vendors · Fabrication</p></div><div><span>I DELIVERED</span><p>Testing · Refinement · On-site Implementation</p></div></div>
        </div>
      </section>

      <!-- 10 OUTCOME -->
      <section class="outcome section ob-light tracked" id="outcome" data-index="10" data-title="Outcome">
        <div class="container">
          <header class="section-head reveal"><div><span>10</span><p>Outcome</p></div><h2>A briefing center became a <em>business experience platform.</em></h2></header>
          <p class="outcome-lead reveal">The completed environment brought together brand, content, interactive media, VR, high-performance computing, enterprise collaboration, visitor personalization, environmental automation and dynamic content into one physical-digital experience.</p>
          <div class="outcome-grid"><article class="reveal"><span>FOR THE VISITOR</span><h3>A personalized, responsive and immersive journey.</h3></article><article class="reveal"><span>FOR ORANGE BUSINESS</span><h3>A flexible environment for engagement, storytelling, demonstration and collaboration.</h3></article><article class="reveal"><span>FOR THE PLATFORM</span><h3>A digital layer capable of evolving after launch.</h3></article></div>
          <div class="global-note reveal"><div><span>GLOBAL CONTEXT</span><p>The Mumbai EBC connects the local experience to Orange Business’s wider Executive Briefing Center network.</p></div><div><span>LAUNCH</span><p>The completed Orange Business New Executive Briefing Center in Mumbai was inaugurated by the Global CEO of Orange Business.</p><a href="https://www.linkedin.com/posts/abhijeetvarghese_teamwork-designinnovation-newexecutivebriefingcenter-ugcPost-7269018331293052929-lbyY/" target="_blank" rel="noopener noreferrer">Public project announcement ↗</a></div></div>
          <p class="accuracy-note reveal">No ROI, visitor-volume, sales-uplift, conversion-rate or financial result is claimed without supporting evidence.</p>
        </div>
      </section>

      <!-- FINAL CLOSING -->
      <section class="ob-closing tracked" data-index="11" data-title="Closing">
        <div class="ob-closing__inner container">
          <p class="ob-kicker" style="justify-content:center"><b>ORANGE BUSINESS</b> MUMBAI</p>
          <h2>THE TECHNOLOGY WAS NEVER<br>THE DESTINATION. <em>THE EXPERIENCE WAS.</em></h2>
          <p>New Executive Briefing Center — Experience Strategy &amp; Creative Technology Lead.<br>Designed as one system. Delivered as one experience.</p>
          <a class="ob-closing__cta" href="/case-studies/"><i></i>BACK TO ALL CASE STUDIES</a>
        </div>
      </section>
    </article>
  `;if(d!=null&&d.image){const b=ie(String(d.image));b&&!b.includes("orange-business-executive-briefing-center-mumbai-panoramic-1280.webp")&&(o=o.replace("/assets/media/orange-business-executive-briefing-center-mumbai-panoramic-1280.webp",b),o=o.replace("/assets/media/orange-business-executive-briefing-center-mumbai-panoramic.jpeg",b))}const E=d?' data-cms-source="cms"':' data-cms-source="fallback"';return l.jsx("div",{dangerouslySetInnerHTML:{__html:`<div${E}>${o}</div>`}})}function fe(){return l.jsx("svg",{width:"17",height:"17",viewBox:"0 0 18 18",fill:"none","aria-hidden":"true",children:l.jsx("path",{d:"m3 3 12 12M15 3 3 15",stroke:"currentColor",strokeWidth:"1.7",strokeLinecap:"round"})})}function ye(){return se(),ne(),oe(),re(),be(),me(),ce(),de(),le("/case-studies/orange-business/",{title:"Orange Business — Abhijeet Varghese"}),ge(),l.jsxs(l.Fragment,{children:[l.jsx(pe,{activePath:"/case-studies/orange-business/"}),l.jsx("a",{className:"page-close",href:"/case-studies/","data-history-close":"","aria-label":"Back to Case Studies",children:l.jsx(fe,{})}),l.jsx("main",{id:"main",className:"ob-page",children:l.jsx(Ee,{})}),l.jsx(ue,{})]})}const Q=document.getElementById("root");if(!Q)throw new Error("Orange Business mount target is missing.");ve(Q).render(l.jsx(ye,{}));
