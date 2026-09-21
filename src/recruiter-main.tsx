import { createRoot } from 'react-dom/client';
import RecruiterApp from './RecruiterApp';
import './styles/react-recruiter.css';
const el=document.getElementById('root');
if(el) createRoot(el).render(<RecruiterApp />);
