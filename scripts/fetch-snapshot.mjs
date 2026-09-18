// Refreshes src/data/snapshot.json from the live backend (documented fallback).
// Usage: VITE_API_BASE=https://... node scripts/fetch-snapshot.mjs
import { writeFileSync } from 'node:fs';
const base = process.env.VITE_API_BASE || 'http://127.0.0.1:8093';
const res = await fetch(base + '/api/public/content');
const json = await res.json();
if (!json.ok) throw new Error('API returned ok:false');
writeFileSync(new URL('../src/data/snapshot.json', import.meta.url), JSON.stringify(json.data, null, 1));
console.log('snapshot updated:', Object.keys(json.data.content).join(', '));
