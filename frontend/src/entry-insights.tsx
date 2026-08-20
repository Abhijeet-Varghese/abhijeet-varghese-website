import { InsightsPage } from './pages/insights/InsightsPage';
import { hydratePage } from './lib/hydrate';
import './styles/app.css';

hydratePage(InsightsPage, 'insights');
