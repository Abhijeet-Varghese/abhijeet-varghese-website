/**
 * AV OS — static ↔ runtime content parity checker (Phase 3 §8).
 *
 * Compares the build-time static snapshot (`src/content/*`) against the
 * runtime `GET /api/v1/content` payload (validated + adapted), and reports
 * every divergence as MATCH / MISSING / EXTRA / DIFFERENT / UNMAPPED.
 *
 * Usage:
 *   npx tsx scripts/parity-check.ts                  # fetch http://127.0.0.1:8092/api/v1/content
 *   npx tsx scripts/parity-check.ts <url|file.json>  # explicit source
 *
 * Exit code 0 when no DIFFERENT/MISSING; 1 otherwise (so CI can gate on it).
 */
import { readFileSync } from 'node:fs';
import { STATIC_CONTENT, type ContentDocument } from '../src/content/static-snapshot';
import { validateContentPayload, describeValidation } from '../src/content/schema';
import { adaptContentPayload } from '../src/content/adapt';
import { mergeContent } from '../src/content/merge';

type Status = 'MATCH' | 'MISSING' | 'EXTRA' | 'DIFFERENT' | 'UNMAPPED' | 'DERIVED';

interface DiffEntry {
  status: Status;
  path: string;
  staticVal?: unknown;
  runtimeVal?: unknown;
}

/* ------------------------------------------------------------------ */
/* derived/hardcoded renderer fields — not CMS content, excluded from   */
/* the MISSING/DIFFERENT/UNMAPPED target                                */
/* ------------------------------------------------------------------ */

/** per-article SEO is derived at render time by articleSeo() (prerender only). */
const DERIVED_ARTICLE_SEO = /^articles\..*\.seo$/;
/** build-time chrome constant (home link) — not CMS-managed. */
const DERIVED_EXPORTS = [
  'chrome.CHROME.brandHref',
];

function isDerived(path: string): boolean {
  if (DERIVED_ARTICLE_SEO.test(path)) return true;
  for (const k of DERIVED_EXPORTS) {
    if (path === k || path.startsWith(k + '.') || path.startsWith(k + '[')) return true;
  }
  return false;
}

/* ------------------------------------------------------------------ */
/* deep diff (leaf-level, path-based)                                   */
/* ------------------------------------------------------------------ */

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function stringify(v: unknown, max = 120): string {
  const s = typeof v === 'string' ? v : JSON.stringify(v);
  return s === undefined ? String(v) : s.length > max ? s.slice(0, max) + '…' : s;
}

function diffLeaves(
  a: unknown,
  b: unknown,
  path: string,
  out: DiffEntry[],
  seen: Set<string>,
): void {
  // equal → MATCH
  if (a === b) return;

  if (Array.isArray(a) && Array.isArray(b)) {
    const n = Math.max(a.length, b.length);
    for (let i = 0; i < n; i++) {
      if (i >= a.length) {
        out.push({ status: 'EXTRA', path: `${path}[${i}]`, runtimeVal: b[i] });
      } else if (i >= b.length) {
        out.push({ status: 'MISSING', path: `${path}[${i}]`, staticVal: a[i] });
      } else {
        diffLeaves(a[i], b[i], `${path}[${i}]`, out, seen);
      }
    }
    return;
  }

  if (isPlainObject(a) && isPlainObject(b)) {
    const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
    for (const k of keys) {
      const hasA = k in a;
      const hasB = k in b;
      const p = path === '' ? k : `${path}.${k}`;
      if (isDerived(p)) {
        out.push({ status: 'DERIVED', path: p });
        continue;
      }
      if (!hasA) {
        out.push({ status: 'EXTRA', path: p, runtimeVal: b[k] });
      } else if (!hasB || b[k] === undefined) {
        out.push({ status: 'MISSING', path: p, staticVal: a[k] });
      } else {
        diffLeaves(a[k], b[k], p, out, seen);
      }
    }
    return;
  }

  // scalar / type mismatch → DIFFERENT
  out.push({ status: 'DIFFERENT', path, staticVal: a, runtimeVal: b });
}

/* ------------------------------------------------------------------ */
/* report                                                               */
/* ------------------------------------------------------------------ */

function summarize(entries: DiffEntry[]): Record<Status, number> {
  const counts: Record<Status, number> = { MATCH: 0, MISSING: 0, EXTRA: 0, DIFFERENT: 0, UNMAPPED: 0, DERIVED: 0 };
  for (const e of entries) counts[e.status] += 1;
  return counts;
}

