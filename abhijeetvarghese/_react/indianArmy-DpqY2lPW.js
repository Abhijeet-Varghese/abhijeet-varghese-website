import{u as T,c as k,j as e,a as I,b as E,d as A,e as R,f as S,g as C,h as P,S as j,i as q,k as M}from"./useCmsSeo-C1WmqeVb.js";import{u as L,a as z}from"./useMobileChrome-BJMjfRik.js";import{r as O}from"./react-SIwY82C9.js";function N(){O.useEffect(()=>{const t=document,p=t.documentElement,n=t.body;n&&!n.classList.contains("indian-army-case")&&n.classList.add("indian-army-case");const g=t.getElementById("main");g&&!g.classList.contains("indian-army-case")&&g.classList.add("indian-army-case");const l=window.matchMedia("(prefers-reduced-motion: reduce)"),h=(a,i=t)=>Array.prototype.slice.call((i||t).querySelectorAll(a)),o=(a,i,s)=>Math.min(s,Math.max(i,a));p.classList.add("ia-ok");const v=window.setTimeout(()=>p.classList.add("ia-failsafe"),2600),m=h(".ia-r, .ia-stages, .ia-cadence");let c=null;"IntersectionObserver"in window&&!l.matches?(c=new IntersectionObserver(a=>{a.forEach(i=>{i.isIntersecting&&(i.target.classList.add("is-in"),c.unobserve(i.target))})},{rootMargin:"0px 0px -8% 0px",threshold:.08}),m.forEach(a=>c.observe(a))):m.forEach(a=>a.classList.add("is-in")),p.style.scrollBehavior="auto";const x=h(".ia-parallax"),y=t.querySelector(".ia-gate"),r=window.matchMedia("(min-width: 1000px)");let b=!1;const u=()=>{b=!1;const a=window.innerHeight||1;if(!l.matches&&(r.matches&&x.forEach(i=>{const s=i.getBoundingClientRect();if(s.bottom<-200||s.top>a+200)return;const f=s.top+s.height/2,w=o((f-a/2)/(a/2+s.height/2),-1,1);i.style.setProperty("--py",(w*-16).toFixed(2)+"px")}),y)){const i=y.getBoundingClientRect(),s=a*.85,f=a*.15-i.height*.2,w=o((s-i.top)/(s-f),0,1);y.style.setProperty("--g",w.toFixed(4))}},d=()=>{b||(b=!0,requestAnimationFrame(u))};return window.addEventListener("scroll",d,{passive:!0}),window.addEventListener("resize",d),r.addEventListener&&r.addEventListener("change",d),r.addListener&&r.addListener(d),u(),h(".ia-fig__frame img[loading='lazy']").forEach(a=>{const i=a;if(i.complete){i.classList.add("is-loaded");return}i.addEventListener("load",()=>i.classList.add("is-loaded"),{once:!0})}),()=>{clearTimeout(v),c==null||c.disconnect(),window.removeEventListener("scroll",d),window.removeEventListener("resize",d),r.removeEventListener&&r.removeEventListener("change",d),r.removeListener&&r.removeListener(d)}},[])}function V(){const{data:t,source:p}=T("projects",null),n=p!=="cms"||!Array.isArray(t)?null:t.find(v=>{var m;return v.slug==="indian-army"||((m=v.caseStudyPath)==null?void 0:m.includes("indian-army"))})??null;let l=`

    <!-- ================= 01 · HERO ================= -->
    <section class="ia-section ia-hero" id="overview" data-chapter="Overview">
      <div class="ia-hero__media">
        <img src="/assets/media/indian-army/ia-01.webp" srcset="/assets/media/indian-army/ia-01-960.webp 960w, /assets/media/indian-army/ia-01.webp 1672w" sizes="100vw" width="1672" height="941" alt="The immersive training room: rows of trainee stations with VR headsets facing the large central instructor display of the Immersive Training and Qualification Ecosystem" fetchpriority="high" decoding="async">
        <div class="ia-hero__shade" aria-hidden="true"></div>
      </div>
      <div class="ia-wrap ia-hero__copy">
        <div class="ia-hero__eyebrow ia-r">
          <span class="ia-label ia-label--bare"><b>Case study</b> Indian Army</span>
          <span class="ia-tri" aria-hidden="true"><i></i><i></i><i></i></span>
          <span class="ia-label ia-label--bare">Defence · Immersive Training</span>
        </div>
        <h1 class="ia-h1 ia-hero__title">
          <span class="ia-r ia-r--line"><span>Train before</span></span>
          <span class="ia-r ia-r--line"><span>the</span></span>
          <span class="ia-r ia-r--line"><span>battlefield.</span></span>
        </h1>
        <div class="ia-hero__row">
          <p class="ia-hero__sub ia-r" style="--d:.3s"><strong>Immersive Training &amp; Qualification Ecosystem</strong> — an end-to-end immersive training environment designed to help Army personnel learn, practise and demonstrate competency before progressing toward physical training.</p>
          <dl class="ia-hero__meta ia-r" style="--d:.4s">
            <div><dt>Client</dt><dd>Indian Army</dd></div>
            <div><dt>Platforms</dt><dd>T-70 &amp; T-90</dd></div>
            <div><dt>Facility</dt><dd>15 high-end training stations · central instructor display</dd></div>
            <div><dt>Role</dt><dd>Experience strategy · creative direction · immersive experience · content · stakeholder &amp; team leadership</dd></div>
          </dl>
        </div>
        <a class="ia-hero__scroll ia-r" style="--d:.5s" href="#opening"><i aria-hidden="true"></i>Scroll to read</a>
      </div>
    </section>

      <!-- ================= 02 · OPENING STATEMENT ================= -->
    <section class="ia-section ia-section--tight" id="opening" aria-labelledby="h-opening">
      <div class="ia-wrap">
        <dl class="ia-strip ia-r">
          <div><dt>What was built</dt><dd>An immersive VR training and qualification environment for Army personnel</dd></div>
          <div><dt>Where</dt><dd>A dedicated training room set up with 15 high-end computer stations</dd></div>
          <div><dt>Instructor view</dt><dd>A high-end central display showing what trainees were doing in their VR sessions</dd></div>
          <div><dt>Qualification</dt><dd>Testing conducted inside the immersive environment</dd></div>
          <div><dt>Stakeholders</dt><dd>Daily with the Major · weekly with the Colonel · Brigadier-level approval</dd></div>
        </dl>
        <div class="ia-cols" style="margin-top:clamp(48px,6vw,88px)">
          <div class="ia-cols__side">
            <span class="ia-label ia-r"><b>02</b> Opening</span>
            <h2 class="ia-h2 ia-r" id="h-opening" style="--d:.08s">From digital training to <em>physical readiness.</em></h2>
          </div>
          <div>
            <p class="ia-lede ia-r">This was an end-to-end immersive training environment created for Indian Army personnel, combining VR-based training, centralised instructor visibility and qualification testing within a dedicated training facility.</p>
            <p class="ia-p ia-r" style="--d:.08s;margin-top:1.4em">The experience created a digital preparation and qualification stage before personnel progressed toward physical training. Trainees learned and practised on the <strong>T-70</strong> and <strong>T-90</strong> inside VR, the trainer followed their sessions from a central display, and qualification was tested in the same immersive environment.</p>
            <p class="ia-p ia-r" style="--d:.14s">I drove the experience from strategy through execution — working directly with the Army's stakeholders throughout, and leading the team that brought the training environment to life.</p>
          </div>
        </div>
      </div>
    </section>

    <!-- ================= 03 · PROJECT LEADERSHIP ================= -->
    <section class="ia-section ia-section--navy ia-grid-bg" id="leadership" data-chapter="Leadership" aria-labelledby="h-lead">
      <div class="ia-wrap">
        <header class="ia-head ia-head--split">
          <span class="ia-label ia-r"><b>03</b> Project leadership</span>
          <h2 class="ia-h-big ia-r" id="h-lead">Not just an experience. <em>A training ecosystem.</em></h2>
          <p class="ia-lede ia-r" style="--d:.1s">I was involved in driving the experience from strategy through execution — translating Army requirements into an immersive training environment while coordinating the creative, content and delivery process.</p>
        </header>
        <div class="ia-cols">
          <div>
            <p class="ia-p ia-r">I worked directly with the <strong>Major on a daily basis</strong>, collaborating on requirements, progress, feedback and iterations.</p>
            <p class="ia-p ia-r" style="--d:.06s">I worked with the <strong>Colonel on a weekly basis</strong> for reviews, alignment, direction and feedback.</p>
            <p class="ia-p ia-r" style="--d:.12s">At senior review level, I coordinated the work through <strong>Brigadier-level approval</strong>.</p>
          </div>
          <div>
            <p class="ia-lede ia-r" style="--d:.1s">This placed me directly between the Army stakeholders, the experience strategy and the team responsible for bringing the training environment to life.</p>
            <p class="ia-p ia-r" style="--d:.16s;margin-top:1.4em">I was not handed a brief and asked to produce visuals. The work was to translate what the Army needed into an immersive training experience, take that experience back to the stakeholders for review, and coordinate the people and work required to deliver it.</p>
          </div>
        </div>
        <ol class="ia-bridge ia-r" style="--d:.2s;margin-top:clamp(40px,5vw,64px)" aria-label="How the work flowed">
          <li><span>01</span><b>Army requirements</b></li>
          <li class="is-me"><span>02</span><b>Experience strategy</b></li>
          <li class="is-me"><span>03</span><b>Creative · content · immersive development</b></li>
          <li class="is-me"><span>04</span><b>Team execution</b></li>
          <li><span>05</span><b>Army review &amp; feedback</b></li>
          <li><span>06</span><b>Approval</b></li>
          <li><span>07</span><b>Implemented training experience</b></li>
        </ol>
        <p class="ia-note ia-r" style="margin-top:18px">Highlighted stages are where I led directly. Stakeholder relationships describe project collaboration, review and approval — not military command.</p>
      </div>
    </section>

    <!-- ================= 04 · THE PROBLEM / OPPORTUNITY ================= -->
    <section class="ia-section" id="challenge" data-chapter="Challenge" aria-labelledby="h-challenge">
      <div class="ia-wrap">
        <div class="ia-statement">
          <span class="ia-label ia-r"><b>04</b> The opportunity</span>
          <h2 class="ia-h-big ia-r" id="h-challenge" style="--d:.08s">Before the battlefield, <em>there is a learning curve.</em></h2>
          <div class="ia-statement__rule ia-r" style="--d:.16s"></div>
          <div class="ia-cols">
            <p class="ia-lede ia-r" style="--d:.2s">Complex operational training requires more than information. Personnel need an environment in which they can learn, practise, repeat and demonstrate their understanding before moving into physical training.</p>
            <div>
              <p class="ia-p ia-r" style="--d:.24s">The opportunity was to create an immersive digital layer that could sit between learning and physical training — allowing trainees to experience the training environment through VR while giving instructors visibility into the process.</p>
              <div class="ia-progression ia-r" style="--d:.3s" role="list" aria-label="Training progression">
                <b role="listitem">Digital training</b><i aria-hidden="true"></i>
                <b role="listitem">Qualification</b><i aria-hidden="true"></i>
                <b role="listitem">Physical / battlefield training</b>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ================= 05 · THE TRAINING ROOM ================= -->
    <section class="ia-section ia-section--flush" id="ecosystem" data-chapter="Facility" aria-labelledby="h-facility">
      <figure class="ia-fig ia-bleed ia-parallax ia-r ia-r--img">
        <div class="ia-fig__frame">
          <img src="/assets/media/indian-army/ia-10.webp" srcset="/assets/media/indian-army/ia-10-960.webp 960w, /assets/media/indian-army/ia-10.webp 1672w" sizes="100vw" width="1672" height="941" alt="The dedicated training room: fifteen high-end computer stations with VR headsets arranged in rows before the large central instructor display" loading="lazy" decoding="async">
        </div>
        <div class="ia-bleed__overlay ia-bleed__overlay--below">
          <div class="ia-wrap">
            <span class="ia-label ia-r"><b>05</b> The training room</span>
            <h2 class="ia-h-big ia-r" id="h-facility" style="--d:.08s;margin-top:14px;max-width:16ch">15 stations. <em>One connected training environment.</em></h2>
          </div>
        </div>
        <figcaption><b>The 15-station training facility</b>Dedicated training room · individual VR sessions · central instructor display</figcaption>
      </figure>
      <div class="ia-wrap" style="padding:clamp(48px,6vw,88px) 0 var(--ia-section)">
        <div class="ia-cols">
          <div class="ia-cols__side is-sticky">
            <p class="ia-lede ia-r">The physical foundation of the experience was a dedicated training room equipped with <strong>15 high-end computer stations</strong> for VR-based training.</p>
          </div>
          <div>
            <p class="ia-p ia-r">Each trainee could participate in an individual immersive session while a <strong>high-end central display</strong> gave the trainer a consolidated view of what trainees were doing inside their VR environments.</p>
            <p class="ia-p ia-r" style="--d:.08s">The result was not simply a room full of individual VR experiences. It was a connected training environment where individual immersion and centralised instruction existed together.</p>
            <ul class="ia-keys ia-r" style="--d:.14s;margin-top:28px">
              <li><span>A</span><p><b>15 high-end computer stations</b> — one trainee, one individual VR session per station.</p></li>
              <li><span>B</span><p><b>Dedicated training room</b> — set up for Army personnel as a purpose-built training space.</p></li>
              <li><span>C</span><p><b>High-end central display</b> — the trainer's consolidated view of trainee activity.</p></li>
              <li><span>D</span><p><b>Two platforms</b> — T-70 and T-90 experiences within one training framework.</p></li>
            </ul>
          </div>
        </div>
      </div>
    </section>

    <!-- ================= 06 · INSTRUCTOR VIEW ================= -->
    <section class="ia-section ia-section--navy ia-section--flush" id="monitoring" data-chapter="Instructor view" aria-labelledby="h-instructor">
      <div class="ia-wrap" style="padding:var(--ia-section) 0 clamp(40px,5vw,64px)">
        <header class="ia-head ia-head--split">
          <span class="ia-label ia-r"><b>06</b> The instructor view</span>
          <h2 class="ia-h2 ia-r" id="h-instructor">Immersion for the trainee. <em>Visibility for the trainer.</em></h2>
          <p class="ia-lede ia-r" style="--d:.1s">Immersive training can become isolated if the instructor cannot see what is happening inside the experience. This system connected both sides.</p>
        </header>
      </div>
      <figure class="ia-fig ia-bleed ia-parallax ia-r ia-r--img">
        <div class="ia-fig__frame">
          <img src="/assets/media/indian-army/ia-02.webp" srcset="/assets/media/indian-army/ia-02-960.webp 960w, /assets/media/indian-army/ia-02.webp 1672w" sizes="100vw" width="1672" height="941" alt="The trainer standing before the large central display, which shows a grid of every trainee's VR session alongside platform and session panels" loading="lazy" decoding="async">
        </div>
        <figcaption><b>Instructor command view</b>Individual immersion → centralised instructor view</figcaption>
      </figure>
      <div class="ia-wrap" style="padding:clamp(48px,6vw,80px) 0 var(--ia-section)">
        <div class="ia-cols">
          <p class="ia-lede ia-r">Trainees remained immersed in their individual VR sessions, while the trainer retained a centralised view of the training activity through the main display.</p>
          <div>
            <p class="ia-p ia-r">This allowed instruction, observation and assessment to remain connected to the immersive experience. The trainer could see what each trainee was doing during their session — not after it — and guide the room accordingly.</p>
            <p class="ia-p ia-r" style="--d:.08s">Designing for the instructor with the same care as the trainee was one of the most important decisions in the project. It is what turned fifteen private experiences into one training environment.</p>
          </div>
        </div>
      </div>
    </section>

    <!-- ================= 07 · INSTRUCTOR MONITORING (detail) ================= -->
    <section class="ia-section ia-section--graphite" id="instructor-monitoring" aria-labelledby="h-monitor">
      <div class="ia-wrap">
        <div class="ia-cols ia-cols--rev" style="align-items:center">
          <div class="ia-cols__side">
            <span class="ia-label ia-r"><b>07</b> Monitoring &amp; assessment</span>
            <h2 class="ia-h2 ia-r" id="h-monitor" style="--d:.08s">Observation stayed <em>inside the loop.</em></h2>
            <p class="ia-p ia-r" style="--d:.14s">Because trainee activity was visible on the central display, the trainer could observe individual sessions, follow progress through the training and bring attention to a specific trainee when needed.</p>
            <p class="ia-p ia-r" style="--d:.2s">The same visibility carried into assessment: what the trainer observed during practice became the basis for evaluating readiness to qualify.</p>
          </div>
          <figure class="ia-fig ia-r ia-r--img">
            <div class="ia-fig__frame">
              <i class="ia-fig__tick"></i><i class="ia-fig__tick"></i><i class="ia-fig__tick"></i><i class="ia-fig__tick"></i>
              <img src="/assets/media/indian-army/ia-13.webp" srcset="/assets/media/indian-army/ia-13-960.webp 960w, /assets/media/indian-army/ia-13.webp 1672w" sizes="(min-width: 900px) 58vw, 100vw" width="1672" height="941" alt="The trainer at the monitoring console reviewing an individual trainee's session on the command view, with the station grid beside it" loading="lazy" decoding="async">
            </div>
            <figcaption><b>Instructor monitoring</b>Individual session brought forward on the central display</figcaption>
          </figure>
        </div>
      </div>
    </section>

    <!-- ================= 08 · T-90 ================= -->
    <section class="ia-section" id="immersive" data-chapter="Platforms" aria-labelledby="h-t90">
      <div class="ia-wrap">
        <div class="ia-cols ia-cols--eq" style="align-items:center">
          <div class="ia-cols__side">
            <span class="ia-label ia-r"><b>08</b> Platform</span>
            <h2 class="ia-display ia-r" id="h-t90" style="--d:.08s">T-90</h2>
            <p class="ia-lede ia-r" style="--d:.14s">Learn inside the machine.</p>
            <p class="ia-p ia-r" style="--d:.2s">The T-90 was brought into the immersive training environment as part of the digital learning and practice experience.</p>
            <p class="ia-p ia-r" style="--d:.26s">The goal was to give trainees an immersive environment in which they could engage with the training experience before progressing to the next stage of training.</p>
          </div>
          <figure class="ia-fig ia-r ia-r--img" style="--d:.1s">
            <div class="ia-fig__frame">
              <i class="ia-fig__tick"></i><i class="ia-fig__tick"></i><i class="ia-fig__tick"></i><i class="ia-fig__tick"></i>
              <img src="/assets/media/indian-army/ia-04.webp" srcset="/assets/media/indian-army/ia-04-960.webp 960w, /assets/media/indian-army/ia-04.webp 1672w" sizes="(min-width: 900px) 50vw, 100vw" width="1672" height="941" alt="The T-90 in the immersive training environment, framed by the training module panel" loading="lazy" decoding="async">
            </div>
            <figcaption><b>T-90 immersive training</b></figcaption>
          </figure>
        </div>
      </div>
    </section>

    <!-- ================= 09 · T-70 ================= -->
    <section class="ia-section ia-section--navy" id="t70" aria-labelledby="h-t70">
      <div class="ia-wrap">
        <div class="ia-cols ia-cols--eq ia-cols--rev" style="align-items:center">
          <div class="ia-cols__side">
            <span class="ia-label ia-r"><b>09</b> Platform</span>
            <h2 class="ia-display ia-r" id="h-t70" style="--d:.08s">T-70</h2>
            <p class="ia-lede ia-r" style="--d:.14s">The same immersive training principle.</p>
            <p class="ia-p ia-r" style="--d:.2s">The T-70 was integrated into the same broader immersive training approach.</p>
            <p class="ia-p ia-r" style="--d:.26s">Rather than treating each platform as an isolated experience, the project established a consistent digital training framework across the two platforms.</p>
          </div>
          <figure class="ia-fig ia-r ia-r--img" style="--d:.1s">
            <div class="ia-fig__frame">
              <i class="ia-fig__tick"></i><i class="ia-fig__tick"></i><i class="ia-fig__tick"></i><i class="ia-fig__tick"></i>
              <img src="/assets/media/indian-army/ia-05.webp" srcset="/assets/media/indian-army/ia-05-960.webp 960w, /assets/media/indian-army/ia-05.webp 1672w" sizes="(min-width: 900px) 50vw, 100vw" width="1672" height="941" alt="The T-70 in the immersive training environment on open terrain, with the training module panel visible" loading="lazy" decoding="async">
            </div>
            <figcaption><b>T-70 immersive training</b></figcaption>
          </figure>
        </div>
      </div>
    </section>

    <!-- ================= 10 · ONE FRAMEWORK ================= -->
    <section class="ia-section ia-section--flush" id="framework" aria-labelledby="h-framework">
      <figure class="ia-fig ia-bleed ia-parallax ia-r ia-r--img">
        <div class="ia-fig__frame">
          <img src="/assets/media/indian-army/ia-16.webp" srcset="/assets/media/indian-army/ia-16-960.webp 960w, /assets/media/indian-army/ia-16.webp 1672w" sizes="100vw" width="1672" height="941" alt="Two platforms, one training ecosystem: the T-90 and T-70 shown side by side above a shared strip of training modules" loading="lazy" decoding="async">
        </div>
        <div class="ia-bleed__overlay ia-bleed__overlay--below">
          <div class="ia-wrap">
            <span class="ia-label ia-r"><b>10</b> One framework</span>
            <h2 class="ia-h-big ia-r" id="h-framework" style="--d:.08s;margin-top:14px;max-width:16ch">Two platforms. <em>One training logic.</em></h2>
          </div>
        </div>
        <figcaption><b>T-70 + T-90 unified framework</b></figcaption>
      </figure>
      <div class="ia-wrap" style="padding:clamp(48px,6vw,80px) 0 var(--ia-section)">
        <div class="ia-cols ia-cols--eq" style="align-items:start">
          <div>
            <p class="ia-lede ia-r">The strength of the experience was not only in recreating individual platforms digitally.</p>
            <p class="ia-p ia-r" style="--d:.08s;margin-top:1.4em">It was in creating a broader training logic that could move personnel through learning, practice and qualification within the immersive environment — the same logic, whichever platform a trainee was working on.</p>
          </div>
          <ol class="ia-chain ia-chain--compact ia-r" style="--d:.1s" aria-label="Training logic">
            <li><span>—</span><b>T-70 + T-90</b></li>
            <li><span>↓</span><b>Immersive training</b></li>
            <li><span>↓</span><b>Practice</b></li>
            <li><span>↓</span><b>Assessment</b></li>
            <li><span>↓</span><b>Qualification</b></li>
            <li class="is-end"><span>↓</span><b>Physical training</b></li>
          </ol>
        </div>
      </div>
    </section>

    <!-- ================= 11 · TRAINEE EXPERIENCE ================= -->
    <section class="ia-section ia-section--graphite" id="inside" aria-labelledby="h-inside">
      <div class="ia-wrap--wide">
        <figure class="ia-fig ia-r ia-r--img">
          <div class="ia-fig__frame">
            <i class="ia-fig__tick"></i><i class="ia-fig__tick"></i><i class="ia-fig__tick"></i><i class="ia-fig__tick"></i>
            <img src="/assets/media/indian-army/ia-03.webp" srcset="/assets/media/indian-army/ia-03-960.webp 960w, /assets/media/indian-army/ia-03.webp 1672w" sizes="(min-width: 1640px) 1560px, 100vw" width="1672" height="941" alt="First-person view from inside the T-90 training environment: the crew position and viewport looking out over mountainous terrain" loading="lazy" decoding="async">
          </div>
          <figcaption><b>Inside the experience · trainee point of view</b></figcaption>
        </figure>
      </div>
      <div class="ia-wrap" style="margin-top:clamp(36px,5vw,64px)">
        <div class="ia-cols">
          <div class="ia-cols__side">
            <span class="ia-label ia-r"><b>11</b> The trainee experience</span>
            <h2 class="ia-h2 ia-r" id="h-inside" style="--d:.08s">Inside <em>the experience.</em></h2>
          </div>
          <div>
            <p class="ia-lede ia-r">For the trainee, the experience was direct and immersive.</p>
            <p class="ia-p ia-r" style="--d:.08s;margin-top:1.4em">VR placed the training environment around the individual, creating a space where learning and practice could happen through active participation rather than observation alone.</p>
          </div>
        </div>
      </div>
    </section>

    <!-- ================= 12 · INDIVIDUAL SESSION ================= -->
    <section class="ia-section ia-section--flush" id="session" aria-labelledby="h-session">
      <figure class="ia-fig ia-bleed ia-parallax ia-r ia-r--img">
        <div class="ia-fig__frame">
          <img src="/assets/media/indian-army/ia-12.webp" srcset="/assets/media/indian-army/ia-12-960.webp 960w, /assets/media/indian-army/ia-12.webp 1672w" sizes="100vw" width="1672" height="941" alt="A trainee wearing a VR headset at a station, hands on the controls, with the training module on the monitor and the central display in the background" loading="lazy" decoding="async">
        </div>
        <figcaption><b>Individual trainee session</b>One station · one trainee · one immersive environment</figcaption>
      </figure>
      <div class="ia-wrap" style="padding:clamp(48px,6vw,80px) 0 var(--ia-section)">
        <div class="ia-cols">
          <div class="ia-cols__side">
            <span class="ia-label ia-r"><b>12</b> One station, one trainee</span>
            <h2 class="ia-h2 ia-r" id="h-session" style="--d:.08s">Individual immersion. <em>Shared visibility.</em></h2>
          </div>
          <div>
            <p class="ia-p ia-r">Each of the fifteen stations ran an individual VR session. What a trainee experienced was theirs alone — but what they were doing was visible to the trainer on the central display. That pairing of individual immersion and centralised visibility is the defining relationship of the ecosystem.</p>
          </div>
        </div>
      </div>
    </section>

    <!-- ================= 13 · QUALIFICATION TESTING ================= -->
    <section class="ia-section" id="qualification" data-chapter="Qualification" aria-labelledby="h-qual">
      <div class="ia-wrap">
        <header class="ia-head ia-head--split">
          <span class="ia-label ia-r"><b>13</b> Qualification testing</span>
          <h2 class="ia-h2 ia-r" id="h-qual">Training became <em>assessable.</em></h2>
          <p class="ia-lede ia-r" style="--d:.1s">The immersive environment also became the setting for qualification testing.</p>
        </header>
        <figure class="ia-fig ia-r ia-r--img">
          <div class="ia-fig__frame">
            <i class="ia-fig__tick"></i><i class="ia-fig__tick"></i><i class="ia-fig__tick"></i><i class="ia-fig__tick"></i>
            <img src="/assets/media/indian-army/ia-06.webp" srcset="/assets/media/indian-army/ia-06-960.webp 960w, /assets/media/indian-army/ia-06.webp 1672w" sizes="(min-width: 1400px) 1320px, 100vw" width="1672" height="941" alt="Qualification test view from inside the T-90 environment: assessment stages listed on the left, the crew position in the centre, and the qualification panel on the right" loading="lazy" decoding="async">
          </div>
          <figcaption><b>Qualification test · inside the immersive environment</b></figcaption>
        </figure>
        <div class="ia-cols" style="margin-top:clamp(36px,5vw,64px)">
          <p class="ia-lede ia-r">Trainees were not simply experiencing the environment. They were expected to demonstrate their understanding and performance within it.</p>
          <div>
            <p class="ia-p ia-r">This introduced an important transition — from an environment in which you learn to one in which you are expected to show what you have learned.</p>
            <div class="ia-progression ia-r" style="--d:.08s" role="list" aria-label="Transition">
              <b role="listitem">Learning</b><i aria-hidden="true"></i>
              <b role="listitem">Practice</b><i aria-hidden="true"></i>
              <b role="listitem">Demonstration → Qualification</b>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ================= 14 · PERFORMANCE / ASSESSMENT VIEW ================= -->
    <section class="ia-section ia-section--graphite" id="performance" aria-labelledby="h-perf">
      <div class="ia-wrap">
        <div class="ia-cols">
          <div class="ia-cols__side is-sticky">
            <span class="ia-label ia-r"><b>14</b> Assessment</span>
            <h2 class="ia-h2 ia-r" id="h-perf" style="--d:.08s">What the trainer saw <em>became the decision.</em></h2>
            <p class="ia-p ia-r" style="--d:.14s">Assessment drew on the same central visibility the trainer used during practice: which trainees had worked through the training, how they had performed inside the environment, and who was ready to qualify.</p>
            <p class="ia-p ia-r" style="--d:.2s">That is what allowed qualification to be a considered stage rather than a formality.</p>
          </div>
          <figure class="ia-fig ia-r ia-r--img">
            <div class="ia-fig__frame">
              <i class="ia-fig__tick"></i><i class="ia-fig__tick"></i><i class="ia-fig__tick"></i><i class="ia-fig__tick"></i>
              <img src="/assets/media/indian-army/ia-15.webp" srcset="/assets/media/indian-army/ia-15-960.webp 960w, /assets/media/indian-army/ia-15.webp 1672w" sizes="(min-width: 900px) 58vw, 100vw" width="1672" height="941" alt="The trainer reviewing a trainee's assessment view on the central display" loading="lazy" decoding="async">
            </div>
            <figcaption><b>Assessment view</b>Figures shown are indicative only, not trainee records</figcaption>
          </figure>
        </div>
      </div>
    </section>

    <!-- ================= 15 · QUALIFIED ================= -->
    <section class="ia-section ia-section--flush ia-qualified" id="qualified" aria-labelledby="h-qualified">
      <figure class="ia-fig ia-bleed ia-parallax ia-r ia-r--img">
        <div class="ia-fig__frame">
          <img src="/assets/media/indian-army/ia-14.webp" srcset="/assets/media/indian-army/ia-14-960.webp 960w, /assets/media/indian-army/ia-14.webp 1672w" sizes="100vw" width="1672" height="941" alt="A trainee at a station looks up at the screen confirming a qualified result, with the central display in the background" loading="lazy" decoding="async">
        </div>
        <div class="ia-bleed__overlay">
          <div class="ia-wrap">
            <span class="ia-label ia-r"><b>15</b> Qualification before progression</span>
            <h2 class="ia-display ia-r ia-qualified__word" id="h-qualified" style="--d:.08s;margin-top:14px"><i aria-hidden="true"></i>Qualified.</h2>
            <p class="ia-qualified__sub ia-r" style="--d:.16s">A defined stage between digital learning and physical training.</p>
          </div>
        </div>
        <figcaption><b>The qualification moment</b></figcaption>
      </figure>
      <div class="ia-wrap" style="padding:clamp(48px,6vw,80px) 0 var(--ia-section)">
        <div class="ia-cols">
          <p class="ia-lede ia-r">Qualification created a defined stage between digital learning and physical training.</p>
          <div>
            <p class="ia-p ia-r">The immersive environment could therefore function not only as a training space, but also as a point at which trainees demonstrated their competency before progressing further.</p>
          </div>
        </div>
      </div>
    </section>

    <!-- ================= 16 · DIGITAL → PHYSICAL ================= -->
    <section class="ia-section ia-section--navy ia-section--flush" id="physical" data-chapter="Digital → Physical" aria-labelledby="h-gate">
      <div class="ia-wrap" style="padding:var(--ia-section) 0 clamp(40px,5vw,64px)">
        <header class="ia-head">
          <span class="ia-label ia-r"><b>16</b> From digital to physical</span>
          <h2 class="ia-h2 ia-r" id="h-gate" style="--d:.06s">VR didn't replace the battlefield.</h2>
          <p class="ia-h-big ia-r" style="--d:.12s;max-width:18ch">It prepared the trainee <em>for the next stage.</em></p>
        </header>
      </div>
      <figure class="ia-fig ia-bleed ia-gate ia-r ia-r--img">
        <div class="ia-fig__frame">
          <img src="/assets/media/indian-army/ia-07.webp" srcset="/assets/media/indian-army/ia-07-960.webp 960w, /assets/media/indian-army/ia-07.webp 1672w" sizes="100vw" width="1672" height="941" alt="Split composition: a trainee in a VR headset with a qualified result on the left, transitioning to a tank crossing real terrain on the right" loading="lazy" decoding="async">
          <div class="ia-gate__veil" aria-hidden="true"></div>
          <div class="ia-gate__line" aria-hidden="true"></div>
        </div>
        <figcaption><b>Digital → physical</b>Immersive training · qualification · physical training</figcaption>
      </figure>
      <div class="ia-wrap" style="padding:clamp(48px,6vw,80px) 0 var(--ia-section)">
        <div class="ia-cols ia-cols--eq" style="align-items:start">
          <div>
            <p class="ia-lede ia-r">The purpose of immersive training was not to replace physical training.</p>
            <p class="ia-p ia-r" style="--d:.08s;margin-top:1.4em">It created a digital preparation and qualification stage before personnel progressed toward physical, battlefield-based training.</p>
            <p class="ia-p ia-r" style="--d:.14s">Once trainees excelled in the digital training environment, they could progress to the next stage of physical training.</p>
          </div>
          <ol class="ia-chain ia-r" style="--d:.1s" aria-label="Digital to physical progression">
            <li><span>01</span><b>Digital<small>Immersive training</small></b></li>
            <li><span>02</span><b>Qualification<small>Demonstrated competency</small></b></li>
            <li class="is-end"><span>03</span><b>Physical<small>Physical / battlefield training</small></b></li>
          </ol>
        </div>
      </div>
    </section>

    <!-- ================= 17 · PHYSICAL TRAINING ================= -->
    <section class="ia-section ia-section--flush" id="battlefield" aria-labelledby="h-battlefield">
      <figure class="ia-fig ia-bleed ia-parallax ia-r ia-r--img">
        <div class="ia-fig__frame">
          <img src="/assets/media/indian-army/ia-08.webp" srcset="/assets/media/indian-army/ia-08-960.webp 960w, /assets/media/indian-army/ia-08.webp 1672w" sizes="100vw" width="1672" height="941" alt="Tanks moving across open high-altitude terrain during physical training" loading="lazy" decoding="async">
        </div>
        <div class="ia-bleed__overlay ia-bleed__overlay--below">
          <div class="ia-wrap">
            <span class="ia-label ia-r"><b>17</b> Physical training</span>
            <h2 class="ia-h-big ia-r" id="h-battlefield" style="--d:.08s;margin-top:14px;max-width:16ch">From immersion <em>to physical training.</em></h2>
          </div>
        </div>
        <figcaption><b>Physical / battlefield training</b></figcaption>
      </figure>
      <div class="ia-wrap" style="padding:clamp(48px,6vw,80px) 0 var(--ia-section)">
        <div class="ia-cols">
          <p class="ia-lede ia-r">The digital environment was one stage of a larger training journey.</p>
          <div>
            <p class="ia-p ia-r">After demonstrating competency within the immersive environment, personnel could progress toward physical training. The experience therefore connected two worlds: <strong>immersive practice</strong> and <strong>physical training</strong>.</p>
          </div>
        </div>
      </div>
    </section>

    <!-- ================= 18 · COMPLETE JOURNEY ================= -->
    <section class="ia-section ia-section--graphite" id="journey" data-chapter="Journey" aria-labelledby="h-journey">
      <div class="ia-wrap">
        <header class="ia-head">
          <span class="ia-label ia-r"><b>18</b> The complete journey</span>
          <h2 class="ia-h-big ia-r" id="h-journey" style="--d:.08s;max-width:22ch">Learn. Practice. Monitor. Assess. Qualify. <em>Progress.</em></h2>
        </header>
        <ol class="ia-stages" aria-label="Six-stage training journey">
          <li><span>01</span><b>Learn</b><p>Understand the training environment.</p></li>
          <li><span>02</span><b>Practice</b><p>Build familiarity through immersive interaction.</p></li>
          <li><span>03</span><b>Monitor</b><p>Trainer maintains centralised visibility.</p></li>
          <li><span>04</span><b>Assess</b><p>Performance is observed within the immersive environment.</p></li>
          <li><span>05</span><b>Qualify</b><p>Trainees demonstrate competency.</p></li>
          <li><span>06</span><b>Progress</b><p>Successful trainees can move toward physical training.</p></li>
        </ol>
        <figure class="ia-fig ia-r ia-r--img" style="margin-top:clamp(40px,5vw,72px)">
          <div class="ia-fig__frame">
            <i class="ia-fig__tick"></i><i class="ia-fig__tick"></i><i class="ia-fig__tick"></i><i class="ia-fig__tick"></i>
            <img src="/assets/media/indian-army/ia-09.webp" srcset="/assets/media/indian-army/ia-09-960.webp 960w, /assets/media/indian-army/ia-09.webp 1672w" sizes="(min-width: 1400px) 1320px, 100vw" width="1672" height="941" alt="Overview of the complete training journey — Learn, Practice, Monitor, Assess, Qualify, Progress — above a trainee at a VR station" loading="lazy" decoding="async">
          </div>
          <figcaption><b>The complete training journey</b></figcaption>
        </figure>
      </div>
    </section>

    <!-- ================= 19 · SYSTEM ARCHITECTURE ================= -->
    <section class="ia-section" id="project-system" aria-labelledby="h-arch">
      <div class="ia-wrap">
        <header class="ia-head ia-head--split">
          <span class="ia-label ia-r"><b>19</b> System architecture</span>
          <h2 class="ia-h2 ia-r" id="h-arch">A training ecosystem, <em>not a single screen.</em></h2>
          <p class="ia-lede ia-r" style="--d:.1s">At the system level, every part of the facility had a place in one chain — from the fifteen stations to the point at which a trainee progressed to physical training.</p>
        </header>
        <div class="ia-cols ia-cols--eq" style="align-items:start">
          <ol class="ia-chain ia-r" aria-label="System architecture">
            <li><span>01</span><b>15 trainee stations</b></li>
            <li><span>02</span><b>VR training environments<small>T-70 and T-90</small></b></li>
            <li><span>03</span><b>Centralised trainer view<small>High-end central display</small></b></li>
            <li><span>04</span><b>Immersive assessment</b></li>
            <li><span>05</span><b>Qualification</b></li>
            <li class="is-end"><span>06</span><b>Physical training</b></li>
          </ol>
          <figure class="ia-fig ia-r ia-r--img" style="--d:.1s">
            <div class="ia-fig__frame">
              <i class="ia-fig__tick"></i><i class="ia-fig__tick"></i><i class="ia-fig__tick"></i><i class="ia-fig__tick"></i>
              <img src="/assets/media/indian-army/ia-11.webp" srcset="/assets/media/indian-army/ia-11-960.webp 960w, /assets/media/indian-army/ia-11.webp 1672w" sizes="(min-width: 900px) 50vw, 100vw" width="1672" height="941" alt="System architecture overview connecting the trainee stations, the immersive VR environment, the instructor view, assessment and qualification, and progression to physical training" loading="lazy" decoding="async">
            </div>
            <figcaption><b>System architecture</b>System-level view</figcaption>
          </figure>
        </div>
      </div>
    </section>

    <!-- ================= 20 · CONTENT DEVELOPMENT ================= -->
    <section class="ia-section ia-section--navy" id="content" aria-labelledby="h-content">
      <div class="ia-wrap">
        <div class="ia-cols">
          <div class="ia-cols__side is-sticky">
            <span class="ia-label ia-r"><b>20</b> Content development</span>
            <h2 class="ia-h2 ia-r" id="h-content" style="--d:.08s">The experience was built <em>around the training.</em></h2>
            <p class="ia-lede ia-r" style="--d:.14s">My role extended beyond the visual layer.</p>
            <p class="ia-p ia-r" style="--d:.2s">I was involved in shaping the experience and content that trainees encountered inside the immersive environment, translating requirements into a structured training journey and coordinating its development through iteration and stakeholder feedback.</p>
          </div>
          <figure class="ia-fig ia-r ia-r--img">
            <div class="ia-fig__frame">
              <i class="ia-fig__tick"></i><i class="ia-fig__tick"></i><i class="ia-fig__tick"></i><i class="ia-fig__tick"></i>
              <img src="/assets/media/indian-army/ia-17.webp" srcset="/assets/media/indian-army/ia-17-960.webp 960w, /assets/media/indian-army/ia-17.webp 1672w" sizes="(min-width: 900px) 58vw, 100vw" width="1672" height="941" alt="Close view of the training content structure on a station monitor beside the vehicle model" loading="lazy" decoding="async">
            </div>
            <figcaption><b>Training content detail</b></figcaption>
          </figure>
        </div>
      </div>
    </section>

    <!-- ================= 21 · STAKEHOLDER MANAGEMENT ================= -->
    <section class="ia-section ia-grid-bg" id="stakeholders" data-chapter="Stakeholders" aria-labelledby="h-stake">
      <div class="ia-wrap">
        <header class="ia-head ia-head--split">
          <span class="ia-label ia-r"><b>21</b> Stakeholder management</span>
          <h2 class="ia-h-big ia-r" id="h-stake">Working at the speed <em>of the stakeholder.</em></h2>
          <p class="ia-lede ia-r" style="--d:.1s">Three cadences ran through the whole project. Each one was mine to prepare for, present to and act on.</p>
        </header>
        <ol class="ia-cadence" aria-label="Stakeholder cadence">
          <li class="ia-r"><span>Daily</span><h3>Major<em>Direct collaboration</em></h3><p>Working through requirements, reviewing progress, discussing feedback, aligning the experience, resolving issues and driving iterations.</p><div class="ia-cadence__tags"><span>Requirements</span><span>Feedback</span><span>Iteration</span><span>Progress</span></div></li>
          <li class="ia-r" style="--d:.08s"><span>Weekly</span><h3>Colonel<em>Review</em></h3><p>Progress reviews, direction, feedback, alignment and presentation of the evolving work.</p><div class="ia-cadence__tags"><span>Direction</span><span>Alignment</span><span>Feedback</span></div></li>
          <li class="ia-r" style="--d:.16s"><span>Senior review</span><h3>Brigadier<em>Approval</em></h3><p>Taking the work through senior-level review for Brigadier-level approval.</p><div class="ia-cadence__tags"><span>Senior-level review</span><span>Approval</span></div></li>
        </ol>
        <div class="ia-cols" style="margin-top:clamp(36px,5vw,56px)">
          <p class="ia-lede ia-r">Direct collaboration → review → alignment → senior approval.</p>
          <div>
            <p class="ia-p ia-r">Working directly with Army stakeholders throughout the project meant continuously translating requirements into experience decisions, taking feedback back to the team, iterating the work and presenting the evolving solution for review.</p>
            <p class="ia-note ia-r" style="--d:.06s;margin-top:16px">These were project relationships — collaboration, review and approval of the work. They do not describe a military position or command authority.</p>
          </div>
        </div>
      </div>
    </section>

    <!-- ================= 22 · MY ROLE ================= -->
    <section class="ia-section ia-section--navy" id="role" data-chapter="My role" aria-labelledby="h-role">
      <div class="ia-wrap">
        <header class="ia-head ia-head--split">
          <span class="ia-label ia-r"><b>22</b> My role</span>
          <h2 class="ia-h2 ia-r" id="h-role">Led the experience, <em>end to end.</em></h2>
          <p class="ia-lede ia-r" style="--d:.1s">Strategy, direction, content, stakeholders, team and execution — held together across the lifecycle of the project rather than handed off after the concept.</p>
        </header>
        <ol class="ia-role">
          <li class="ia-r"><span>01</span><h3>Experience strategy</h3><p>Defined how the immersive experience could support the broader training journey.</p></li>
          <li class="ia-r" style="--d:.06s"><span>02</span><h3>Creative direction</h3><p>Shaped the overall experience, storytelling and creative approach.</p></li>
          <li class="ia-r" style="--d:.12s"><span>03</span><h3>Immersive experience</h3><p>Directed how trainees would encounter and move through the digital environment.</p></li>
          <li class="ia-r" style="--d:.18s"><span>04</span><h3>Content development</h3><p>Created and shaped the content required for the immersive training experience.</p></li>
          <li class="ia-r" style="--d:.24s"><span>05</span><h3>Stakeholder management</h3><p>Worked directly with the Major, the Colonel and the Brigadier-level approval process.</p></li>
          <li class="ia-r" style="--d:.3s"><span>06</span><h3>Team leadership</h3><p>Coordinated the team responsible for developing and executing the experience.</p></li>
          <li class="ia-r" style="--d:.36s"><span>07</span><h3>Client coordination</h3><p>Managed feedback, iterations, reviews and alignment.</p></li>
          <li class="ia-r" style="--d:.42s"><span>08</span><h3>Execution</h3><p>Stayed involved across the lifecycle rather than handing off the work after strategy or concept development.</p></li>
        </ol>
      </div>
    </section>

    <!-- ================= 23 · HUMAN EXPERIENCE ================= -->
    <section class="ia-section" id="human" aria-labelledby="h-human">
      <div class="ia-wrap">
        <div class="ia-cols ia-cols--eq" style="align-items:center">
          <figure class="ia-fig ia-r ia-r--img">
            <div class="ia-fig__frame">
              <i class="ia-fig__tick"></i><i class="ia-fig__tick"></i><i class="ia-fig__tick"></i><i class="ia-fig__tick"></i>
              <img src="/assets/media/indian-army/ia-18.webp" srcset="/assets/media/indian-army/ia-18-960.webp 960w, /assets/media/indian-army/ia-18.webp 1672w" sizes="(min-width: 900px) 50vw, 100vw" width="1672" height="941" alt="A trainee seated in the training room holding a VR headset, looking up, with the training wall behind" loading="lazy" decoding="async">
            </div>
            <figcaption><b>The trainee</b></figcaption>
          </figure>
          <div class="ia-cols__side">
            <span class="ia-label ia-r"><b>23</b> Human experience</span>
            <h2 class="ia-h2 ia-r" id="h-human" style="--d:.08s">Behind every system <em>is a trainee.</em></h2>
            <p class="ia-lede ia-r" style="--d:.14s">The technology was only valuable if it made the training experience understandable, immersive and assessable for the person using it.</p>
            <p class="ia-p ia-r" style="--d:.2s">The work therefore had to operate at two levels simultaneously: <strong>the individual trainee experience</strong>, and <strong>the instructor's ability to understand and guide that experience.</strong></p>
          </div>
        </div>
      </div>
    </section>

    <!-- ================= 24 · IMMERSION → IMPACT ================= -->
    <section class="ia-section ia-section--flush" id="impact-visual" aria-labelledby="h-imm">
      <figure class="ia-fig ia-bleed ia-parallax ia-r ia-r--img">
        <div class="ia-fig__frame">
          <img src="/assets/media/indian-army/ia-19.webp" srcset="/assets/media/indian-army/ia-19-960.webp 960w, /assets/media/indian-army/ia-19.webp 1672w" sizes="100vw" width="1672" height="941" alt="From immersion to impact: trainees in the VR room on the left give way to personnel and a tank on real terrain on the right" loading="lazy" decoding="async">
        </div>
        <div class="ia-bleed__overlay ia-bleed__overlay--below">
          <div class="ia-wrap">
            <span class="ia-label ia-r"><b>24</b> From immersion to impact</span>
            <h2 class="ia-h-big ia-r" id="h-imm" style="--d:.08s;margin-top:14px;max-width:16ch">Trained here. <em>Ready for the next stage.</em></h2>
          </div>
        </div>
        <figcaption><b>From immersion to impact</b></figcaption>
      </figure>
    </section>

    <!-- ================= 25 · IMPACT ================= -->
    <section class="ia-section ia-section--navy" id="outcome" data-chapter="Outcome" aria-labelledby="h-impact">
      <div class="ia-wrap">
        <header class="ia-head ia-head--split">
          <span class="ia-label ia-r"><b>25</b> Impact</span>
          <h2 class="ia-h2 ia-r" id="h-impact">What the system <em>created.</em></h2>
          <p class="ia-lede ia-r" style="--d:.1s">Six qualities the training environment brought to Army personnel and their instructors.</p>
        </header>
        <ol class="ia-principles">
          <li class="ia-r"><span>01</span><h3>Immersive</h3><p>Training moved beyond passive observation into active participation.</p></li>
          <li class="ia-r" style="--d:.06s"><span>02</span><h3>Repeatable</h3><p>The digital environment provided a space for repeated practice.</p></li>
          <li class="ia-r" style="--d:.12s"><span>03</span><h3>Connected</h3><p>Individual trainee experiences remained visible to the instructor.</p></li>
          <li class="ia-r" style="--d:.18s"><span>04</span><h3>Assessable</h3><p>Qualification testing became part of the immersive environment.</p></li>
          <li class="ia-r" style="--d:.24s"><span>05</span><h3>Progressive</h3><p>Training could move from digital practice toward physical training.</p></li>
          <li class="ia-r" style="--d:.3s"><span>06</span><h3>Systemic</h3><p>The project connected people, content, technology, instruction and qualification into one training ecosystem.</p></li>
        </ol>
      </div>
    </section>

    <!-- ================= 26 · THE BIG IDEA ================= -->
    <section class="ia-section ia-grid-bg ia-bigidea" id="design-philosophy" aria-labelledby="h-dp">
      <div class="ia-wrap">
        <span class="ia-label ia-r"><b>26</b> The role of immersion</span>
        <div class="ia-bigidea__grid" style="margin-top:22px">
          <h2 class="ia-display ia-r" id="h-dp" style="--d:.08s">Train before the battlefield.</h2>
          <p class="ia-lede ia-r" style="--d:.16s">The project created a digital training and qualification layer between learning and physical training — allowing personnel to learn, practise and demonstrate competency within an immersive environment before progressing further.</p>
        </div>
      </div>
    </section>

    <!-- ================= 27 · PROJECT INFORMATION ================= -->
    <section class="ia-section ia-section--graphite ia-section--tight" id="summary" aria-labelledby="h-summary">
      <div class="ia-wrap">
        <div class="ia-cols">
          <div class="ia-cols__side is-sticky">
            <span class="ia-label ia-r"><b>27</b> Project information</span>
            <h2 class="ia-h2 ia-r" id="h-summary" style="--d:.08s">At a glance.</h2>
          </div>
          <dl class="ia-facts ia-r">
            <div><dt>Client</dt><dd>Indian Army</dd></div>
            <div><dt>Project</dt><dd>Immersive Training &amp; Qualification Ecosystem</dd></div>
            <div><dt>Platforms</dt><dd>T-70 + T-90</dd></div>
            <div><dt>Format</dt><dd>Immersive VR training</dd></div>
            <div><dt>Facility</dt><dd>15 high-end training stations in a dedicated training room</dd></div>
            <div><dt>Instructor view</dt><dd>Centralised high-end display</dd></div>
            <div><dt>Qualification</dt><dd>Testing within the immersive environment</dd></div>
            <div><dt>Progression</dt><dd>Digital training → qualification → physical training</dd></div>
            <div><dt>Stakeholders</dt><dd>Major (daily) · Colonel (weekly) · Brigadier-level approval</dd></div>
            <div><dt>Role</dt><dd>Experience strategy / creative direction / immersive experience / content development / stakeholder management / team coordination / execution</dd></div>
          </dl>
        </div>
      </div>
    </section>

    <!-- ================= 28 · CLOSING ================= -->
    <section class="ia-section ia-section--flush ia-closing" id="closing" aria-labelledby="h-closing">
      <div class="ia-wrap" style="padding:var(--ia-section) 0 clamp(40px,5vw,64px)">
        <div class="ia-cols">
          <div class="ia-cols__side">
            <span class="ia-label ia-r"><b>28</b> Closing</span>
            <h2 class="ia-h-big ia-r" id="h-closing" style="--d:.08s;max-width:14ch">Learn. Practice. Qualify. <em>Prepare.</em></h2>
          </div>
          <div>
            <p class="ia-lede ia-r">The Indian Army project demonstrated how immersive technology can become part of a larger training ecosystem — connecting individual learning, instructor visibility, qualification and progression toward physical training.</p>
            <p class="ia-p ia-r" style="--d:.08s;margin-top:1.4em">The result was not simply a VR experience. It was a structured bridge between digital immersion and the next stage of training.</p>
          </div>
        </div>
      </div>
      <figure class="ia-fig ia-bleed ia-parallax ia-r ia-r--img">
        <div class="ia-fig__frame">
          <img src="/assets/media/indian-army/ia-20.webp" srcset="/assets/media/indian-army/ia-20-960.webp 960w, /assets/media/indian-army/ia-20.webp 1672w" sizes="100vw" width="1672" height="941" alt="Closing frame: a tank and personnel on high-altitude terrain at dusk under the words 'Train before the battlefield'" loading="lazy" decoding="async">
        </div>
        <div class="ia-bleed__overlay">
          <div class="ia-wrap ia-closing__panel">
            <div>
              <span class="ia-label ia-r">Final statement</span>
              <p class="ia-display ia-r" style="--d:.08s;margin-top:14px;max-width:12ch">Train before the battlefield.</p>
              <div class="ia-closing__tag ia-r" style="--d:.16s"><span>Learn</span><span>Practice</span><span>Qualify</span><span>Prepare</span></div>
            </div>
            <div class="ia-closing__cta ia-r" style="--d:.2s">
              <span class="ia-label ia-label--bare">Continue</span>
              <a class="ia-btn ia-btn--solid" href="/contact/">Start a conversation <svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M2 8h11M9 3.5 13.5 8 9 12.5" stroke="currentColor" stroke-width="1.6"/></svg></a>
              <a class="ia-btn" href="/case-studies/orange-business/">Next case study · Orange Business <svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M2 8h11M9 3.5 13.5 8 9 12.5" stroke="currentColor" stroke-width="1.6"/></svg></a>
            </div>
          </div>
        </div>
        <figcaption class="visually-hidden">Train before the battlefield.</figcaption>
      </figure>
      <div class="ia-wrap">
        <div class="ia-closing__foot">
          <span>Indian Army · Immersive Training &amp; Qualification Ecosystem</span>
          <span>Experience strategy · creative direction · immersive experience · content · stakeholders · team · execution</span>
          <a href="/case-studies/">All case studies</a>
        </div>
      </div>
    </section>

  `;if(n!=null&&n.image){const o=k(String(n.image));o&&l.includes("src=")&&!l.includes(o)&&(l=l.replace(/src="\/[^"]+\.(webp|jpg|jpeg|png)"/,`src="${o}"`))}const h=n?' data-cms-source="cms"':' data-cms-source="fallback"';return e.jsx("div",{dangerouslySetInnerHTML:{__html:`<div${h}>${l}</div>`}})}function D(){return e.jsx("svg",{width:"17",height:"17",viewBox:"0 0 18 18",fill:"none","aria-hidden":"true",children:e.jsx("path",{d:"m3 3 12 12M15 3 3 15",stroke:"currentColor",strokeWidth:"1.7",strokeLinecap:"round"})})}function F(){return I(),E(),A(),R(),L(),z(),S(),C(),P("/case-studies/indian-army/",{title:"Indian Army — Abhijeet Varghese"}),N(),e.jsxs(e.Fragment,{children:[e.jsx(j,{activePath:"/case-studies/indian-army/"}),e.jsx("a",{className:"page-close",href:"/case-studies/","data-history-close":"","aria-label":"Back to Case Studies",children:e.jsx(D,{})}),e.jsx("main",{id:"main",className:"indian-army-case",children:e.jsx(V,{})}),e.jsx(q,{})]})}const _=document.getElementById("root");if(!_)throw new Error("Indian Army mount target is missing.");M(_).render(e.jsx(F,{}));
