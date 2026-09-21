import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';

const loaderKey = 'av-loader-seen-v1';

function createSessionStorage(backing) {
  return {
    getItem(key) {
      return backing.has(key) ? backing.get(key) : null;
    },
    setItem(key, value) {
      backing.set(String(key), String(value));
    },
    removeItem(key) {
      backing.delete(key);
    },
    clear() {
      backing.clear();
    },
  };
}

function loadDocument(file, path, backing) {
  const html = readFileSync(file, 'utf8');
  return new JSDOM(html, {
    url: `https://abhijeetvarghese.com${path}`,
    runScripts: 'dangerously',
    beforeParse(window) {
      Object.defineProperty(window, 'sessionStorage', {
        configurable: true,
        value: createSessionStorage(backing),
      });
      window.matchMedia = () => ({ matches: false });
      // The first-view assertions intentionally inspect the loader before its
      // animation completes, so timer callbacks do not need to run here.
      window.setTimeout = () => 0;
      window.clearTimeout = () => undefined;
    },
  });
}

function assertFirstView(document, label) {
  assert.equal(document.documentElement.classList.contains('av-loader-seen'), false, `${label}: first view was incorrectly treated as seen`);
  assert.equal(document.documentElement.classList.contains('av-loading'), true, `${label}: first view did not start the loader`);
  assert(document.getElementById('avLoader'), `${label}: first view removed the loader too early`);
}

function assertFollowUpView(document, label) {
  assert.equal(document.documentElement.classList.contains('av-loader-seen'), true, `${label}: follow-up view did not read the shared session flag`);
  assert.equal(document.documentElement.classList.contains('av-loading'), false, `${label}: follow-up view still locked the document`);
  assert.equal(document.documentElement.classList.contains('av-done'), true, `${label}: follow-up view did not settle the loader state`);
  assert.equal(document.getElementById('avLoader'), null, `${label}: follow-up view still rendered the loader`);
}

const homeFile = new URL('../index.html', import.meta.url);
const storyFile = new URL('../story/index.html', import.meta.url);

const homeFirstSession = new Map();
const homeFirst = loadDocument(homeFile, '/', homeFirstSession);
assertFirstView(homeFirst.window.document, 'homepage');
assert.equal(homeFirstSession.get(loaderKey), '1', 'homepage did not persist the loader session flag');
const homeReload = loadDocument(homeFile, '/', homeFirstSession);
assertFollowUpView(homeReload.window.document, 'homepage reload');
const storyAfterHome = loadDocument(storyFile, '/story/', homeFirstSession);
assertFollowUpView(storyAfterHome.window.document, 'Story after homepage');

const storyFirstSession = new Map();
const storyFirst = loadDocument(storyFile, '/story/', storyFirstSession);
assertFirstView(storyFirst.window.document, 'Story');
assert.equal(storyFirstSession.get(loaderKey), '1', 'Story did not persist the loader session flag');
const storyReload = loadDocument(storyFile, '/story/', storyFirstSession);
assertFollowUpView(storyReload.window.document, 'Story reload');
const homeAfterStory = loadDocument(homeFile, '/', storyFirstSession);
assertFollowUpView(homeAfterStory.window.document, 'homepage after Story');

homeFirst.window.close();
homeReload.window.close();
storyAfterHome.window.close();
storyFirst.window.close();
storyReload.window.close();
homeAfterStory.window.close();

console.log('Loader-once regression passed: the first document animates the loader and all later homepage/Story documents in the same session skip it.');
