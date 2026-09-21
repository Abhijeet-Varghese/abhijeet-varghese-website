import { createRoot } from 'react-dom/client';
import InsightsDesignApp from './InsightsDesignApp';
import './styles/react-insightsDesign.css';
const el=document.getElementById('root');
if(el) createRoot(el).render(<InsightsDesignApp />);
