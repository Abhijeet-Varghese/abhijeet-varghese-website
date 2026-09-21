import { createRoot } from 'react-dom/client';
import SearchApp from './SearchApp';
import './styles/react-search.css';
const el=document.getElementById('root');
if(el) createRoot(el).render(<SearchApp />);
