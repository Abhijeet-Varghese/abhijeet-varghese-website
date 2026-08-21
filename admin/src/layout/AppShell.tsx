/**
 * AV OS admin — application shell (top bar + sidebar + main). Premium creative
 * app shell; NOT a Bootstrap-style dashboard.
 */
import { type ReactNode } from 'react';
import { Navigate, NavLink } from 'react-router-dom';
import { useUi } from '@/state/ui';
import { useAuth } from '@/auth/AuthProvider';
import { usePermissions } from '@/permissions/usePermissions';
import { NAV_GROUPS } from '@/navigation/nav';
import { CommandPalette } from '@/components/CommandPalette';
import { ToastHost, Spinner } from '@/ui/feedback';
import { useApi } from '@/hooks/useApi';
import { systemApi } from '@/api/system';
import './shell.css';

function EnvironmentBadge({ env }: { env: string }) {
  const tone = env === 'production' ? 'danger' : env === 'staging' ? 'warning' : 'info';
  return <span className={`av-env av-env--${tone}`}>{env}</span>;
}

export function AppShell({ children }: { children: ReactNode }) {
  const { sidebarCollapsed, toggleSidebar, setPaletteOpen, theme, setTheme } = useUi();
  const { loading, authed, user, logout } = useAuth();
  const { can } = usePermissions();
  const status = useApi(() => systemApi.status());

  // Auth gate: the shell itself requires a session (single choke point).
  if (loading) return <div className="av-shell"><main className="av-content"><Spinner label="Loading…" /></main></div>;
  if (!authed) return <Navigate to="/login" replace />;

  return (
    <div className="av-shell">
      <aside className={`av-sidebar ${sidebarCollapsed ? 'av-sidebar--collapsed' : ''}`}>
        <div className="av-brand">
          <span className="av-brand__mark">AV</span>
          {!sidebarCollapsed && <span className="av-brand__name">AV OS</span>}
        </div>

        <nav className="av-nav" aria-label="Primary">
          {NAV_GROUPS.map((group) => {
            const items = group.items.filter((it) => !it.permission || can(it.permission));
            if (!items.length) return null;
            return (
              <div className="av-nav-group" key={group.label}>
                {!sidebarCollapsed && <p className="av-nav-group__label">{group.label}</p>}
                {items.map((it) => (
                  <NavLinkItem key={it.to} item={it} collapsed={sidebarCollapsed} />
                ))}
              </div>
            );
          })}
        </nav>
      </aside>

      <div className="av-main">
        <header className="av-topbar">
          <button className="av-topbar__iconbtn" onClick={toggleSidebar} aria-label="Toggle sidebar">☰</button>
          <button className="av-topbar__search" onClick={() => setPaletteOpen(true)} aria-label="Search (Ctrl+K)">
            <span aria-hidden="true">⌕</span>
            <span className="av-topbar__search-label">Search or jump to…</span>
            <kbd>⌘K</kbd>
          </button>
          <div className="av-topbar__spacer" />
          <EnvironmentBadge env={status.data?.environment ?? '—'} />
          <button className="av-topbar__iconbtn" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} aria-label="Toggle theme">
            {theme === 'dark' ? '☾' : '☀'}
          </button>
          <div className="av-topbar__user">
            <span className="av-topbar__avatar">{user?.name?.[0] ?? '?'}</span>
            <span className="av-topbar__username">{user?.name}</span>
            <button className="av-topbar__logout" onClick={() => void logout()} aria-label="Sign out">⏻</button>
          </div>
        </header>

        <main className="av-content">
          <div className="av-content__inner">{children}</div>
        </main>
      </div>

      <CommandPalette />
      <ToastHost />
    </div>
  );
}

function NavLinkItem({ item, collapsed }: { item: { to: string; label: string; icon: string; end?: boolean }; collapsed: boolean }) {
  return (
    <NavLink
      to={item.to}
      end={item.end}
      className={({ isActive }) => `av-nav-item ${isActive ? 'is-active' : ''}`}
      title={collapsed ? item.label : undefined}
    >
      <span className="av-nav-item__icon" aria-hidden="true">{item.icon}</span>
      {!collapsed && <span className="av-nav-item__label">{item.label}</span>}
    </NavLink>
  );
}
