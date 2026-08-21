/**
 * AV OS admin — navigation model. Each item declares the permission(s) that
 * gate it (UX) and the capability it depends on. Only implemented modules are
 * listed; future modules are absent (not shown as dead links).
 */

export interface NavItem {
  to: string;
  label: string;
  icon: string;
  permission?: string;
  capability?: string;
  end?: boolean;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Overview',
    items: [
      { to: '/dashboard', label: 'Dashboard', icon: '▦', end: true },
    ],
  },
  {
    label: 'Website',
    items: [
      { to: '/pages', label: 'Pages', icon: '▤', permission: 'content.read' },
      { to: '/navigation', label: 'Navigation', icon: '☰', permission: 'content.read' },
      { to: '/media', label: 'Media', icon: '▨', permission: 'media.read' },
    ],
  },
  {
    label: 'Content',
    items: [
      { to: '/projects', label: 'Projects', icon: '◧', permission: 'content.read' },
      { to: '/articles', label: 'Journal', icon: '✎', permission: 'content.read' },
      { to: '/clients', label: 'Clients', icon: '⬡', permission: 'content.read' },
      { to: '/experience', label: 'Experience', icon: '≣', permission: 'content.read' },
    ],
  },
  {
    label: 'System',
    items: [
      { to: '/revisions', label: 'Revisions', icon: '⟲', permission: 'versions.read' },
      { to: '/settings', label: 'Settings', icon: '⚙', permission: 'settings.read' },
    ],
  },
];

/** Flattened list for the command palette + global search. */
export function flattenNav(): NavItem[] {
  return NAV_GROUPS.flatMap((g) => g.items);
}
