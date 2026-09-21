import { createRoot } from 'react-dom/client';
import InsightsAiApp from './InsightsAiApp';
import './styles/react-insightsAi.css';
const el=document.getElementById('root');
if(el) createRoot(el).render(<InsightsAiApp />);
