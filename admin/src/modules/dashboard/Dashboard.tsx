/**
 * AV OS admin — dashboard. Real data only: API status, content counts from the
 * content doc, quick actions, recent deployments. Metrics that are unavailable
 * are shown as "Unavailable", never fabricated.
 */
import { useNavigate } from 'react-router-dom';
import { useApi } from '@/hooks/useApi';
import { useContentDoc } from '@/hooks/useContentDoc';
import { systemApi } from '@/api/system';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/ui/controls';
import { Badge } from '@/ui/controls';
import { Spinner, ErrorState } from '@/ui/feedback';
import { usePermissions } from '@/permissions/usePermissions';
import './dashboard.css';

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="av-stat">
      <span className="av-stat__value">{value}</span>
      <span className="av-stat__label">{label}</span>
    </div>
  );
}

export function Dashboard() {
  const navigate = useNavigate();
  const { can } = usePermissions();
  const content = useContentDoc();
  const status = useApi(() => systemApi.status());
  const deployments = useApi(() => systemApi.deployments());

  const loading = content.loading || status.loading;

  if (loading) return <Spinner label="Loading dashboard…" />;
  if (content.error) return <ErrorState message={content.error} requestId={content.requestId} onRetry={content.refetch} />;

  const doc = content.data!;
  const stat = status.data;
  const projectCount = Array.isArray(doc.projects) ? doc.projects.length : '—';
  const articleCount = Array.isArray(doc.articles) ? doc.articles.length : '—';
  const clientCount = Array.isArray(doc.clients) ? doc.clients.length : '—';
  const pageCount = Array.isArray(doc.pages) ? doc.pages.length : '—';

  return (
    <>
      <PageHeader title="Dashboard" sub="A live overview of your AV OS." />

      <section className="av-grid av-grid--4" aria-label="Content counts">
        <div className="av-card"><Stat label="Projects" value={projectCount} /></div>
        <div className="av-card"><Stat label="Articles" value={articleCount} /></div>
        <div className="av-card"><Stat label="Clients" value={clientCount} /></div>
        <div className="av-card"><Stat label="Pages" value={pageCount} /></div>
      </section>

      <section className="av-card av-dash-health" aria-label="Website health">
        <h3 className="av-dash-section-title">Website health</h3>
        {stat ? (
          <div className="av-dash-health__grid">
            <Stat label="API status" value={stat.status} />
            <Stat label="Database" value={stat.database} />
            <Stat label="Publish" value={stat.publish} />
            <Stat label="Environment" value={stat.environment} />
            <Stat label="Version" value={stat.version} />
            <Stat label="AI" value={stat.ai} />
          </div>
        ) : (
          <p className="av-muted">Unavailable</p>
        )}
      </section>

      <section className="av-card" aria-label="Quick actions">
        <h3 className="av-dash-section-title">Quick actions</h3>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <Button variant="ghost" onClick={() => navigate('/projects')}>Manage projects</Button>
          <Button variant="ghost" onClick={() => navigate('/articles')}>Write article</Button>
          {can('media.read') && <Button variant="ghost" onClick={() => navigate('/media')}>Media library</Button>}
          <Button variant="ghost" onClick={() => navigate('/pages')}>View pages</Button>
          <Button variant="ghost" onClick={() => navigate('/settings')}>Site settings</Button>
        </div>
      </section>

      <section className="av-card" aria-label="Recent deployments">
        <h3 className="av-dash-section-title">Recent activity</h3>
        {deployments.loading ? <Spinner label="Loading…" /> : deployments.data && Array.isArray(deployments.data) && deployments.data.length ? (
          <ul className="av-dash-list">
            {(deployments.data as Array<Record<string, unknown>>).slice(0, 5).map((d, i) => (
              <li key={i} className="av-dash-list__row">
                <span>Deployment #{String(d.id)}</span>
                <Badge tone={d.status === 'live' ? 'success' : 'default'}>{String(d.status)}</Badge>
                <span className="av-muted">{String(d.created_at ?? '')}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="av-muted">No deployments recorded yet.</p>
        )}
      </section>
    </>
  );
}
