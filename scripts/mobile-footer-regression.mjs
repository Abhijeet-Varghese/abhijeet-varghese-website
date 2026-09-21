import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

const root = process.cwd();
const footerStatement = 'Making ambitious ideas impossible to misunderstand.';
const footerAction = 'Start a conversation';

const read = (path) => readFileSync(resolve(root, path), 'utf8');

function walk(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolute = join(directory, entry.name);
    if (entry.isDirectory()) return walk(absolute);
    return [relative(root, absolute)];
  });
}

function assertMobileFooterRule(path, scope) {
  const css = read(path);
  const firstPhoneTier = css.indexOf('@media (max-width: 700px) {');
  const nextPhoneTier = css.indexOf('@media (max-width: 700px) {', firstPhoneTier + 1);
  const phoneTier = css.slice(firstPhoneTier, nextPhoneTier === -1 ? css.length : nextPhoneTier);
  const hiddenItems = `${scope} .footer--arena .footer__line,\n  ${scope} .footer--arena .footer__links a[href="/contact/"] {\n    display: none !important;\n  }`;

  assert(firstPhoneTier >= 0, `${path} has no phone media tier`);
  assert(phoneTier.includes(hiddenItems), `${path} does not hide both requested footer items on phones`);
  assert(phoneTier.includes(`${scope} .footer--arena .footer__brandtop {\n    order: 1;`), `${path} does not rebalance the remaining footer ledger`);
}

assertMobileFooterRule('abhijeetvarghese/css/home-mobile.css', 'body.home-arena');
assertMobileFooterRule('abhijeetvarghese/css/mobile-chrome.css', 'body.mobile-chrome');

const legacyFooterDocuments = walk(resolve(root, 'abhijeetvarghese'))
  .filter((path) => path.endsWith('.html'))
  .filter((path) => read(path).includes(`footer__line">${footerStatement}</p>`));
assert(legacyFooterDocuments.length > 0, 'No legacy footer documents were found.');

for (const documentPath of legacyFooterDocuments) {
  const document = read(documentPath);
  assert.match(document, new RegExp(`<a\\s+href="/contact/">${footerAction}</a>`), `${documentPath} has an unexpected footer action shape`);
  const hasHomeMobile = document.includes('/css/home-mobile.css');
  const hasMobileChrome = document.includes('/css/mobile-chrome.css');
  assert.notEqual(hasHomeMobile, hasMobileChrome, `${documentPath} is not covered by exactly one shared mobile footer stylesheet`);
  const expectedBodyClass = hasHomeMobile ? 'home-arena' : 'mobile-chrome';
  assert.match(document, new RegExp(`<body[^>]*class="[^"]*\\b${expectedBodyClass}\\b`), `${documentPath} does not expose the matching mobile footer scope`);
}

const reactFooter = read('src/components/SiteFooter.tsx');
assert(reactFooter.includes(footerStatement), 'React footer statement unexpectedly changed outside the mobile presentation layer.');
assert(reactFooter.includes(`>${footerAction}</a>`), 'React footer action unexpectedly changed outside the mobile presentation layer.');
assert(read('index.html').includes('/css/home-mobile.css?v=4.0.0'), 'React homepage does not load the shared home mobile stylesheet.');
for (const [path, label] of [
  ['story/index.html', 'Story'],
  ['experience/index.html', 'Experience'],
  ['case-studies/index.html', 'Case Studies'],
]) {
  const document = read(path);
  assert(document.includes('/css/mobile-chrome.css?v=2.0.0'), `React ${label} does not load the shared mobile chrome stylesheet.`);
  assert.match(document, /<body[^>]*class="[^"]*\bmobile-chrome\b/, `React ${label} does not expose the shared mobile footer scope.`);
}

const retiredSceneSelectors = [
  'src/hooks/useMobileChrome.ts',
  'src/hooks/useMobileHomeMotion.ts',
  'abhijeetvarghese/js/mobile-chrome.js',
  'abhijeetvarghese/js/home-mobile.js',
];
for (const path of retiredSceneSelectors) {
  const source = read(path);
  assert.equal(source.includes('.footer__line, .footer__links a[href'), false, `${path} still animates a mobile-footer item that is removed`);
}

for (const path of ['dist/css/home-mobile.css', 'dist/css/mobile-chrome.css']) {
  assert(existsSync(resolve(root, path)), `Build output is missing ${path}`);
}
assertMobileFooterRule('dist/css/home-mobile.css', 'body.home-arena');
assertMobileFooterRule('dist/css/mobile-chrome.css', 'body.mobile-chrome');

console.log(`Mobile footer regression passed: ${legacyFooterDocuments.length} legacy footer documents plus React Home, Story, Experience, and Case Studies hide the statement and footer contact CTA at phone widths.`);
