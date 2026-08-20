import { SitemapPage } from './pages/sitemap/SitemapPage';
import { hydratePage } from './lib/hydrate';
import './styles/app.css';

hydratePage(SitemapPage, 'sitemap');
