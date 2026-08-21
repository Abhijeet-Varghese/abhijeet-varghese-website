/**
 * AV OS — content layer tests (Phase 3 §5, §11).
 *
 * Covers: schema validation, adapter mapping, loader failure/fallback modes
 * (A–H), and React provider consumption. Run with:
 *
 *   npx tsx tests/content-layer.test.ts
 *
 * Plain assertions (no test framework) so it runs anywhere tsx does.
 */
import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import {
  validateContentPayload,
  CONTENT_SCHEMA,
  type ApiContentPayload,
} from '../src/content/schema';
import { adaptContentPayload } from '../src/content/adapt';
import { ContentLoader, STATIC_CONTENT, CONTENT_ENDPOINT } from '../src/content/loader';
import { CMSContentProvider, useContent } from '../src/content/provider';

/* ------------------------------------------------------------------ */
/* tiny assertion harness                                               */
/* ------------------------------------------------------------------ */

let passed = 0;
let failed = 0;
function check(name: string, cond: boolean, detail = ''): void {
  if (cond) {
    passed += 1;
    console.log(`  ✓ ${name}`);
  } else {
    failed += 1;
    console.log(`  ✗ ${name}${detail ? ' — ' + detail : ''}`);
  }
}

function okEnvelope(data: Partial<ApiContentPayload>): unknown {
  return { ok: true, data, error: null };
}

/* ------------------------------------------------------------------ */
/* 1. schema validation                                                 */
/* ------------------------------------------------------------------ */

console.log('── 1. schema validation ──');

const validPayload: ApiContentPayload = {
  schema: CONTENT_SCHEMA,
  schemaVersion: 1,
  revision: 3,
  settings: { siteName: 'Abhijeet Varghese' },
  navigation: { primary: [], footerColumns: [] },
  sections: [],
  pages: [],
  projects: [{ id: 'p1', title: 'T', status: 'published' }],
  articles: [{ id: 'a1', title: 'A', status: 'draft' }],
  clients: [],
  testimonials: [],
  media: [],
  seo: [],
  downloads: [],
};

{
  const { payload, result } = validateContentPayload(okEnvelope(validPayload));
  check('valid payload accepted', result.ok === true && payload !== null);
  check('draft article filtered', (result.filtered.articles ?? 0) === 1 && payload?.articles?.length === 0);
}

{
  const bad = okEnvelope({ ...validPayload, schema: 'wrong.schema/v9' });
  const { result } = validateContentPayload(bad);
  check('wrong schema rejected', result.ok === false && result.errors.some((e) => e.includes('schema')));
}

{
  const bad = okEnvelope({ ...validPayload, schemaVersion: 99 });
  const { result } = validateContentPayload(bad);
  check('unsupported schemaVersion rejected', result.ok === false);
}

{
  const bad = okEnvelope({ ...validPayload, projects: 'not-an-array' });
  const { result } = validateContentPayload(bad);
  check('non-array collection rejected', result.ok === false && result.errors.some((e) => e.includes('projects')));
}

{
  const { result } = validateContentPayload({ ok: false, data: null, error: { code: 'X' } });
  check('ok:false envelope rejected', result.ok === false);
}

{
  const { result } = validateContentPayload('garbage');
  check('non-object rejected', result.ok === false);
}

/* ------------------------------------------------------------------ */
/* 2. adapter mapping                                                   */
/* ------------------------------------------------------------------ */

console.log('── 2. adapter mapping ──');

const api: ApiContentPayload = {
  schema: CONTENT_SCHEMA,
  schemaVersion: 1,
  revision: 1,
  settings: { siteName: 'Abhijeet Varghese', tagline: 'Making ambitious ideas impossible to misunderstand.', email: 'hi@abhijeetvarghese.com', phone: '+91-96940 80706' },
  navigation: {
    primary: [{ id: 'n1', label: 'Story', href: 'story.html' }],
    footerColumns: [{ label: 'Menu', links: [{ label: 'Story', href: 'story.html' }] }],
    copyright: '© 2026',
  },
  sections: [
    { type: 'hero', status: 'published', title: 'Making ambitious ideas impossible to misunderstand.', lede: 'The most meaningful work…', roles: ['Creative Systems Leader'] },
  ],
  projects: [
    { id: 'prj-1', slug: 'orange-x', client: 'Orange Business', industry: 'Experience Design', title: 'Orange EBC', status: 'published', challenge: 'Transform briefing', approach: 'Connect objectives', outcome: 'Connected experience', role: 'Lead', year: '2025', summary: 'A strategy-led experience', image: 'media/x.webp', imageAlt: 'alt' },
    { id: 'prj-9', slug: '', client: 'Hidden', title: 'Draft Project', status: 'draft' },
  ],
  articles: [
    { slug: 'essay-x', type: 'essay', status: 'published', title: 'Essay X', excerpt: 'ex', category: 'Design', body: 'Para one.\n\nPara two.', date: '2026-01-01' },
  ],
  clients: [{ id: 'c1', name: 'Amazon', logo: 'amazon.webp' }],
};

