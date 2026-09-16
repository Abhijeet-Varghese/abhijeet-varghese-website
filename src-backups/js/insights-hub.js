/* Insights v8: native-first navigation; optional rail reflects the active insight. */
(function(){
  'use strict';
  var hub=document.querySelector('.ih8');
  if(!hub||!('IntersectionObserver' in window))return;
  var rail=hub.querySelector('.ih8-rail'), scope=hub.querySelector('.ih8-hub');
  function active(id){[].slice.call(hub.querySelectorAll('.ih8-rail a')).forEach(function(link){var on=link.getAttribute('href')==='#'+id;link.classList.toggle('is-active',on);if(on)link.setAttribute('aria-current','location');else link.removeAttribute('aria-current')})}
  if(rail&&scope)new IntersectionObserver(function(entries){rail.classList.toggle('is-visible',entries[0].isIntersecting)},{rootMargin:'0px 0px -15% 0px',threshold:0}).observe(scope);
  var observer=new IntersectionObserver(function(entries){entries.forEach(function(entry){if(entry.isIntersecting&&entry.intersectionRatio>.28)active(entry.target.id)})},{rootMargin:'-20% 0px -38% 0px',threshold:[.29,.6]});
  [].slice.call(hub.querySelectorAll('[data-insight]')).forEach(function(el){observer.observe(el)});
})();