async function main(): Promise<void> {
  const source = process.argv[2] ?? 'http://127.0.0.1:8092/api/v1/content';

  // ---- fetch / read the runtime payload ----
  let raw: unknown;
  if (source.startsWith('http://') || source.startsWith('https://')) {
    const res = await fetch(source);
    if (!res.ok) {
      console.error(`✗ could not fetch ${source}: HTTP ${res.status}`);
      process.exit(2);
    }
    raw = await res.json();
  } else {
    raw = JSON.parse(readFileSync(source, 'utf8'));
  }

  // ---- validate ----
  const { payload, result } = validateContentPayload(raw);
  if (!result.ok || !payload) {
    console.error('✗ runtime payload failed validation:', describeValidation(result));
    process.exit(2);
  }
  console.log('· runtime payload validated:', describeValidation(result));

  // ---- adapt + merge over static (same merge the loader uses) ----
  const { content: adapted, report } = adaptContentPayload(payload);
  const merged = mergeContent(adapted);

  console.log('· adapted collections:', report.adapted.join(', '));
  console.log('· unmapped collections (no CMS equivalent):', report.unmapped.join(', '));
  console.log('');

  // ---- diff per collection ----
  const all: DiffEntry[] = [];
  const byCollection: Record<string, DiffEntry[]> = {};

  for (const key of Object.keys(STATIC_CONTENT) as (keyof ContentDocument)[]) {
    if (report.unmapped.includes(key)) {
      // whole collection has no CMS source → UNMAPPED
      byCollection[key] = [{ status: 'UNMAPPED', path: key }];
      continue;
    }
    const entries: DiffEntry[] = [];
    diffLeaves(STATIC_CONTENT[key], merged[key], key, entries, new Set());
    byCollection[key] = entries;
    all.push(...entries);
  }

  // ---- print ----
  console.log('== Parity report (static vs runtime) ==\n');
  interface Row { collection: string; match: number; missing: number; extra: number; different: number; unmapped: number; derived: number; leaves: number }
  const rows: Row[] = [];
  for (const [col, entries] of Object.entries(byCollection)) {
    const c = summarize(entries);
    const leaves = countLeaves(STATIC_CONTENT[col as keyof ContentDocument]);
    const match = c.UNMAPPED > 0 ? 0 : Math.max(0, leaves - c.MISSING - c.EXTRA - c.DIFFERENT - c.DERIVED);
    rows.push({ collection: col, match, missing: c.MISSING, extra: c.EXTRA, different: c.DIFFERENT, unmapped: c.UNMAPPED, derived: c.DERIVED, leaves });
  }

  const table: string[][] = [['collection', 'MATCH', 'MISSING', 'EXTRA', 'DIFFERENT', 'DERIVED', 'UNMAPPED', 'leaves']];
  for (const r of rows) table.push([r.collection, String(r.match), String(r.missing), String(r.extra), String(r.different), String(r.derived), String(r.unmapped), String(r.leaves)]);
  printTable(table);

  const totals = {
    match: rows.reduce((n, r) => n + r.match, 0),
    missing: rows.reduce((n, r) => n + r.missing, 0),
    extra: rows.reduce((n, r) => n + r.extra, 0),
    different: rows.reduce((n, r) => n + r.different, 0),
    unmapped: rows.reduce((n, r) => n + r.unmapped, 0),
    derived: rows.reduce((n, r) => n + r.derived, 0),
    leaves: rows.reduce((n, r) => n + r.leaves, 0),
  };
  console.log('');
  console.log(`TOTALS → MATCH ${totals.match} · MISSING ${totals.missing} · EXTRA ${totals.extra} · DIFFERENT ${totals.different} · DERIVED ${totals.derived} · UNMAPPED ${totals.unmapped} (of ${totals.leaves} static leaves)`);

  // ---- detail: DIFFERENT first (highest signal), then MISSING sample ----
  const different = all.filter((e) => e.status === 'DIFFERENT');
  const missing = all.filter((e) => e.status === 'MISSING');
  const extra = all.filter((e) => e.status === 'EXTRA');

  if (different.length) {
    console.log('\n── DIFFERENT (static → runtime) ──');
    for (const e of different.slice(0, 120)) {
      console.log(`  ${e.path}\n    static : ${stringify(e.staticVal)}\n    runtime: ${stringify(e.runtimeVal)}`);
    }
    if (different.length > 120) console.log(`  … and ${different.length - 120} more DIFFERENT fields`);
  }
  if (missing.length) {
    console.log(`\n── MISSING in runtime (${missing.length} fields — sample) ──`);
    for (const e of missing.slice(0, 40)) {
      console.log(`  ${e.path}  (static: ${stringify(e.staticVal, 60)})`);
    }
  }
  if (extra.length) {
    console.log(`\n── EXTRA in runtime (${extra.length} fields — sample) ──`);
    for (const e of extra.slice(0, 20)) {
      console.log(`  ${e.path}  (runtime: ${stringify(e.runtimeVal, 60)})`);
    }
  }

  console.log('\nNote: MATCH counts leaves that are byte-identical between the static snapshot\nand the adapted runtime content. UNMAPPED = collections with no CMS equivalent yet.\n');

  process.exit(totals.different + totals.missing === 0 ? 0 : 1);
}

function countLeaves(v: unknown): number {
  if (Array.isArray(v)) return v.reduce<number>((n, x) => n + countLeaves(x), 0);
  if (isPlainObject(v)) return Object.values(v).reduce<number>((n, x) => n + countLeaves(x), 0);
  return 1;
}

function printTable(rows: string[][]): void {
  const first = rows[0] ?? [];
  const w = first.map((_, i) => Math.max(...rows.map((r) => (r[i] ?? '').length)));
  for (const r of rows) {
    console.log('  ' + r.map((c, i) => c.padEnd(w[i] ?? 0)).join('  '));
  }
}

void main();
