import { createRoot } from 'react-dom/client';
import TermsApp from './TermsApp';
import './styles/react-terms.css';
const el=document.getElementById('root');
if(el) createRoot(el).render(<TermsApp />);
