/* AV OS — static site audit: a11y, links, structure, media */
const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");

const SITE = path.join(__dirname, "..", "avos-php", "public_html", "site");
const INNER = /(case-study-[\w-]+\.html|essay-[\w-]+\.html|journal-[\w-]+\.html|experience-design\/)/;

function pages(dir) {
  const out = [];
  for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, f.name);
    if (f.isDirectory()) out.push(...pages(p));
    else if (f.name.endsWith(".html")) out.push(p);
  }
  return out;
}

const files = pages(SITE);
const allFiles = new Set();
(function walk(dir) {
  for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, f.name);
    if (f.isDirectory()) walk(p); else allFiles.add(path.relative(SITE, p));
  }
})(SITE);
const report = { errors: [], warnings: [], stats: {} };
let totalImgs = 0, totalLinks = 0, totalButtons = 0;

for (const file of files) {
  const rel = path.relative(SITE, file).replace(/\\/g, "/");
  const html = fs.readFileSync(file, "utf8");
  const dom = new JSDOM(html);
  if (/http-equiv="refresh"|location\.replace\(/.test(html)) { report.stats.redirectStubs = (report.stats.redirectStubs || 0) + 1; continue; }
  const doc = dom.window.document;

  /* duplicate IDs */
  const seen = new Set();
  for (const el of doc.querySelectorAll("[id]")) {
    if (seen.has(el.id)) report.errors.push(`${rel}: duplicate id "${el.id}"`);
    seen.add(el.id);
  }

  /* images */
  for (const img of doc.querySelectorAll("img")) {
    totalImgs++;
    if (img.getAttribute("alt") === null && img.getAttribute("aria-hidden") !== "true")
      report.errors.push(`${rel}: <img src="${img.getAttribute("src")}"> missing alt`);
    if (!img.getAttribute("width") || !img.getAttribute("height"))
      report.warnings.push(`${rel}: <img ${img.getAttribute("src")}> missing intrinsic width/height`);
    const src = img.getAttribute("src") || "";
    if (src.startsWith("http")) report.warnings.push(`${rel}: external img ${src}`);
  }

  /* links */
  for (const a of doc.querySelectorAll("a")) {
    totalLinks++;
    const href = a.getAttribute("href") || "";
    const text = (a.textContent || "").trim();
    const label = a.getAttribute("aria-label") || text || a.getAttribute("title") || "";
    if (!label && !a.querySelector("img[alt]"))
      report.errors.push(`${rel}: <a href="${href}"> no accessible name`);
    if (!href) { report.warnings.push(`${rel}: empty href link`); continue; }
    if (/^(https?:)?\/\//.test(href) || href.startsWith("mailto:") || href.startsWith("tel:")) {
      if (/^(https?:)?\/\//.test(href) && !/abhijeetvarghese\.com/.test(href) && !a.getAttribute("target"))
        report.warnings.push(`${rel}: external link without target=_blank: ${href}`);
      continue;
    }
    if (href.startsWith("#")) continue;
    let resolved = path.posix.normalize(path.posix.join(path.posix.dirname(rel), href.split("#")[0].split("?")[0]));
    if (resolved.endsWith("/")) {
      if (allFiles.has(resolved + "index.html")) continue;
      resolved += "index.html";
    }
    if (!allFiles.has(resolved)) report.errors.push(`${rel}: broken internal link "${href}" -> ${resolved}`);
  }

  /* buttons */
  for (const b of doc.querySelectorAll("button")) {
    totalButtons++;
    const label = (b.textContent || "").trim() || b.getAttribute("aria-label") || b.getAttribute("title") || "";
    if (!label) report.errors.push(`${rel}: <button> no accessible name`);
  }

  /* headings */
  const hs = [...doc.querySelectorAll("h1,h2,h3,h4,h5,h6")];
  const h1s = hs.filter(h => h.tagName === "H1");
  if (h1s.length !== 1) report.warnings.push(`${rel}: ${h1s.length} <h1> elements`);
  let prev = 0;
  for (const h of hs) {
    const lvl = +h.tagName[1];
    if (prev && lvl - prev > 1) report.warnings.push(`${rel}: heading jump h${prev}->h${lvl} ("${(h.textContent||"").trim().slice(0,40)}")`);
    prev = lvl;
  }

  /* forms */
  for (const input of doc.querySelectorAll("input:not([type=hidden]), select, textarea")) {
    const id = input.getAttribute("id");
    const hasLabel = (id && doc.querySelector(`label[for="${id}"]`)) || input.closest("label") || input.getAttribute("aria-label") || input.getAttribute("aria-labelledby");
    if (!hasLabel) report.errors.push(`${rel}: input #${id || "?"} (${input.getAttribute("name") || ""}) without label`);
  }

  /* aria sanity */
  for (const el of doc.querySelectorAll("[aria-hidden=true]")) {
    if (el.matches("a[href],button,input,select,textarea") || el.querySelector("a[href],button,input,select,textarea"))
      report.warnings.push(`${rel}: aria-hidden on focusable content <${el.tagName.toLowerCase()} class="${el.getAttribute("class") || ""}">`);
  }
  for (const el of doc.querySelectorAll("[tabindex]:not([tabindex='-1']):not([tabindex='0'])"))
    report.warnings.push(`${rel}: positive tabindex on <${el.tagName.toLowerCase()}>`);

  /* inner-page close button contract */
  if (INNER.test(rel)) {
    const close = doc.querySelector("[data-history-close]");
    if (!close) report.errors.push(`${rel}: inner page missing close control`);
  }

  /* iframe / object */
  if (doc.querySelector("iframe, object, embed"))
    report.warnings.push(`${rel}: embeds present (${doc.querySelectorAll("iframe,object,embed").length})`);
}

/* JS syntax */
for (const js of ["main.js", "orange-business-case-study.js"]) {
  const p = path.join(SITE, "js", js);
  new Function(fs.readFileSync(p, "utf8")); // throws on syntax error
}

report.stats = { pages: files.length, images: totalImgs, links: totalLinks, buttons: totalButtons };
console.log("STATS", JSON.stringify(report.stats));
console.log(`\n== ERRORS (${report.errors.length}) ==`);
report.errors.slice(0, 60).forEach(e => console.log("  ✗", e));
console.log(`\n== WARNINGS (${report.warnings.length}) ==`);
report.warnings.slice(0, 60).forEach(w => console.log("  ⚠", w));
