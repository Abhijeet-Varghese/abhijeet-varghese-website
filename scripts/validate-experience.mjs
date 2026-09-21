import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { JSDOM } from 'jsdom';

const root = process.cwd();
const read = (path) => readFileSync(resolve(root, path), 'utf8');
const legacy = read('abhijeetvarghese/experience/index.html');
const entry = read('experience/index.html');
const app = read('src/ExperienceApp.tsx');
const content = read('src/sections/experience/ExperienceContent.tsx');
const data = read('src/sections/experience/experience-data.ts');
const entryPoint = read('src/experience-main.tsx');
const pageStyles = read('src/styles/react-experience.css');
const motion = read('src/hooks/useExperienceMotion.ts');
const vite = read('vite.config.ts');
const failures = [];

const legacyDocument = new JSDOM(legacy).window.document;
const legacyJobs = Array.from(legacyDocument.querySelectorAll('.exp-job'));
if (legacyJobs.length !== 6) failures.push(`Legacy Experience audit expected six roles, found ${legacyJobs.length}.`);
for (const job of legacyJobs) {
  const role = job.querySelector('.exp-job__role')?.textContent?.trim();
  const summary = job.querySelector('.exp-job__summary')?.textContent?.trim();
  if (role && !data.includes(role)) failures.push(`React Experience data lost role: ${role}`);
  if (summary && !data.includes(summary)) failures.push(`React Experience data lost summary for: ${role ?? 'unknown role'}`);
}
for (const imageMarker of ['exp-job__img', 'experience-centre.webp', 'working-session.webp', '"image"']) {
  if (content.includes(imageMarker) || data.includes(imageMarker)) {
    failures.push(`Experience still retains a rendered-image contract: ${imageMarker}`);
  }
}
if (!entryPoint.includes("import './styles/react-experience.css'")) failures.push('Experience does not load its page-scoped reflow style.');
if (!pageStyles.includes('@media (min-width: 1081px)') || !pageStyles.includes('grid-template-columns: minmax(150px, 1.1fr) minmax(0, 1fr)')) {
  failures.push('Experience does not reflow the former media column at desktop widths.');
}

for (const marker of [
  '<body id="top" class="experience-page mobile-chrome">',
  'id="avLoader"',
  'id="progress"',
  '<a class="skip-link" href="#main">',
  '<div id="root"></div>',
  'src="/src/experience-main.tsx"',
  'href="https://abhijeetvarghese.com/experience/"',
  'property="og:url" content="https://abhijeetvarghese.com/experience/"',
  '"@type":"ProfilePage"',
  '"@type":"BreadcrumbList"',
]) {
  if (!entry.includes(marker)) failures.push(`Experience entry is missing required contract: ${marker}`);
}

const stylesheetOrder = [
  '/css/styles.css?v=4.6.1',
  '/css/elevate.css?v=4.4.1',
  '/css/mobile-chrome.css?v=2.0.0',
  '/css/mobile-menu-panel.css?v=1.0.0',
];
const positions = stylesheetOrder.map((stylesheet) => entry.indexOf(stylesheet));
if (positions.some((position) => position < 0)) failures.push('Experience entry is missing an approved legacy stylesheet.');
if (positions.some((position, index) => index > 0 && position < positions[index - 1])) failures.push('Experience stylesheet cascade order changed.');
for (const loaderContract of [
  'av-loader-seen-v1',
  "sessionStorage.getItem('av-loader-seen-v1')",
  'html.av-loader-seen .av-loader{display:none!important}',
  "d.classList.contains('av-loader-seen')",
]) {
  if (!entry.includes(loaderContract)) failures.push(`Experience loader-once contract is missing: ${loaderContract}`);
}
for (const legacyRuntime of ['/js/main.js', '/js/elevate.js', '/js/mobile-chrome.js']) {
  if (entry.includes(legacyRuntime)) failures.push(`Experience entry still loads legacy runtime: ${legacyRuntime}`);
}
for (const hook of ['useMenu()', 'useReveal()', 'usePageMotion()', 'useElevate()', 'useMobileChrome()', 'useExperienceMotion()', 'useHistoryClose()', 'useAnalytics()', 'useServiceWorker()']) {
  if (!app.includes(hook)) failures.push(`Experience app is missing shared integration: ${hook}`);
}
for (const contract of ['exp-hero t-dark', 'exp-record t-light', 'exp-timeline', 'exp-job__more', 'exp-closing t-dark']) {
  if (!content.includes(contract)) failures.push(`Experience React content is missing legacy scene: ${contract}`);
}
for (const contract of ['View all ${count} responsibilities', 'Show fewer responsibilities', "timeline.style.setProperty('--exp-fill'", "document.body.classList.toggle('exp-scrolled'"]) {
  if (!motion.includes(contract)) failures.push(`Experience motion port is missing: ${contract}`);
}

if (!vite.includes("experienceEntry = resolve(projectRoot, 'experience/index.html')")) failures.push('Vite has no Experience MPA entry.');
if (!vite.includes('experience: experienceEntry')) failures.push('Vite Rollup input is missing Experience.');
if (!vite.includes("pathname === '/story/' || pathname === '/experience/' || pathname === '/case-studies/'")) failures.push('Vite legacy middleware does not reserve the React Experience route.');

const built = resolve(root, 'dist/experience/index.html');
if (!existsSync(built)) {
  failures.push('Build output is missing: dist/experience/index.html');
} else {
  const output = read('dist/experience/index.html');
  if (!output.includes('type="module"')) failures.push('Built Experience page has no module entry.');
  if (!output.includes('https://abhijeetvarghese.com/experience/')) failures.push('Built Experience page lost canonical metadata.');
  if (!output.includes('av-loader-seen-v1')) failures.push('Built Experience page lost the loader-once session gate.');
  if (output.includes('/js/main.js') || output.includes('/js/elevate.js') || output.includes('/js/mobile-chrome.js')) failures.push('Built Experience page loads legacy runtime.');
}

if (failures.length) {
  console.error('Experience validation failed:');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log('Experience validation passed: MPA routing, SEO, shared shell, image-free role record, timeline interaction, reflow, and runtime contracts are intact.');
