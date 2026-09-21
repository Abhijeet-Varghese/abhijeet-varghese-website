import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

const root = process.cwd();
const read = (path) => readFileSync(resolve(root, path), 'utf8');

function walk(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolute = join(directory, entry.name);
    if (entry.isDirectory()) return walk(absolute);
    return [relative(root, absolute)];
  });
}

const sourceFiles = walk(resolve(root, 'src')).filter((file) => /\.(ts|tsx|css)$/.test(file));
// Story, Experience, and Case Studies are separate MPA entries with approved
// legacy classes of their own. Keep homepage-only content and asset assertions
// scoped away from those independently migrated route components.
const nonHomepageEntries = new Set([
  'src/StoryApp.tsx',
  'src/story-main.tsx',
  'src/ExperienceApp.tsx',
  'src/experience-main.tsx',
  'src/CaseStudiesApp.tsx',
  'src/case-studies-main.tsx',
  'src/PortfolioApp.tsx',
  'src/portfolio-main.tsx',
  'src/ContactApp.tsx',
  'src/contact-main.tsx',
]);
const homepageComponentSource = sourceFiles
  .filter((file) => file.endsWith('.tsx') && !file.startsWith('src/sections/story/') && !file.startsWith('src/sections/experience/') && !file.startsWith('src/sections/case-studies/') && !file.startsWith('src/sections/portfolio/') && !file.startsWith('src/sections/contact/') && !nonHomepageEntries.has(file))
  .map((file) => read(file))
  .join('\n');
