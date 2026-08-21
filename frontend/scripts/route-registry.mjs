import routes from '../src/routes/routes.json' with { type: 'json' };

/**
 * Node-side view of the route registry.
 *
 * Deliberately re-exports `src/routes/routes.json` — the SAME file the browser
 * bundle reads through `src/routes/registry.ts`. There is exactly one route
 * table in this repository.
 */
export const ROUTES = routes;

/** Absolute clean URL for a route. */
export const urlFor = (origin, r) => origin.replace(/\/$/, '') + (r.clean === '/' ? '/' : r.clean);
