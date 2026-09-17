"""Generate the Insights listing as a disciplined executive report.
Static semantic content comes first; all motion and decision controls are progressive enhancement.
"""
from pathlib import Path

ROOT = Path('/home/user/abhijeet-varghese-website/abhijeetvarghese')
src = (ROOT / 'insights/index.html').read_text(encoding='utf-8')
body = src.index('<body id="top">')
main = src.index('<main id="main"')
header = src[body:main]
fstart = src.index('<footer class=')
fend = src.index('<script src="/js/main.js', fstart)
footer = src[fstart:fend]
astart = src.index('<script>\n/* AV OS first-party analytics')
aend = src.index('</script>', astart) + 9
analytics = src[astart:aend]

head = '''<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <meta name="view-transition" content="same-origin">
  <title>Insights | Experience Design &amp; Innovation Leadership — Abhijeet Varghese</title>
  <meta name="description" content="Strategic insights on human-centred technology, AI, memorable experiences and enterprise transformation by Abhijeet Varghese.">
  <meta name="keywords" content="experience design insights, innovation leadership, human-centred design, AI creativity, enterprise experience design, creative strategy">
  <meta name="robots" content="index, follow, max-image-preview:large">
  <meta name="theme-color" content="#080F22">
  <link rel="canonical" href="https://abhijeetvarghese.com/insights/">
  <link rel="preload" href="/assets/fonts/inter-tight-normal.woff2?v=4" as="font" type="font/woff2" crossorigin>
  <meta property="og:type" content="website"><meta property="og:url" content="https://abhijeetvarghese.com/insights/"><meta property="og:site_name" content="Abhijeet Varghese"><meta property="og:title" content="Insights | Experience Design &amp; Innovation Leadership"><meta property="og:description" content="Strategic insights on people, technology and enterprise experience."><meta property="og:image" content="https://abhijeetvarghese.com/assets/og/insights.jpg"><meta property="og:image:type" content="image/jpeg"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:image:alt" content="Insights by Abhijeet Varghese">
  <meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="Insights | Experience Design &amp; Innovation Leadership"><meta name="twitter:description" content="Strategic insights on people, technology and enterprise experience."><meta name="twitter:image" content="https://abhijeetvarghese.com/assets/og/insights.jpg">
  <link rel="icon" type="image/png" sizes="32x32" href="/assets/icons/favicon-32.png"><link rel="apple-touch-icon" href="/assets/icons/apple-touch-icon.png"><link rel="manifest" href="/manifest.webmanifest">
  <link rel="stylesheet" href="/css/styles.css?v=4.6.1"><link rel="stylesheet" href="/css/elevate.css?v=4.4.1"><link rel="stylesheet" href="/css/insights-hub.css?v=11.0.0">
  <script>document.documentElement.className += ' js';setTimeout(function(){document.documentElement.className += ' reveal-failsafe';},2600);</script>
  <script type="application/ld+json">{"@context":"https://schema.org","@graph":[{"@type":"CollectionPage","@id":"https://abhijeetvarghese.com/insights/","url":"https://abhijeetvarghese.com/insights/","name":"Insights | Experience Design & Innovation Leadership","description":"Strategic insights on people, technology and enterprise experience.","inLanguage":"en","mainEntity":{"@type":"ItemList","name":"Insights by Abhijeet Varghese","numberOfItems":4,"itemListElement":[{"@type":"ListItem","position":1,"url":"https://abhijeetvarghese.com/insights/technology-should-feel-human/","name":"Technology Should Feel Human"},{"@type":"ListItem","position":2,"url":"https://abhijeetvarghese.com/insights/ai-isnt-replacing-creativity/","name":"AI Isn’t Replacing Creativity"},{"@type":"ListItem","position":3,"url":"https://abhijeetvarghese.com/insights/designing-experiences-people-remember/","name":"Designing Experiences People Remember"},{"@type":"ListItem","position":4,"url":"https://abhijeetvarghese.com/insights/why-enterprise-experiences-fail/","name":"Why Enterprise Experiences Fail"}]}},{"@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"name":"Home","item":"https://abhijeetvarghese.com/"},{"@type":"ListItem","position":2,"name":"Insights","item":"https://abhijeetvarghese.com/insights/"}]}]}</script>
</head>
'''

