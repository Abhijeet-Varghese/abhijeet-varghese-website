(function(){"use strict";var reduced=window.matchMedia("(prefers-reduced-motion: reduce)").matches;var fine=window.matchMedia("(hover: hover) and (pointer: fine)").matches;var wide=window.matchMedia("(min-width: 901px)");var $=function(s,c){return(c||document).querySelector(s);};var $$=function(s,c){return Array.prototype.slice.call((c||document).querySelectorAll(s));};var clamp=function(v,a,b){return v<a?a:v>b?b:v;};var openTargets=$$("[data-pf-open]");var liveTargets=$$("[data-pf-live]");if("IntersectionObserver"in window){var openIO=new IntersectionObserver(function(entries){entries.forEach(function(e){if(e.isIntersecting){e.target.classList.add("is-open");openIO.unobserve(e.target);}});},{threshold:0.22,rootMargin:"0px 0px -8% 0px"});openTargets.forEach(function(el){openIO.observe(el);});var liveIO=new IntersectionObserver(function(entries){entries.forEach(function(e){e.target.classList.toggle("is-live",e.isIntersecting);});},{threshold:0.05});liveTargets.forEach(function(el){liveIO.observe(el);});}else{openTargets.forEach(function(el){el.classList.add("is-open");});liveTargets.forEach(function(el){el.classList.add("is-live");});}
var overture=$(".pf-overture");if(overture){requestAnimationFrame(function(){overture.classList.add("is-open");});}
var YT_ID="R1O0VanJfTo";var players=$$("[data-pf-player]");function warmYouTube(){if(document.getElementById("pf-yt-pre"))return;["https://www.youtube-nocookie.com","https://www.youtube.com"].forEach(function(o){var l=document.createElement("link");l.id="pf-yt-pre";l.rel="preconnect";l.href=o;l.crossOrigin="anonymous";document.head.appendChild(l);});}
function mountPlayer(host,autoplay){var id=host.getAttribute("data-yt")||YT_ID;var frame=document.createElement("iframe");frame.className="pf-player__frame";frame.title=host.getAttribute("data-yt-title")||"Portfolio reel — Abhijeet Varghese";frame.src="https://www.youtube-nocookie.com/embed/"+id+"?rel=0&modestbranding=1&playsinline=1&hl=en&autoplay="+(autoplay?1:0);frame.setAttribute("allow","accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share");frame.setAttribute("allowfullscreen","true");frame.setAttribute("referrerpolicy","strict-origin-when-cross-origin");frame.loading="lazy";host.innerHTML="";host.appendChild(frame);host.classList.add("is-playing");if(autoplay){try{frame.focus();}catch(err){}}}
players.forEach(function(host){var poster=$(".pf-player__poster",host);if(!poster){return;}
poster.addEventListener("click",function(){warmYouTube();mountPlayer(host,true);});});var film=$(".pf-film");if(film&&"IntersectionObserver"in window){var warmIO=new IntersectionObserver(function(entries){if(entries[0].isIntersecting){warmYouTube();warmIO.disconnect();}},{rootMargin:"600px 0px"});warmIO.observe(film);}
var hSec=$(".pf-runway");var hPin=hSec&&$("[data-pf-hpin]",hSec);var hTrack=hSec&&$("[data-pf-htrack]",hSec);var hView=hSec&&$("[data-pf-hviewport]",hSec);var hBar=hSec&&$("[data-pf-hbar]",hSec);var hCount=hSec&&$("[data-pf-hcount]",hSec);var hScenes=hTrack?$$(".pf-scene",hTrack):[];var hProjects=hTrack?$$(".pf-card",hTrack):[];var hPinned=false;var hTravel=0;var hX=0;var hRaf=0;var hCountNum=-1;$$("[data-pf-htotal], [data-pf-htotal2]").forEach(function(el){el.textContent=String(hProjects.length).padStart(2,"0");});function hTargetFrom(){var r=hSec.getBoundingClientRect();var travel=hSec.offsetHeight-window.innerHeight;var p=travel>0?clamp(-r.top/travel,0,1):0;return-p*hTravel;}
function hKick(){if(!hRaf){hRaf=requestAnimationFrame(hFrame);}}
function hFrame(){hRaf=0;if(!hSec||!hTrack||!hPin){return;}
if(!hPinned){hUpdate();return;}
var vh=window.innerHeight;var r=hSec.getBoundingClientRect();if(r.bottom<-vh*0.5||r.top>vh*1.5){hX=hTargetFrom();hTrack.style.transform="translate3d("+hX.toFixed(1)+"px,0,0)";for(var k=0;k<hScenes.length;k++){hScenes[k].style.setProperty("--f","1");hScenes[k].style.setProperty("--rel","0");}
return;}
var target=hTargetFrom();var diff=target-hX;var settled=Math.abs(diff)<0.35;hX=settled?target:hX+diff*0.18;hTrack.style.transform="translate3d("+hX.toFixed(1)+"px,0,0)";var travel=hSec.offsetHeight-window.innerHeight;if(hBar){hBar.style.transform="scaleX("+(travel>0?clamp(-r.top/travel,0,1):0).toFixed(4)+")";}
var stageW=hPin.clientWidth||1;var mid=stageW/2;var nearIdx=0,nearBest=Infinity;for(var i=0;i<hScenes.length;i++){var el=hScenes[i];var cx=el.offsetLeft+el.offsetWidth/2+hX;var rel=(cx-mid)/stageW;var f=1-clamp(Math.abs(rel)/0.62,0,1);el.style.setProperty("--rel",rel.toFixed(4));el.style.setProperty("--f",f.toFixed(4));var d=Math.abs(cx-mid);if(d<nearBest){nearBest=d;nearIdx=i;}}
hSetCount(nearIdx);if(!settled){hKick();}}
function hUpdate(){if(!hSec||!hTrack){return;}
if(!hPinned){if(!hView){return;}
var maxX=hView.scrollWidth-hView.clientWidth;var q=maxX>0?hView.scrollLeft/maxX:0;if(hBar){hBar.style.transform="scaleX("+q.toFixed(4)+")";}
var idx=0,best=Infinity,centre=hView.scrollLeft+hView.clientWidth/2;for(var i=0;i<hScenes.length;i++){var d=Math.abs(hScenes[i].offsetLeft+hScenes[i].offsetWidth/2-centre);if(d<best){best=d;idx=i;}}
hSetCount(idx);return;}
hKick();}
function hSetCount(sceneIndex){if(!hCount||!hProjects.length){return;}
var scene=hScenes[sceneIndex];if(!scene){return;}
var n=hProjects.indexOf(scene);var num=n<0?(sceneIndex===0?1:hProjects.length):n+1;if(num===hCountNum){return;}
hCountNum=num;hCount.textContent=String(num).padStart(2,"0");}
function hMeasure(){if(!hSec||!hTrack||!hPin){return;}
hPinned=wide.matches&&!reduced&&window.innerHeight>700;if(!hPinned){hSec.style.height="";hTrack.style.transform="";hTrack.style.paddingLeft="";var tl=hScenes[hScenes.length-1];if(tl&&tl.classList.contains("pf-scene--tail")){tl.style.width="";}
for(var i=0;i<hScenes.length;i++){hScenes[i].style.removeProperty("--f");hScenes[i].style.removeProperty("--rel");}
hCountNum=-1;hUpdate();return;}
var stageW=hPin.clientWidth||1;var mid=stageW/2;var pad=parseFloat(getComputedStyle(hTrack).paddingRight)||0;var first=hScenes[0];if(first){hTrack.style.paddingLeft=Math.max(pad,Math.round(mid-first.offsetWidth/2))+"px";}
var tail=hScenes[hScenes.length-1];var lastProj=hProjects[hProjects.length-1];if(tail&&tail.classList.contains("pf-scene--tail")&&lastProj){var want=Math.round(mid+(lastProj.offsetLeft+lastProj.offsetWidth/2)-tail.offsetLeft-pad);tail.style.width=Math.max(0,want)+"px";}
var contentW=tail.offsetLeft+tail.offsetWidth+pad;hTravel=Math.max(contentW-stageW,0);hSec.style.height=(window.innerHeight+hTravel)+"px";hX=hTargetFrom();hTrack.style.transform="translate3d("+hX.toFixed(1)+"px,0,0)";hKick();}
if(hSec&&hView){hTrack.addEventListener("focusin",function(e){if(!hPinned||!hTravel){return;}
var panel=e.target.closest?e.target.closest(".pf-scene"):null;if(!panel){return;}
var r=hSec.getBoundingClientRect();var travel=hSec.offsetHeight-window.innerHeight;if(travel<=0){return;}
var want=(panel.offsetLeft+panel.offsetWidth/2-hPin.clientWidth/2)/hTravel;var to=r.top+window.scrollY+clamp(want,0,1)*travel;if(Math.abs(to-window.scrollY)>40){window.scrollTo({top:to,behavior:"auto"});}});hView.addEventListener("scroll",function(){if(!hPinned){hUpdate();}},{passive:true});if(!reduced){hView.setAttribute("tabindex","-1");}}
var filmFrame=$(".pf-film__frame");var seam=$(".pf-seam");var railItems=$$(".pf-railnav i");var railSections=$$("[data-pf-chapter]");var railNav=$(".pf-railnav");var lightChapter=$("#clients");var ticking=false;var lastActive=-1;var railLight=false;function measure(){ticking=false;var vh=window.innerHeight;if(filmFrame&&!reduced){var fr=filmFrame.getBoundingClientRect();var gate=vh*0.45;var exit=clamp((gate-fr.bottom)/gate,0,1);filmFrame.style.setProperty("--exit",exit.toFixed(3));}
if(seam&&!reduced){var sr=seam.getBoundingClientRect();var p=clamp((vh-sr.top)/(vh+sr.height),0,1);var o=clamp(p/0.22,0,1)*clamp((1-p)/0.28,0,1);seam.style.setProperty("--p",p.toFixed(4));seam.style.setProperty("--o",o.toFixed(3));seam.style.setProperty("--o2",clamp((p-0.42)/0.25,0,1).toFixed(3));}
if(railItems.length&&railSections.length){var mid=vh*0.42;var active=0;for(var j=0;j<railSections.length;j++){if(railSections[j].getBoundingClientRect().top<=mid){active=j;}}
if(active!==lastActive){if(railItems[lastActive]){railItems[lastActive].classList.remove("is-active");}
if(railItems[active]){railItems[active].classList.add("is-active");}
lastActive=active;}
if(railNav&&lightChapter){var lr=lightChapter.getBoundingClientRect();var onLight=lr.top<=vh*0.42&&lr.bottom>=vh*0.58;if(onLight!==railLight){railLight=onLight;railNav.classList.toggle("is-light",onLight);}}}
hUpdate();}
function onScroll(){if(ticking){return;}
ticking=true;requestAnimationFrame(measure);}
if(filmFrame||seam||railItems.length||hSec){window.addEventListener("scroll",onScroll,{passive:true});window.addEventListener("resize",function(){hMeasure();onScroll();},{passive:true});hMeasure();measure();if(hTrack&&"ResizeObserver"in window){new ResizeObserver(function(){hMeasure();}).observe(hTrack);}
window.addEventListener("load",function(){hMeasure();measure();});}
if(fine&&!reduced){var cursor=$(".pf-cursor");var cursorLabel=cursor&&$(".pf-cursor span",cursor);if(cursor&&cursorLabel){var tx=0,ty=0,cx=0,cy=0,raf=null,moving=false;function loop(){cx+=(tx-cx)*0.18;cy+=(ty-cy)*0.18;cursor.style.transform="translate3d("+cx.toFixed(1)+"px,"+cy.toFixed(1)+"px,0)";if(Math.abs(tx-cx)>0.1||Math.abs(ty-cy)>0.1){raf=requestAnimationFrame(loop);}else{raf=null;moving=false;}}
document.addEventListener("pointermove",function(e){if(e.pointerType!=="mouse"){return;}
tx=e.clientX;ty=e.clientY;if(!moving){moving=true;raf=requestAnimationFrame(loop);}},{passive:true});document.addEventListener("pointerover",function(e){var target=e.target&&e.target.closest?e.target.closest("[data-cursor]"):null;if(!target){return;}
cursorLabel.textContent=target.getAttribute("data-cursor")||"";cursor.classList.add("is-on","is-big");document.body.classList.add("pf-cursor-active");});document.addEventListener("pointerout",function(e){var from=e.target&&e.target.closest?e.target.closest("[data-cursor]"):null;if(!from){return;}
var to=e.relatedTarget&&e.relatedTarget.closest?e.relatedTarget.closest("[data-cursor]"):null;if(to===from){return;}
cursor.classList.remove("is-on","is-big");document.body.classList.remove("pf-cursor-active");});window.addEventListener("blur",function(){cursor.classList.remove("is-on","is-big");document.body.classList.remove("pf-cursor-active");});}}})();