const completeSource = `${sourceFiles.map((file) => read(file)).join('\n')}\n${read('index.html')}`;
const markupSource = `${homepageComponentSource}\n${read('index.html')}`;
const requiredAssets = new Set();
for (const match of markupSource.matchAll(/(?:src|srcSet|href)=["'](\/assets\/[^"'#?]+)(?:\?[^"']*)?["']/g)) {
  requiredAssets.add(match[1]);
}

const approvedStylesheets = [
  '/css/styles.css?v=4.6.1',
  '/css/elevate.css?v=4.4.1',
  '/css/hero-v6.css?v=4.4.1',
  '/css/home-mobile.css?v=4.0.0',
  '/css/mobile-menu-panel.css?v=1.0.0',
];

const failures = [];
for (const asset of requiredAssets) {
  const diskPath = resolve(root, 'abhijeetvarghese', asset.slice(1));
  if (!existsSync(diskPath)) failures.push(`Missing referenced homepage asset: ${asset}`);
}
for (const stylesheet of approvedStylesheets) {
  const pathname = stylesheet.split('?')[0];
  if (!read('index.html').includes(stylesheet)) failures.push(`React index is missing approved visual stylesheet: ${stylesheet}`);
  if (!existsSync(resolve(root, 'abhijeetvarghese', pathname.slice(1)))) failures.push(`Approved visual stylesheet is missing: ${pathname}`);
}

const removedMarkers = [
  'chapter__num',
  'cap__num',
  'essay__num',
  'era__index',
  'journey__counter',
  'focus__num',
];
for (const marker of removedMarkers) {
  if (homepageComponentSource.includes(marker)) {
    failures.push(`Removed section-number marker still appears in homepage React component source: ${marker}`);
  }
}
if (/Final chapter/i.test(homepageComponentSource)) failures.push('Final chapter label remains in homepage React component source.');
if (completeSource.includes("setProperty('--work-px'")) failures.push('Featured Work thumbnail movement was reintroduced.');
if (!completeSource.includes('transform: none !important')) failures.push('Featured Work thumbnail lock CSS is missing.');
const reactHomeStyles = read('src/styles/react-home.css');
if (!/body\.home-react \.footer--arena \.footer__inner::before\s*\{\s*content:\s*none;\s*display:\s*none;/m.test(reactHomeStyles)) {
  failures.push('Final Chapter pseudo-section override is missing or cannot apply to the footer pseudo-element.');
}
if (reactHomeStyles.includes('::before::after')) failures.push('Final Chapter override contains an invalid chained pseudo-element selector.');
if (!reactHomeStyles.includes('@media (max-width: 900px)')) {
  failures.push('The footer-cue removal is no longer bounded to the approved 320–900px tier.');
}
if (!reactHomeStyles.includes('@media (min-width: 701px)') || !reactHomeStyles.includes('object-fit: cover')) {
  failures.push('Desktop/tablet Featured Work frame-fill override is missing.');
}
if (!reactHomeStyles.includes('body.home-react #case-prj-1 .case__panel img')) {
  failures.push('Phone Featured Work does not retain the asset-specific frame-fill override.');
}

const chromeSource = read('src/components/SiteChrome.tsx');
const mobilePanelSource = read('abhijeetvarghese/css/mobile-menu-panel.css');
if (/mobile-menu__ordinal|mobile-menu__arrow|padStart\(2/.test(chromeSource)) {
  failures.push('Responsive menu numbering or duplicate ordinal presentation remains in React markup.');
}
if (!mobilePanelSource.includes('@media (max-width: 900px)')) {
  failures.push('The shared mobile/tablet menu panel is not bounded to the approved 320–900px tier.');
}
if (/mobile-menu__ordinal|mobile-menu__list(?:[^{]+)?\bem\b/.test(mobilePanelSource)) {
  failures.push('The shared menu panel retains ordinal presentation CSS.');
}
const indexSource = read('index.html');
const removedCompactLoaderMarkers = [
  "matchMedia('(max-width: 700px)')",
  "loader.classList.add('is-compact')",
  'setTimeout(complete, reduced ? 220 : 640)',
  'AV / 01',
  'CREATIVE SYSTEMS',
];
for (const marker of removedCompactLoaderMarkers) {
  if (indexSource.includes(marker)) failures.push(`Removed compact phone-loader marker remains: ${marker}`);
}
for (const loaderContract of [
  "matchMedia('(prefers-reduced-motion: reduce)')",
  "setTimeout(function () { loader.classList.add('is-merge'); }, 720)",
  'setTimeout(complete, 1450)',
  'av-loader-seen-v1',
  "sessionStorage.getItem('av-loader-seen-v1')",
  "d.classList.contains('av-loader-seen')",
  "d.classList.add('av-done')",
]) {
  if (!indexSource.includes(loaderContract)) failures.push(`Shared loader contract is missing: ${loaderContract}`);
}
const publicNavigationDocuments = walk(resolve(root, 'abhijeetvarghese')).filter((file) => file.endsWith('.html') && read(file).includes('id="navToggle"'));
for (const documentPath of publicNavigationDocuments) {
  const documentSource = read(documentPath);
  if (/<em>0[1-4]<\/em>|mobile-menu__ordinal/.test(documentSource)) {
    failures.push(`Public navigation document retains mobile menu ordinals: ${documentPath}`);
  }
  if (!documentSource.includes('/css/mobile-menu-panel.css?v=1.0.0')) {
    failures.push(`Public navigation document is missing the shared mobile menu panel: ${documentPath}`);
  }
}
if (!read('src/hooks/useElevate.ts').includes("matchMedia('(max-width: 900px)')")) {
  failures.push('Responsive trigger direction handling no longer reaches the full tablet tier.');
}

const distIndex = resolve(root, 'dist/index.html');
if (!existsSync(distIndex)) {
  failures.push('Build output is missing: dist/index.html');
} else {
  const built = read('dist/index.html');
  if (!built.includes('type="module"')) failures.push('Built homepage has no module entry.');
  if (built.includes('/js/main.js') || built.includes('/js/elevate.js') || built.includes('/js/home-mobile.js')) {
    failures.push('Built React homepage still loads legacy homepage runtime.');
  }
  if (!built.includes('emailjs-fallback.js')) failures.push('Built homepage lost the conditional EmailJS fallback.');
  if (!built.includes('av-loader-seen-v1')) failures.push('Built homepage lost the loader-once session gate.');
  const positions = approvedStylesheets.map((stylesheet) => built.indexOf(stylesheet));
  if (positions.some((position) => position < 0)) failures.push('Built homepage lost part of the approved visual CSS cascade.');
  if (positions.some((position, index) => index > 0 && position < positions[index - 1])) {
    failures.push('Built homepage changed the approved visual CSS cascade order.');
  }
}

if (failures.length) {
  console.error('Homepage validation failed:');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(`Homepage validation passed: ${requiredAssets.size} React-referenced assets verified; intentional migration deltas confirmed.`);
