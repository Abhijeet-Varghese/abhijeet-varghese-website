import { createRoot } from 'react-dom/client';
import PrivacyApp from './PrivacyApp';
import './styles/react-privacy.css';
const el=document.getElementById('root');
if(el) createRoot(el).render(<PrivacyApp />);
