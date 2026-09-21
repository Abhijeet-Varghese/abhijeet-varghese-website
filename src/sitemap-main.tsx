import { createRoot } from 'react-dom/client';
import SitemapApp from './SitemapApp';
import './styles/react-sitemap.css';
const el=document.getElementById('root');
if(el) createRoot(el).render(<SitemapApp />);
