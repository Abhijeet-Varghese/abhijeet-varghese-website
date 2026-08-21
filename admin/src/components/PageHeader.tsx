import type { ReactNode } from 'react';

/** Consistent page header (breadcrumbs live in the route; title + actions here). */
export function PageHeader({ title, sub, actions }: { title: string; sub?: string; actions?: ReactNode }) {
  return (
    <div className="av-page-header">
      <div>
        <h1 className="av-page-title">{title}</h1>
        {sub && <p className="av-page-sub">{sub}</p>}
      </div>
      {actions && <div style={{ display: 'flex', gap: '8px' }}>{actions}</div>}
    </div>
  );
}
