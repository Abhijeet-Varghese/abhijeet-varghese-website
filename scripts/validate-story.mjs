import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();
const read = (path) => readFileSync(resolve(root, path), 'utf8');
const story = read('story/index.html');
const storyEntry = read('src/story-main.tsx');
const storyReactStyles = read('src/styles/react-story.css');
const vite = read('vite.config.ts');
const sitemap = read('abhijeetvarghese/sitemap.xml');
const failures = [];

for (const asset of [
  '/assets/hero-portrait.webp',
  '/assets/about/about-motion.webp',
  '/assets/about/about-experience.webp',
  '/assets/about/about-environment.webp',
  '/assets/about/about-people.webp',
  '/assets/about/about-leadership.webp',
  '/assets/about/about-credits.webp',
]) {
  if (!existsSync(resolve(root, 'abhijeetvarghese', asset.slice(1)))) failures.push(`Missing Story asset: ${asset}`);
}

for (const marker of [
  '<body id="top" class="about-page about-films mobile-chrome">',
  'id="avLoader"',
  'id="readingProgress"',
  '<a class="skip-link" href="#main">',
  '<div id="root"></div>',
  'src="/src/story-main.tsx"',
  'href="https://abhijeetvarghese.com/story/"',
  'property="og:url" content="https://abhijeetvarghese.com/story/"',
  '"@type":"AboutPage"',
  '"@type":"BreadcrumbList"',
]) {
  if (!story.includes(marker)) failures.push(`Story entry is missing required contract: ${marker}`);
}

const storyStyles = [
  '/css/styles.css?v=4.6.1',
  '/css/elevate.css?v=4.4.1',
  '/css/mobile-chrome.css?v=2.0.0',
  '/css/mobile-menu-panel.css?v=1.0.0',
];
const positions = storyStyles.map((style) => story.indexOf(style));
if (positions.some((position) => position < 0)) failures.push('Story entry is missing an approved Story stylesheet.');
if (positions.some((position, index) => index > 0 && position < positions[index - 1])) failures.push('Story stylesheet cascade order changed.');
if (story.includes('/css/home-mobile.css')) failures.push('Story entry incorrectly loads home-mobile.css.');
if (!storyEntry.includes("import './styles/react-story.css'")) failures.push('Story entry does not load its scoped React mobile footer overrides.');
if (!/body\.about-page\.mobile-chrome \.footer--arena \.footer__inner::before\s*\{\s*content:\s*none;\s*display:\s*none;/m.test(storyReactStyles)) {
  failures.push('Story mobile Final Chapter cue is not removed at its originating pseudo-element.');
}
for (const loaderContract of [
  'av-loader-seen-v1',
  "sessionStorage.getItem('av-loader-seen-v1')",
  'html.av-loader-seen .av-loader{display:none!important}',
  "d.classList.contains('av-loader-seen')",
  "d.classList.add('av-done')",
]) {
  if (!story.includes(loaderContract)) failures.push(`Story loader-once contract is missing: ${loaderContract}`);
}
for (const legacyRuntime of ['/js/main.js', '/js/elevate.js', '/js/mobile-chrome.js']) {
  if (story.includes(legacyRuntime)) failures.push(`Story entry still loads legacy runtime: ${legacyRuntime}`);
}

if (!vite.includes("storyEntry = resolve(projectRoot, 'story/index.html')")) failures.push('Vite has no Story MPA entry.');
if (!vite.includes('story: storyEntry')) failures.push('Vite rollup input is missing the Story page.');
if (!vite.includes("pathname === '/story/'")) failures.push('Vite legacy middleware does not reserve the React Story route.');
if (!sitemap.includes('https://abhijeetvarghese.com/story/')) failures.push('Sitemap does not use the clean Story route.');
if (sitemap.includes('https://abhijeetvarghese.com/story.html')) failures.push('Sitemap still exposes the obsolete Story HTML route.');

const built = resolve(root, 'dist/story/index.html');
if (!existsSync(built)) {
  failures.push('Build output is missing: dist/story/index.html');
} else {
  const output = read('dist/story/index.html');
  if (!output.includes('type="module"')) failures.push('Built Story page has no module entry.');
  if (output.includes('/js/main.js') || output.includes('/js/elevate.js') || output.includes('/js/mobile-chrome.js')) {
    failures.push('Built Story page loads legacy Story runtime.');
  }
  if (!output.includes('https://abhijeetvarghese.com/story/')) failures.push('Built Story page lost clean canonical metadata.');
  if (!output.includes('av-loader-seen-v1')) failures.push('Built Story page lost the loader-once session gate.');
}

if (failures.length) {
  console.error('Story validation failed:');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log('Story validation passed: MPA routing, SEO, shared shell, source assets, and CSS/runtime contracts are intact.');
