import { useEffect } from 'react';
export function useJournalMotion() {
  useEffect(() => {
    document.body.classList.add('journal-page');
    const scripts = ["/js/main.js?v=4.6.0","/js/elevate.js?v=4.4.1","/js/mobile-chrome.js?v=2.0.0"];
    const els: HTMLScriptElement[] = [];
    let cancelled=false;
    const load = async () => {
      for(const src of scripts){
        if(cancelled) break;
        if(document.querySelector(`script[src="${src}"]`)) continue;
        await new Promise<void>((resolve,reject)=>{
          const s=document.createElement('script');
          s.src=src; s.defer=true;
          s.onload=()=>resolve();
          s.onerror=()=>reject(new Error('Failed '+src));
          els.push(s);
          document.body.appendChild(s);
        });
      }
    };
    load().catch(e=>console.error('[Journal]',e));
    return()=>{ cancelled=true; };
  },[]);
}
