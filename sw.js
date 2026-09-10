/* ============================================================
   AV — OFFLINE FALLBACK SERVICE WORKER
   ============================================================
   Purpose: when the network is unreachable, navigations fall back
   to the AV "offline" experience rather than the browser's default
   offline page. This is the graceful half of the Offline state:
   the page itself (offline.html) is the designed screen, and this
   worker is what surfaces it.

   Deliberately minimal & non-invasive:
     · only intercepts *navigations* (not sub-resources), so normal
       requests stream straight through and are never cached/rewritten.
     · caches only a tiny shell needed to render the offline screen.
     · stale caches are cleaned up.
   ============================================================ */
"use strict";

const CACHE = "av-offline-v1";
const SHELL = [
  "./offline.html",
  "./assets/logo.png",
  "./css/tokens.css",
  "./css/styles.css",
  "./css/errors.css",
  "./js/errors.js",
  "./assets/fonts/inter-tight-normal.woff2",
  "./assets/fonts/inter-tight-italic.woff2",
  "./assets/fonts/instrument-serif-normal.woff2",
  "./assets/fonts/instrument-serif-italic.woff2"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => cache.addAll(SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Only take over top-level navigations.
  if (req.mode !== "navigate") return;

  event.respondWith(
    fetch(req).catch(() =>
      caches.match(req).then((hit) => hit || caches.match("./offline.html"))
    )
  );
});
