import { createRoot } from 'react-dom/client';
import ConsultingApp from './ConsultingApp';
import './styles/react-consulting.css';
const el=document.getElementById('root');
if(el) createRoot(el).render(<ConsultingApp />);
