/**
 * AV OS admin — foundation unit tests (Phase 5 §42).
 * Pure-logic modules: permissions, save-state, feature flags, and the API
 * client (against a mocked fetch). Run: npx tsx tests/foundation.test.ts
 */
import { missingPermission } from '../src/permissions/usePermissions';
import { isDirty, saveStateInfo } from '../src/state/editor';
import { capabilityAvailable } from '../src/features';
import { ApiError, apiGet, apiSend, CsrfStore } from '../src/api/client';

let pass = 0, fail = 0;
const check = (name: string, cond: boolean, detail = '') => {
  if (cond) { pass++; console.log(`  ✓ ${name}`); }
  else { fail++; console.log(`  ✗ ${name}${detail ? ' — ' + detail : ''}`); }
};

/* ---- permissions ---- */
console.log('── permissions (RBAC UX) ──');
check('super admin bypasses', missingPermission(['content.write'], [], true) === null);
check('missing permission detected', missingPermission(['content.write'], ['content.read'], false) === 'content.write');
check('granted permission passes', missingPermission(['content.read'], ['content.read'], false) === null);

/* ---- save state ---- */
console.log('── save state ──');
check('isDirty detects change', isDirty({ a: 1 }, { a: 2 }) === true);
check('isDirty false when equal', isDirty({ a: 1 }, { a: 1 }) === false);
check('save state labels', saveStateInfo('saving').label === 'Saving…' && saveStateInfo('failed').label === 'Save failed');

/* ---- feature flags ---- */
console.log('── feature flags ──');
check('dashboard available', capabilityAvailable('dashboard') === true);
check('visualBuilder NOT available (planned)', capabilityAvailable('visualBuilder') === false);
check('webglStudio NOT available (planned)', capabilityAvailable('webglStudio') === false);

/* ---- API client (mock fetch) ---- */
console.log('── API client ──');
const okRes = (body: unknown, status = 200, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...headers } });

// @ts-expect-error — replacing global fetch for the test
globalThis.fetch = async () => okRes({ ok: true, data: { hello: 'world' }, error: null });

const data = await apiGet<{ hello: string }>('/session');
check('apiGet returns typed data', data.hello === 'world');

// @ts-expect-error
globalThis.fetch = async () => okRes({ ok: false, data: null, error: { code: 'FORBIDDEN', message: 'Forbidden' } }, 403, { 'X-Request-Id': 'AV-123' });
try {
  await apiGet('/content');
  check('apiGet throws on error', false);
} catch (e) {
  check('apiGet throws on error', e instanceof ApiError);
  check('ApiError carries request id', (e as ApiError).requestId === 'AV-123');
  check('ApiError safe message', (e as ApiError).safeMessage === 'You do not have permission to do that.');
}

// CSRF injection on mutations
CsrfStore.set('tok-123');
let sentMethod = ''; let sentCsrf = '';
// @ts-expect-error
globalThis.fetch = async (url: string, init: RequestInit) => {
  sentMethod = (init.method as string) ?? '';
  sentCsrf = ((init.headers as Record<string, string>)['X-CSRF-Token']) ?? '';
  return okRes({ ok: true, data: { ok: true }, error: null });
};
await apiSend('PUT', '/content', { projects: [] });
check('mutation sends CSRF header', sentCsrf === 'tok-123');
check('mutation uses PUT', sentMethod === 'PUT');

// 401 → UNAUTHENTICATED
// @ts-expect-error
globalThis.fetch = async () => okRes({ ok: false, data: null, error: { code: 'UNAUTHENTICATED', message: 'Auth required' } }, 401);
try {
  await apiGet('/content');
  check('401 throws', false);
} catch (e) {
  check('401 → UNAUTHENTICATED safe message', (e as ApiError).safeMessage === 'Your session has expired — please sign in again.');
}

console.log(`\n────────────────────────────────────────`);
console.log(`  ${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
