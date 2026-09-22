import{j as e,a as c,b as l,d,e as p,f as h,g as u,h as m,S as f,i as x,k as v}from"./useCmsSeo-C1WmqeVb.js";import{u as g,a as y}from"./useMobileChrome-BJMjfRik.js";import{r as j}from"./react-SIwY82C9.js";function b(){j.useEffect(()=>{document.body.classList.add("search-page");const s=["/js/main.js?v=4.6.0","/js/elevate.js?v=4.4.1","/js/mobile-chrome.js?v=2.0.0"];let r=!1;return(async()=>{for(const t of s){if(r)break;document.querySelector(`script[src="${t}"]`)||await new Promise((i,o)=>{const n=document.createElement("script");n.src=t,n.defer=!0,n.onload=()=>i(),n.onerror=()=>o(new Error("Failed "+t)),document.body.appendChild(n)})}})().catch(t=>console.error("[Search]",t)),()=>{r=!0}},[])}function S(){return e.jsx("div",{dangerouslySetInnerHTML:{__html:`<section class="page-hero" aria-label="Search">
      <div class="container">
        <div class="chapter__meta page-hero__meta" data-reveal>
          <span class="chapter__index">S</span>
          <span class="chapter__tag">Search</span>
        </div>
        <h1 class="page-hero__title" data-reveal>Find anything <em>on this site.</em></h1>
        <p class="page-hero__lede" data-reveal>Projects, case studies, essays and journal entries — search the whole portfolio instantly.</p>
        <div class="container" style="max-width:640px;margin-top:28px" data-reveal>
          <input type="search" id="siteSearch" placeholder="Try &ldquo;experience centre&rdquo; or &ldquo;AI&rdquo;&hellip;" aria-label="Search the site"
            style="width:100%;min-height:56px;border-radius:14px;border:1px solid var(--cl);background:var(--bg);padding:0 20px;font:inherit;font-size:16px">
          <div id="searchResults" style="margin-top:16px" aria-live="polite"></div>
        </div>
      </div>
    </section>
    <script>
    (function () {
      var input = document.getElementById("siteSearch");
      var box = document.getElementById("searchResults");
      var idx = [];
      fetch("search-index.json").then(function (r) { return r.json(); }).then(function (d) { idx = d.items || []; }).catch(function () {});
      function esc(s) { return String(s || "").replace(/[&<>"]/g, function (c) { return c.charCodeAt(0) === 34 ? "&quot;" : { "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]; }); }
      function render(q) {
        q = q.toLowerCase();
        if (q.length < 2) { box.innerHTML = ""; return; }
        var hits = idx.filter(function (i) { var tags = Array.isArray(i.tags) ? i.tags.join(" ") : String(i.tags || ""); return (i.title + " " + i.excerpt + " " + tags).toLowerCase().indexOf(q) !== -1; }).slice(0, 10);
        if (!hits.length) { box.innerHTML = "<p style=\\"color:var(--ink-3);font-size:14px\\">No results for \\"" + esc(q) + "\\". Try another term, or <a href=\\"contact.html\\">ask me directly</a>.</p>"; return; }
        box.innerHTML = hits.map(function (i) {
          return "<a href=\\"" + esc(i.url) + "\\" style=\\"display:block;text-decoration:none;border-bottom:1px solid var(--cl);padding:14px 4px\\">" +
            "<span style=\\"font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:var(--ink-3)\\">" + esc(i.type) + "</span>" +
            "<strong style=\\"display:block;font-size:16px;margin:3px 0\\">" + esc(i.title) + "</strong>" +
            "<span style=\\"font-size:13px;color:var(--ink-3);line-height:1.5\\">" + esc(i.excerpt) + "</span></a>";
        }).join("");
      }
      input.addEventListener("input", function () { render(input.value); });
      input.addEventListener("keydown", function (e) { if (e.key === "Enter") render(input.value); });
      try {
        if (window.avTrack) avTrack({ event_type: "site_search", path: location.pathname });
      } catch (e) {}
    })();
    <\/script>`}})}function k(){return e.jsx("svg",{width:"17",height:"17",viewBox:"0 0 18 18",fill:"none","aria-hidden":"true",children:e.jsx("path",{d:"m3 3 12 12M15 3 3 15",stroke:"currentColor",strokeWidth:"1.7",strokeLinecap:"round"})})}function _(){return c(),l(),d(),p(),g(),y(),h(),u(),m("/search/",{title:"Search — Abhijeet Varghese"}),b(),e.jsxs(e.Fragment,{children:[e.jsx(f,{activePath:"/search/"}),e.jsx("a",{className:"page-close",href:"/","data-history-close":"","aria-label":"Back to previous page",children:e.jsx(k,{})}),e.jsx("main",{id:"main",children:e.jsx(S,{})}),e.jsx(x,{})]})}const a=document.getElementById("root");a&&v(a).render(e.jsx(_,{}));
