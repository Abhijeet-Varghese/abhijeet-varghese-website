import { useEffect } from 'react';
import SEARCH_INDEX from '../data/search-index.json';

/* Ported verbatim from the legacy search.html inline module (the site search
   UI logic). The search index was fetched as search-index.json at runtime;
   it is now bundled from src/data/search-index.json (same data, one less
   request, works offline). Everything else is unchanged. */
export default function useSearch() {
  useEffect(() => {

    (function () {
      var input = document.getElementById("siteSearch");
      var box = document.getElementById("searchResults");
      var idx = [];
      idx = SEARCH_INDEX.items || [];   // index bundled at build time (was fetch("search-index.json"))
      function esc(s) { return String(s || "").replace(/[&<>"]/g, function (c) { return c.charCodeAt(0) === 34 ? "&quot;" : { "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]; }); }
      function render(q) {
        q = q.toLowerCase();
        if (q.length < 2) { box.innerHTML = ""; return; }
        var hits = idx.filter(function (i) { var tags = Array.isArray(i.tags) ? i.tags.join(" ") : String(i.tags || ""); return (i.title + " " + i.excerpt + " " + tags).toLowerCase().indexOf(q) !== -1; }).slice(0, 10);
        if (!hits.length) { box.innerHTML = "<p style=\"color:var(--ink-3);font-size:14px\">No results for \"" + esc(q) + "\". Try another term, or <a href=\"contact.html\">ask me directly</a>.</p>"; return; }
        box.innerHTML = hits.map(function (i) {
          return "<a href=\"" + esc(i.url) + "\" style=\"display:block;text-decoration:none;border-bottom:1px solid var(--cl);padding:14px 4px\">" +
            "<span style=\"font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:var(--ink-3)\">" + esc(i.type) + "</span>" +
            "<strong style=\"display:block;font-size:16px;margin:3px 0\">" + esc(i.title) + "</strong>" +
            "<span style=\"font-size:13px;color:var(--ink-3);line-height:1.5\">" + esc(i.excerpt) + "</span></a>";
        }).join("");
      }
      input.addEventListener("input", function () { render(input.value); });
      input.addEventListener("keydown", function (e) { if (e.key === "Enter") render(input.value); });
      try {
        if (window.avTrack) avTrack({ event_type: "site_search", path: location.pathname });
      } catch (e) {}
    })();
    
  }, []);
}
