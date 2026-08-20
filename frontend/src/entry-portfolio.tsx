import { PortfolioPage } from './pages/portfolio/PortfolioPage';
import { hydratePage } from './lib/hydrate';
import './styles/app.css';

hydratePage(PortfolioPage, 'portfolio');
