import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from '@/layout/AppShell';
import { Guard } from '@/routes';
import { Login } from '@/pages/Login';
import { NotFound } from '@/pages/Status';
import { Dashboard } from '@/modules/dashboard/Dashboard';
import { ProjectsPage } from '@/modules/projects/ProjectsPage';
import { ProjectEditor } from '@/modules/projects/ProjectEditor';
import { ArticlesPage } from '@/modules/articles/ArticlesPage';
import { ArticleEditor } from '@/modules/articles/ArticleEditor';
import { ClientsPage } from '@/modules/clients/ClientsPage';
import { ExperiencePage } from '@/modules/experience/ExperiencePage';
import { PagesPage } from '@/modules/pages/PagesPage';
import { NavigationPage } from '@/modules/navigation/NavigationPage';
import { MediaPage } from '@/modules/media/MediaPage';
import { SettingsPage } from '@/modules/settings/SettingsPage';
import { RevisionsPage } from '@/modules/revisions/RevisionsPage';

/**
 * AV OS admin root. Hash-based routing (Hostinger-safe: zero rewrite rules),
 * wrapped in the app shell; every route is permission-gated.
 */
export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route path="/" element={<AppShell><Dashboard /></AppShell>} />
        <Route path="/dashboard" element={<AppShell><Dashboard /></AppShell>} />

        <Route path="/projects" element={<Guard permission="content.read"><AppShell><ProjectsPage /></AppShell></Guard>} />
        <Route path="/projects/:slug" element={<Guard permission="content.read"><AppShell><ProjectEditor /></AppShell></Guard>} />
        <Route path="/articles" element={<Guard permission="content.read"><AppShell><ArticlesPage /></AppShell></Guard>} />
        <Route path="/articles/:slug" element={<Guard permission="content.read"><AppShell><ArticleEditor /></AppShell></Guard>} />
        <Route path="/clients" element={<Guard permission="content.read"><AppShell><ClientsPage /></AppShell></Guard>} />
        <Route path="/experience" element={<Guard permission="content.read"><AppShell><ExperiencePage /></AppShell></Guard>} />
        <Route path="/pages" element={<Guard permission="content.read"><AppShell><PagesPage /></AppShell></Guard>} />
        <Route path="/navigation" element={<Guard permission="content.read"><AppShell><NavigationPage /></AppShell></Guard>} />
        <Route path="/media" element={<Guard permission="media.read"><AppShell><MediaPage /></AppShell></Guard>} />
        <Route path="/settings" element={<Guard permission="settings.read"><AppShell><SettingsPage /></AppShell></Guard>} />
        <Route path="/revisions" element={<Guard permission="versions.read"><AppShell><RevisionsPage /></AppShell></Guard>} />

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
        <Route path="/404" element={<NotFound />} />
      </Routes>
    </HashRouter>
  );
}
