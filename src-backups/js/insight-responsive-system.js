/* Shared Insight responsive system — optional, native-first enhancements for all four detail pages. */
(function(){
  'use strict';
  var root=document.querySelector('main.ht1, main.ai2, main.me2, main.ee4');
  if(!root)return;
  var reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var article={ht1:['01','Human'],ai2:['02','AI'],me2:['03','Memory'],ee4:['04','Enterprise']};
  var kind=Object.keys(article).find(function(key){return root.classList.contains(key)});
  var detail=article[kind]||['','Insight'];

  // The compact progress control is a reading orientation aid, never a replacement for native headings/navigation.
  var progress=document.createElement('div');
  progress.className='irs-progress';
  progress.setAttribute('aria-label','Reading progress');
  progress.innerHTML='<strong>'+detail[0]+'</strong><span>'+detail[1]+' insight</span><span data-irs-section>Overview</span>';
  root.insertBefore(progress,root.firstChild);

  // Wide frameworks remain within a deliberately contained, keyboard-scrollable canvas on small screens.
  var wide=root.querySelectorAll('.ht1-flow,.ai2-flow,.me2-system__flow,.ee4-framework__figure,.ee4-blueprint__figure');
  wide.forEach(function(el,index){
    el.classList.add('irs-scroll');
    el.tabIndex=0;
    el.setAttribute('role','region');
    var heading=el.closest('section')&&el.closest('section').querySelector('h2,h3');
    var label=(heading&&heading.textContent.trim())||'Interactive framework '+(index+1);
    el.setAttribute('aria-label',label+' diagram. Use left and right arrow keys to explore.');
    el.addEventListener('keydown',function(event){
      var delta=event.key==='ArrowRight'?Math.min(220,el.clientWidth*.72):event.key==='ArrowLeft'?-Math.min(220,el.clientWidth*.72):0;
      if(!delta)return;
      event.preventDefault();el.scrollBy({left:delta,behavior:reduced?'auto':'smooth'});
    });
    var hint=document.createElement('span');hint.className='irs-scroll-hint';hint.textContent='Swipe or use arrow keys to explore';hint.setAttribute('aria-hidden','true');
    el.insertAdjacentElement('afterend',hint);
  });

  // Update orientation only while genuine content headings cross the reading line.
  if('IntersectionObserver' in window){
    var label=progress.querySelector('[data-irs-section]');
    var headings=[].slice.call(root.querySelectorAll('.ht1-prose h2,.ai2-prose h2,.me2-prose h2,.ee4-prose h2,.ht1-framework h3,.ai2-framework h3,.me2-system h3,.ee4-framework h3'));
    new IntersectionObserver(function(entries){entries.forEach(function(entry){if(entry.isIntersecting){label.textContent=entry.target.textContent.trim().replace(/\s+/g,' ').slice(0,34)}})},{rootMargin:'-22% 0px -67% 0px',threshold:0}).observe(root.querySelector('h1'));
    var observer=new IntersectionObserver(function(entries){entries.forEach(function(entry){if(entry.isIntersecting)label.textContent=entry.target.textContent.trim().replace(/\s+/g,' ').slice(0,34)})},{rootMargin:'-22% 0px -67% 0px',threshold:0});
    headings.forEach(function(heading){observer.observe(heading)});
  }

  // Image failures retain the reading structure and communicate an intentional fallback rather than a broken void.
  root.querySelectorAll('img').forEach(function(image){image.addEventListener('error',function(){var holder=image.closest('figure')||image.parentElement; if(holder)holder.classList.add('is-media-fallback')})});

  // A tiny, optional continuity cue for hub → insight navigation. Navigation remains immediate and native for modified clicks.
  if(!reduced){document.addEventListener('click',function(event){var link=event.target.closest('a[href^="/insights/"]');if(!link||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey||link.target)return;document.documentElement.classList.add('irs-page-leaving')})}
})();