{
  const { content, report } = adaptContentPayload(api);
  check('adapts chrome', report.adapted.includes('chrome') && content.chrome?.CHROME?.brandLabel === 'Abhijeet Varghese');
  check('projects: industry→category', content.projects?.PROJECTS?.[0]?.category === 'Experience Design');
  check('projects: challenge→problem', content.projects?.PROJECTS?.[0]?.problem === 'Transform briefing');
  check('articles: type→kind', content.articles?.ARTICLES?.[0]?.kind === 'essay');
  check('articles: body→paragraphs', content.articles?.ARTICLES?.[0]?.paragraphs?.length === 2);
  check('clients: logo→file', (content.home?.CLIENTS as { logos?: { file: string }[] })?.logos?.[0]?.file === 'amazon.webp');
  check('unmapped collections reported', report.unmapped.includes('experience') && report.unmapped.includes('story'));
}

/* ------------------------------------------------------------------ */
/* 3. loader failure modes (A–H)                                        */
/* ------------------------------------------------------------------ */

console.log('── 3. loader failure / fallback modes ──');

function jsonResponse(body: unknown, status = 200, etag?: string): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: etag ? { 'Content-Type': 'application/json', ETag: etag } : { 'Content-Type': 'application/json' },
  });
}

// A. API works → runtime mode
{
  const l = new ContentLoader(async () => jsonResponse(okEnvelope(validPayload)));
  await l.init();
  check('A. API works → runtime content', l.state.phase === 'runtime' && l.state.source === 'runtime');
}

// B. API unavailable (network error) → fallback
{
  const l = new ContentLoader(async () => { throw new Error('fetch failed'); });
  await l.init();
  check('B. API unavailable → static fallback', l.state.phase === 'fallback' && l.state.source === 'static' && l.getContent() === STATIC_CONTENT);
}

// C. API returns malformed data → fallback
{
  const l = new ContentLoader(async () => jsonResponse(okEnvelope({ schema: 'nope', schemaVersion: 0 } as never)));
  await l.init();
  check('C. malformed data → fallback', l.state.phase === 'fallback' && l.state.source === 'static');
}

// D. API returns empty content (valid envelope, empty collections) → stays usable (static)
{
  const l = new ContentLoader(async () => jsonResponse(okEnvelope({ schema: CONTENT_SCHEMA, schemaVersion: 1, revision: 1, sections: [], pages: [], projects: [], articles: [], clients: [], testimonials: [], media: [], seo: [], downloads: [] })));
  await l.init();
  // runtime mode but with empty collections → merged content === static (nothing overridden)
  check('D. empty content → usable, no blank site', l.state.phase === 'runtime' && l.getContent().home === STATIC_CONTENT.home);
}

// E. database unavailable → server 5xx → fallback
{
  const l = new ContentLoader(async () => jsonResponse({ ok: false, data: null, error: { code: 'SERVER_ERROR' } }, 500));
  await l.init();
  check('E. server 5xx → fallback', l.state.phase === 'fallback' && l.state.source === 'static');
}

// F. stale cached content: second fetch within TTL is skipped (served from cache)
{
  let calls = 0;
  const l = new ContentLoader(async () => { calls += 1; return jsonResponse(okEnvelope(validPayload), 200, '"etag-1"'); });
  await l.init();
  await l.init(); // within fresh TTL → should not re-fetch
  check('F. cached content served (no refetch within TTL)', calls === 1 && l.state.source === 'runtime');
}

// G. unpublished content excluded end-to-end (validation filters drafts)
{
  const withDraft = { ...validPayload, projects: [{ id: 'p1', status: 'published', title: 'Live' }, { id: 'p2', status: 'draft', title: 'Draft' }] };
  const { result } = validateContentPayload(okEnvelope(withDraft));
  check('G. unpublished (draft) content filtered', result.filtered.projects === 1);
}

// H. invalid media reference: a runtime image path that is not a known asset still loads (no crash), loader does not reject the payload
{
  const withBadMedia = { ...validPayload, projects: [{ id: 'p1', status: 'published', title: 'T', image: 'media/does-not-exist.webp' }] };
  const l = new ContentLoader(async () => jsonResponse(okEnvelope(withBadMedia)));
  await l.init();
  check('H. invalid media reference → no crash (fallback-safe)', l.state.phase === 'runtime');
}

// timeout: a hung fetch is aborted → fallback (budget: FETCH_TIMEOUT_MS)
{
  const l = new ContentLoader(async () => new Promise<Response>((_, reject) => { const t = setTimeout(() => reject(new Error('aborted')), 4500); /* never resolves before timeout */ void t; }));
  const start = Date.now();
  await l.init();
  check('timeout → fallback without hang', l.state.phase === 'fallback' && Date.now() - start < 5000);
}

/* ------------------------------------------------------------------ */
/* 4. provider consumption (React)                                      */
/* ------------------------------------------------------------------ */

console.log('── 4. provider / useContent ──');

function Probe(): React.ReactElement {
  const { content, state } = useContent();
  return createElement('div', { 'data-source': state.source }, content.home.HERO.seoLine);
}

// static (default) → renders static content
{
  const html = renderToStaticMarkup(createElement(CMSContentProvider, {}, createElement(Probe)));
  check('provider renders static fallback by default', html.includes('data-source="static"') && html.includes('Making ambitious ideas impossible to misunderstand.'));
}

console.log(`\n────────────────────────────────────────`);
console.log(`  ${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
