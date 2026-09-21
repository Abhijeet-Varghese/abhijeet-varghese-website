import { createRoot } from 'react-dom/client';
import PortfolioApp from './PortfolioApp';
import './styles/react-portfolio.css';

const root = document.getElementById('root');
if (!root) throw new Error('Portfolio mount missing');
createRoot(root).render(<PortfolioApp />);
