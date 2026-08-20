/**
 * AV OS first-party analytics — minimal, privacy-respecting.
 *
 * Kept verbatim from the production inline snippet. Injected as a static
 * inline <script> in the document <head>/<body> (outside the React tree) by
 * the prerender step, so it runs even if the JS bundle fails to load. It
 * POSTs to the PHP endpoint /api/analytics/track — never to a third party.
 */
export const ANALYTICS_SCRIPT = `
(function () {
  var v = localStorage.getItem("av_visitor") || "";
  var d = { event_type: "pageview", path: location.pathname, referrer: document.referrer || "", visitor_id: v };
  try {
    var u = new URLSearchParams(location.search);
    ["utm_source", "utm_medium", "utm_campaign"].forEach(function (k) { var x = u.get(k); if (x) d[k] = x; });
  } catch (e) {}
  d.device = /Mobi|Android/i.test(navigator.userAgent) ? "mobile" : (/iPad|Tablet/i.test(navigator.userAgent) ? "tablet" : "desktop");
  function avTrack(extra) {
    var e = Object.assign({}, d, extra);
    fetch("/api/analytics/track", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(e) }).catch(function () {});
  }
  fetch("/api/analytics/track", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify(d)
  }).then(function (r) { return r.json(); }).then(function (j) {
    if (j.data && j.data.visitor_id && !v) { try { localStorage.setItem("av_visitor", j.data.visitor_id); } catch (e) {} }
  }).catch(function () {});
  document.addEventListener("click", function (ev) {
    var a = ev.target.closest ? ev.target.closest("a, button") : null;
    if (!a) return;
    var href = a.getAttribute("href") || "";
    if (href.indexOf(".pdf") !== -1 || a.hasAttribute("download")) { avTrack({ event_type: "download", path: location.pathname, content: href }); return; }
    if (a.closest(".hero, .cta, .btn, .page-hero") || /book|calendly|schedule|contact/i.test(href + " " + (a.textContent || ""))) {
      avTrack({ event_type: "cta_click", path: location.pathname, content: href });
    }
    if (/^(https?:)?\\/\\//.test(href) && href.indexOf(location.origin) !== 0) { avTrack({ event_type: "external_link", path: location.pathname, content: href }); }
  });
  document.addEventListener("click", function (ev) {
    var g = ev.target.closest ? ev.target.closest("[data-gallery], .gallery, .media-grid") : null;
    if (g) { avTrack({ event_type: "gallery_open", path: location.pathname }); return; }
    var v = ev.target.closest ? ev.target.closest("video") : null;
    if (v) {
      var f = function () { avTrack({ event_type: "video_play", path: location.pathname, content: v.currentSrc || "" }); v.removeEventListener("play", f); };
      v.addEventListener("play", f);
    }
  });
  (function () {
    var sent = {};
    var onScroll = function () {
      var h = document.documentElement;
      var pct = Math.round((h.scrollTop + window.innerHeight) / h.scrollHeight * 100);
      [25, 50, 75, 100].forEach(function (t) {
        if (pct >= t && !sent[t]) { sent[t] = true; avTrack({ event_type: "scroll_depth", path: location.pathname, content: String(t) }); }
      });
    };
    var t = null;
    window.addEventListener("scroll", function () { if (t) return; t = setTimeout(function () { onScroll(); t = null; }, 400); }, { passive: true });
  })();
  (function () {
    var p = location.pathname || "";
    var m = null;
    if ((m = p.match(/\\/essay-[^\\/]+\\.html/))) { avTrack({ event_type: "essay_view", path: p, content: m[0] }); }
    else if ((m = p.match(/\\/journal-[^\\/]+\\.html/))) { avTrack({ event_type: "journal_view", path: p, content: m[0] }); }
    else if ((m = p.match(/\\/case-studies\\.html/)) || (m = p.match(/\\/case-study-[^\\/]+\\.html/)) || (m = p.match(/\\/experience-design\\/[^\\/]+\\/?/))) { avTrack({ event_type: "case_study_view", path: p, content: m[0] }); }
    else if (p.indexOf("experience") !== -1) { avTrack({ event_type: "project_view", path: p }); }
    var cf = document.getElementById("contactForm") || document.getElementById("bookForm");
    if (cf) { var once = false; cf.addEventListener("focusin", function () { if (!once) { once = true; avTrack({ event_type: "contact_start", path: p }); } }, true); }
  })();
})();
`;
