import { createRoot } from 'react-dom/client';
import InsightsEnterpriseApp from './InsightsEnterpriseApp';
import './styles/react-insightsEnterprise.css';
const el=document.getElementById('root');
if(el) createRoot(el).render(<InsightsEnterpriseApp />);