main_html = '''<main id="main" class="ibr" data-insights-report>
  <section class="ibr-hero" aria-labelledby="insights-title">
    <div class="container ibr-hero__inner">
      <div class="ibr-kicker" data-ibr-reveal><span>Insights</span><i aria-hidden="true"></i><span>Experience strategy</span><span class="ibr-kicker__year">2026</span></div>
      <div class="ibr-hero__grid">
        <div>
          <p class="ibr-eyebrow" data-ibr-reveal>Executive perspectives</p>
          <h1 id="insights-title" data-ibr-reveal>Thinking Beyond the Output.</h1>
        </div>
        <div class="ibr-hero__summary" data-ibr-reveal>
          <p>Useful experience is not a final layer. It is the result of decisions that connect people, purpose, creativity, technology and the operating system behind the work.</p>
          <a href="#essays">Read the four perspectives <span aria-hidden="true">↓</span></a>
        </div>
      </div>
      <dl class="ibr-hero__facts" data-ibr-reveal>
        <div><dt>01 — 04</dt><dd>Four strategic perspectives</dd></div>
        <div><dt>54 min</dt><dd>Total reading time</dd></div>
        <div><dt>One question</dt><dd>What should improve for people?</dd></div>
      </dl>
    </div>
  </section>

  <section class="ibr-premise" aria-labelledby="premise-title">
    <div class="container ibr-premise__grid">
      <div data-ibr-reveal><p class="ibr-eyebrow">The premise</p><h2 id="premise-title">The visible output is only a fraction of the <em>decision.</em></h2></div>
      <div class="ibr-premise__copy" data-ibr-reveal><p>When a solution begins with a deliverable, the work can look finished without being useful. Strong experience strategy starts further upstream: with the human outcome, the role the solution needs to play, and the conditions required to make it real.</p><p>These perspectives are a practical point of view for leaders navigating that work.</p></div>
    </div>
  </section>

  <section class="ibr-lenses" aria-labelledby="lenses-title">
    <div class="container">
      <div class="ibr-lenses__intro" data-ibr-reveal><div><p class="ibr-eyebrow">Decision lenses</p><h2 id="lenses-title">A clear question before every answer.</h2></div><p>Use the lenses to frame the decision. Each perspective in the series develops one of these areas in depth.</p></div>
      <div class="ibr-lenses__control" data-ibr-reveal>
        <div class="ibr-lenses__tabs" role="tablist" aria-label="Experience decision lenses">
          <button id="brief-human" type="button" role="tab" aria-selected="true" aria-controls="brief-panel-human" tabindex="0" data-decision="human"><b>01</b><span>Human outcome</span></button>
          <button id="brief-judgment" type="button" role="tab" aria-selected="false" aria-controls="brief-panel-judgment" tabindex="-1" data-decision="judgment"><b>02</b><span>Creative judgment</span></button>
          <button id="brief-memory" type="button" role="tab" aria-selected="false" aria-controls="brief-panel-memory" tabindex="-1" data-decision="memory"><b>03</b><span>Meaning &amp; memory</span></button>
          <button id="brief-system" type="button" role="tab" aria-selected="false" aria-controls="brief-panel-system" tabindex="-1" data-decision="system"><b>04</b><span>Connected delivery</span></button>
        </div>
        <div class="ibr-lenses__panels">
          <section id="brief-panel-human" role="tabpanel" aria-labelledby="brief-human"><p class="ibr-panel__index">01 / Start with the person</p><strong>What should become clearer, easier or more possible for a person?</strong><p>Human outcome gives a solution a meaningful measure beyond completion.</p></section>
          <section id="brief-panel-judgment" role="tabpanel" aria-labelledby="brief-judgment" hidden><p class="ibr-panel__index">02 / Own the decision</p><strong>What deserves to exist—and who is accountable for that call?</strong><p>When production becomes abundant, judgment, context and responsibility become more valuable.</p></section>
          <section id="brief-panel-memory" role="tabpanel" aria-labelledby="brief-memory" hidden><p class="ibr-panel__index">03 / Design for recall</p><strong>What will a person take with them once the moment has ended?</strong><p>Attention gains value when an experience gives it meaning and leaves a durable memory.</p></section>
          <section id="brief-panel-system" role="tabpanel" aria-labelledby="brief-system" hidden><p class="ibr-panel__index">04 / Make it hold up</p><strong>What must align behind the scenes for the experience to feel simple?</strong><p>People encounter one organisation—not its functions, handoffs and internal boundaries.</p></section>
        </div>
      </div>
    </div>
  </section>

  <section class="ibr-essays" id="essays" aria-labelledby="essays-title">
    <div class="container ibr-essays__head">
      <div data-ibr-reveal><p class="ibr-eyebrow">The series</p><h2 id="essays-title">Four perspectives for leading through complexity.</h2></div>
      <p data-ibr-reveal>Read independently, or follow the sequence from human outcome to connected enterprise delivery.</p>
    </div>
    <nav class="ibr-rail" aria-label="Insights navigation">
      <div class="container"><span class="ibr-rail__title">In this series</span><a href="#insight-01" class="is-active" aria-current="location"><b>01</b><span>Human</span></a><a href="#insight-02"><b>02</b><span>AI</span></a><a href="#insight-03"><b>03</b><span>Memory</span></a><a href="#insight-04"><b>04</b><span>Enterprise</span></a></div>
    </nav>
    <div class="ibr-essay-list">
      <article class="ibr-essay" id="insight-01" data-insight="01" aria-labelledby="insight-01-title">
        <div class="container ibr-essay__grid"><header data-ibr-reveal><b>01</b><p>Human-centred technology</p><span>13 min read</span></header><div class="ibr-essay__copy" data-ibr-reveal><h2 id="insight-01-title"><a href="/insights/technology-should-feel-human/">Technology should feel human.</a></h2><p class="ibr-essay__thesis">The best technology does not make people feel like they are using technology.</p><p class="ibr-essay__detail">A perspective on human-centred design, immersive experiences, AI, interaction and technology as an extension of human capability.</p><a class="ibr-essay__link" href="/insights/technology-should-feel-human/">Read the perspective <span aria-hidden="true">→</span></a></div><figure class="ibr-essay__image" data-ibr-reveal="image"><picture><source srcset="/assets/technology-should-feel-human-hero-768.webp 768w, /assets/technology-should-feel-human-hero.webp 1376w" sizes="(max-width: 720px) calc(100vw - 40px), (max-width: 1200px) 42vw, 540px" type="image/webp"><img src="/assets/technology-should-feel-human-hero.jpg" alt="Human-centred technology integrated naturally into a physical and digital experience." width="1376" height="768" loading="lazy" decoding="async"></picture></figure></div>
      </article>
      <article class="ibr-essay ibr-essay--reverse" id="insight-02" data-insight="02" aria-labelledby="insight-02-title">
        <div class="container ibr-essay__grid"><header data-ibr-reveal><b>02</b><p>AI &amp; creative leadership</p><span>14 min read</span></header><div class="ibr-essay__copy" data-ibr-reveal><h2 id="insight-02-title"><a href="/insights/ai-isnt-replacing-creativity/">AI is not replacing creativity.</a></h2><p class="ibr-essay__thesis">AI can generate more possibilities. Creativity decides what deserves to exist.</p><p class="ibr-essay__detail">As production becomes faster and more accessible, direction, taste, context, responsibility and point of view become even more valuable.</p><a class="ibr-essay__link" href="/insights/ai-isnt-replacing-creativity/">Read the perspective <span aria-hidden="true">→</span></a></div><figure class="ibr-essay__image" data-ibr-reveal="image"><picture><source srcset="/assets/ai-isnt-replacing-creativity-hero-768.webp 768w, /assets/ai-isnt-replacing-creativity-hero.webp 1376w" sizes="(max-width: 720px) calc(100vw - 40px), (max-width: 1200px) 42vw, 540px" type="image/webp"><img src="/assets/ai-isnt-replacing-creativity-hero.jpg" alt="Creative decision-maker shaping AI-generated possibilities through human judgment and direction." width="1376" height="768" loading="lazy" decoding="async"></picture></figure></div>
      </article>
      <article class="ibr-essay" id="insight-03" data-insight="03" aria-labelledby="insight-03-title">
        <div class="container ibr-essay__grid"><header data-ibr-reveal><b>03</b><p>Experience &amp; memory</p><span>12 min read</span></header><div class="ibr-essay__copy" data-ibr-reveal><h2 id="insight-03-title"><a href="/insights/designing-experiences-people-remember/">Designing experiences people remember.</a></h2><p class="ibr-essay__thesis">The goal of experience design is not to make people see more. It is to make something worth remembering.</p><p class="ibr-essay__detail">An exploration of storytelling, interaction, emotion, immersion and the deliberate work of creating a meaningful memory.</p><a class="ibr-essay__link" href="/insights/designing-experiences-people-remember/">Read the perspective <span aria-hidden="true">→</span></a></div><figure class="ibr-essay__image" data-ibr-reveal="image"><picture><source srcset="/assets/designing-experiences-people-remember-hero-768.webp 768w, /assets/designing-experiences-people-remember-hero.webp 1376w" sizes="(max-width: 720px) calc(100vw - 40px), (max-width: 1200px) 42vw, 540px" type="image/webp"><img src="/assets/designing-experiences-people-remember-hero.jpg" alt="Immersive experience designed around human memory, emotion and discovery." width="1376" height="768" loading="lazy" decoding="async"></picture></figure></div>
      </article>
      <article class="ibr-essay ibr-essay--reverse" id="insight-04" data-insight="04" aria-labelledby="insight-04-title">
        <div class="container ibr-essay__grid"><header data-ibr-reveal><b>04</b><p>Enterprise transformation</p><span>15 min read</span></header><div class="ibr-essay__copy" data-ibr-reveal><h2 id="insight-04-title"><a href="/insights/why-enterprise-experiences-fail/">Why enterprise experiences fail.</a></h2><p class="ibr-essay__thesis">The problem is rarely a lack of technology. It is the distance between what an organisation intends and what people actually experience.</p><p class="ibr-essay__detail">A human-centred approach to enterprise experience, organisational complexity, stakeholder alignment and connected delivery.</p><a class="ibr-essay__link" href="/insights/why-enterprise-experiences-fail/">Read the perspective <span aria-hidden="true">→</span></a></div><figure class="ibr-essay__image" data-ibr-reveal="image"><picture><source srcset="/assets/why-enterprise-experiences-fail-hero-768.webp 768w, /assets/why-enterprise-experiences-fail-hero.webp 1376w" sizes="(max-width: 720px) calc(100vw - 40px), (max-width: 1200px) 42vw, 540px" type="image/webp"><img src="/assets/why-enterprise-experiences-fail-hero.jpg" alt="Complex enterprise systems working behind a simple human-centred experience." width="1376" height="768" loading="lazy" decoding="async"></picture></figure></div>
      </article>
    </div>
  </section>

  <section class="ibr-practice" aria-labelledby="practice-title">
    <div class="container ibr-practice__grid"><div data-ibr-reveal><p class="ibr-eyebrow">From perspective to practice</p><h2 id="practice-title">Strategy earns its value in the delivery.</h2></div><div class="ibr-practice__copy" data-ibr-reveal><p>Experience strategy matters when it changes how a team makes decisions, joins the work and protects the intended outcome all the way through delivery.</p><a href="/case-studies/">See the work in practice <span aria-hidden="true">→</span></a></div><ol data-ibr-reveal><li><b>01</b><strong>Clarify the outcome</strong><p>Name the change people should experience.</p></li><li><b>02</b><strong>Align the choices</strong><p>Give strategy, content, design and technology one direction.</p></li><li><b>03</b><strong>Build for reality</strong><p>Make the experience durable in the world, not only in a deck.</p></li></ol></div>
  </section>

  <section class="ibr-contact" aria-labelledby="contact-title"><div class="container ibr-contact__grid"><div data-ibr-reveal><p class="ibr-eyebrow">Start with the question</p><h2 id="contact-title">Have a complex challenge worth making clearer?</h2></div><div data-ibr-reveal><p>The most useful work starts before the answer is known. Start with the human outcome, then shape the experience and the system around it.</p><a href="/contact/">Start a conversation <span aria-hidden="true">→</span></a></div></div></section>
</main>
'''

scripts = '<script src="/js/main.js?v=4.6.0" defer></script><script src="/js/elevate.js?v=4.4.1" defer></script><script src="/js/insights-hub.js?v=11.0.0" defer></script>'
output = head + header + main_html + footer + scripts + analytics + '</body></html>\n'
(ROOT / 'insights/index.html').write_text(output, encoding='utf-8')
(ROOT / 'insights.html').write_text('<!doctype html><html lang="en"><head><meta charset="utf-8"><meta http-equiv="refresh" content="0; url=/insights/"><link rel="canonical" href="https://abhijeetvarghese.com/insights/"><meta name="robots" content="noindex, follow"><title>Insights</title></head><body><p>This page has moved to <a href="/insights/">Insights</a>.</p></body></html>\n', encoding='utf-8')
print('Built executive Insights report v11:', len(output), 'bytes')
