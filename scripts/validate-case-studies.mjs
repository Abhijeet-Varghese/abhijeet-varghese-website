import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { JSDOM } from 'jsdom';

const root = process.cwd();
const read = (path) => readFileSync(resolve(root, path), 'utf8');
const legacy = read('abhijeetvarghese/case-studies/index.html');
const entry = read('case-studies/index.html');
const app = read('src/CaseStudiesApp.tsx');
const content = read('src/sections/case-studies/CaseStudiesContent.tsx');
const entryPoint = read('src/case-studies-main.tsx');
const thumbnailStyles = read('src/styles/react-case-studies.css');
const vite = read('vite.config.ts');
const failures = [];

const legacyDocument = new JSDOM(legacy).window.document;
const legacyItems = Array.from(legacyDocument.querySelectorAll('.cx-item'));
if (legacyItems.length !== 3) failures.push(`Legacy Case Studies audit expected three cards, found ${legacyItems.length}.`);
for (const item of legacyItems) {
  const href = item.querySelector('.cx-fig')?.getAttribute('href');
  const client = item.querySelector('.cx-name')?.textContent?.trim();
  const image = item.querySelector('img')?.getAttribute('src')?.split('?')[0];
  if (href && !content.includes(href)) failures.push(`React Case Studies content lost detail link: ${href}`);
  if (client && !content.includes(client)) failures.push(`React Case Studies content lost client: ${client}`);
  if (image && !existsSync(resolve(root, 'abhijeetvarghese', image.slice(1)))) failures.push(`Missing Case Studies asset: ${image}`);
}
for (const asset of [
  '/assets/case-orange-experience-in-action.avif',
  '/assets/case-orange-experience-in-action.webp',
  '/assets/case-bpcl.avif',
  '/assets/case-bpcl.webp',
  '/assets/case-army.avif',
  '/assets/case-army.webp',
]) {
  if (!existsSync(resolve(root, 'abhijeetvarghese', asset.slice(1)))) failures.push(`Missing Case Studies asset: ${asset}`);
  if (!content.includes(asset)) failures.push(`React Case Studies content does not render ${asset}`);
}
if (!entryPoint.includes("import './styles/react-case-studies.css'")) failures.push('Case Studies does not load its page-scoped thumbnail treatment.');
for (const contract of ['aspect-ratio: 1672 / 941', 'height: 100%;', 'scale: 1 !important']) {
  if (!thumbnailStyles.includes(contract)) failures.push(`Case Studies thumbnail treatment is missing: ${contract}`);
}
if (!content.includes('width="1672" height="941"')) failures.push('Case Studies thumbnail source dimensions drifted from the audited 1672 × 941 assets.');

for (const marker of [
  '<body id="top" class="mobile-chrome">',
  'id="avLoader"',
  'id="progress"',
  '<a class="skip-link" href="#main">',
  '<div id="root"></div>',
  'src="/src/case-studies-main.tsx"',
  'href="https://abhijeetvarghese.com/case-studies/"',
  'property="og:url" content="https://abhijeetvarghese.com/case-studies/"',
  '"@type":"WebPage"',
  '"@type":"BreadcrumbList"',
]) {
  if (!entry.includes(marker)) failures.push(`Case Studies entry is missing required contract: ${marker}`);
}

const stylesheetOrder = [
  '/css/styles.css?v=3.4.3',
  '/css/elevate.css?v=3.4.0',
  '/case-studies/index.css?v=4.0.0',
  '/css/mobile-chrome.css?v=2.0.0',
  '/css/mobile-menu-panel.css?v=1.0.0',
];
const positions = stylesheetOrder.map((stylesheet) => entry.indexOf(stylesheet));
if (positions.some((position) => position < 0)) failures.push('Case Studies entry is missing an approved legacy stylesheet.');
if (positions.some((position, index) => index > 0 && position < positions[index - 1])) failures.push('Case Studies stylesheet cascade order changed.');
for (const loaderContract of [
  'av-loader-seen-v1',
  "sessionStorage.getItem('av-loader-seen-v1')",
  'html.av-loader-seen .av-loader{display:none!important}',
  "d.classList.contains('av-loader-seen')",
]) {
  if (!entry.includes(loaderContract)) failures.push(`Case Studies loader-once contract is missing: ${loaderContract}`);
}
for (const legacyRuntime of ['/js/main.js', '/js/elevate.js', '/js/mobile-chrome.js']) {
  if (entry.includes(legacyRuntime)) failures.push(`Case Studies entry still loads legacy runtime: ${legacyRuntime}`);
}
for (const hook of ['useMenu()', 'useReveal()', 'usePageMotion()', 'useElevate()', 'useMobileChrome()', 'useHistoryClose()', 'useAnalytics()', 'useServiceWorker()']) {
  if (!app.includes(hook)) failures.push(`Case Studies app is missing shared integration: ${hook}`);
}
for (const contract of ['page-hero', 'hero-notes', 'cx-item', 'cx-hinge', 'cx-close', 'Request a deeper look']) {
  if (!content.includes(contract)) failures.push(`Case Studies React content is missing legacy scene: ${contract}`);
}
if (content.includes('data-parallax') || content.includes('parallax:')) {
  failures.push('Case Studies thumbnail markup still opts into shared image translation.');
}

if (!vite.includes("caseStudiesEntry = resolve(projectRoot, 'case-studies/index.html')")) failures.push('Vite has no Case Studies MPA entry.');
if (!vite.includes('caseStudies: caseStudiesEntry')) failures.push('Vite Rollup input is missing Case Studies.');
if (!vite.includes("pathname === '/story/' || pathname === '/experience/' || pathname === '/case-studies/'")) failures.push('Vite legacy middleware does not reserve the React Case Studies route.');

const built = resolve(root, 'dist/case-studies/index.html');
if (!existsSync(built)) {
  failures.push('Build output is missing: dist/case-studies/index.html');
} else {
  const output = read('dist/case-studies/index.html');
  if (!output.includes('type="module"')) failures.push('Built Case Studies page has no module entry.');
  if (!output.includes('https://abhijeetvarghese.com/case-studies/')) failures.push('Built Case Studies page lost canonical metadata.');
  if (!output.includes('av-loader-seen-v1')) failures.push('Built Case Studies page lost the loader-once session gate.');
  if (output.includes('/js/main.js') || output.includes('/js/elevate.js') || output.includes('/js/mobile-chrome.js')) failures.push('Built Case Studies page loads legacy runtime.');
}

if (failures.length) {
  console.error('Case Studies validation failed:');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log('Case Studies validation passed: MPA routing, SEO, shared shell, ordered cards, source-matched locked thumbnails, links, and runtime contracts are intact.');
