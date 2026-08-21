/**
 * AV OS admin — capability/feature-flag foundation (Phase 5 §33).
 *
 * Server-side flags come from GET /api/flags (the backend is authoritative);
 * this module adds client-side capability gates for future modules that are
 * architecturally planned but NOT implemented. Flags never disguise missing
 * functionality — gated modules are simply not rendered until they exist.
 */

export interface Capability {
  key: string;
  label: string;
  /** planned (not yet implemented) — never exposed as a working feature */
  available: boolean;
}

export const CAPABILITIES: Record<string, Capability> = {
  dashboard: { key: 'dashboard', label: 'Dashboard', available: true },
  pages: { key: 'pages', label: 'Pages', available: true },
  navigation: { key: 'navigation', label: 'Navigation', available: true },
  projects: { key: 'projects', label: 'Projects', available: true },
  articles: { key: 'articles', label: 'Journal', available: true },
  clients: { key: 'clients', label: 'Clients', available: true },
  experience: { key: 'experience', label: 'Experience', available: true },
  media: { key: 'media', label: 'Media Library', available: true },
  settings: { key: 'settings', label: 'Settings', available: true },
  revisions: { key: 'revisions', label: 'Revisions', available: true },
  search: { key: 'search', label: 'Search', available: true },

  // ---- future modules (planned, NOT implemented in Phase 5) ----
  visualBuilder: { key: 'visualBuilder', label: 'Visual Builder', available: false },
  designSystem: { key: 'designSystem', label: 'Design System', available: false },
  webglStudio: { key: 'webglStudio', label: 'WebGL Studio', available: false },
  aiStudio: { key: 'aiStudio', label: 'AI Studio', available: false },
  booking: { key: 'booking', label: 'Booking', available: false },
  crm: { key: 'crm', label: 'CRM', available: false },
  customContentTypes: { key: 'customContentTypes', label: 'Custom Content', available: false },
};

/** Is a capability implemented and available in the current build? */
export function capabilityAvailable(key: string): boolean {
  return CAPABILITIES[key]?.available === true;
}
