import { createRoot } from 'react-dom/client';
import InsightsHubApp from './InsightsHubApp';
import './styles/react-insightsHub.css';
const el=document.getElementById('root');
if(el) createRoot(el).render(<InsightsHubApp />);
