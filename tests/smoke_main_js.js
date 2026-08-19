/* AV OS — main.js smoke test: loads each published page in jsdom with scripts
   enabled and reports any runtime errors from the interaction bundle. */
const fs = require("fs");
const path = require("path");
const { JSDOM, VirtualConsole } = require("jsdom");

const SITE = path.join(__dirname, "..", "avos-php", "public_html", "site");
const PAGES = process.argv[2] ? [process.argv[2]] : [
  "index.html", "story.html", "contact.html", "portfolio.html", "case-studies.html",
  "experience.html", "insights.html", "journal.html", "consulting.html",
  "for-recruiters.html", "search.html", "privacy-policy.html", "terms.html", "404.html",
  "essay-technology-should-feel-human.html",
  "case-study-immersive-solutions-for-the-indian-army.html",
];
const JS = fs.readFileSync(path.join(__dirname, "..", "avos-php", "public_html", "site", "js", "main.js"), "utf8");

let failed = 0;
for (const page of PAGES) {
  const file = path.join(SITE, page);
  if (!fs.existsSync(file)) { console.log(`skip ${page}`); continue; }
  const html = fs.readFileSync(file, "utf8");
  const errors = [];
  const vc = new VirtualConsole();
  vc.on("jsdomError", e => { if (!/Could not load|not implemented/.test(String(e.message))) errors.push(e.message + (e.detail ? ` :: ${e.detail}` : "")); });
  vc.on("error", m => errors.push(String(m)));
  const dom = new JSDOM(html, {
    runScripts: "outside-only",
    pretendToBeVisual: true,
    virtualConsole: vc,
    url: "https://abhijeetvarghese.com/" + page,
  });
  const { window } = dom;
  // minimal browser shims jsdom lacks
  window.matchMedia = window.matchMedia || (q => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} }));
  window.IntersectionObserver = window.IntersectionObserver || class { constructor(cb) { this.cb = cb; } observe() {} unobserve() {} disconnect() {} };
  window.requestIdleCallback = window.requestIdleCallback || (cb => setTimeout(() => cb({ didTimeout: false, timeRemaining: () => 50 }), 0));
  window.fetch = window.fetch || (() => Promise.resolve({ ok: false, json: async () => ({}) }));
  try {
    window.eval(JS);
  } catch (e) {
    errors.push("EVAL THROW: " + e.message + "\n" + (e.stack || "").split("\n").slice(0, 4).join("\n"));
  }
  /* close-control behaviour sanity on inner pages */
  const close = window.document.querySelector("[data-history-close]");
  if (close && !close.getAttribute("href")) errors.push("close control lost its href");
  if (errors.length) { failed++; console.log(`✗ ${page}`); errors.slice(0, 5).forEach(e => console.log("   ", e)); }
  else console.log(`✓ ${page}`);
  window.close();
}
process.exit(failed ? 1 : 0);
