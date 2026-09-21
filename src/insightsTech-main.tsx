import { createRoot } from 'react-dom/client';
import InsightsTechnologyApp from './InsightsTechnologyApp';
import './styles/react-insightsTech.css';
const el=document.getElementById('root');
if(el) createRoot(el).render(<InsightsTechnologyApp />);
