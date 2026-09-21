import { createRoot } from 'react-dom/client';
import JournalApp from './JournalApp';
import './styles/react-journal.css';
const el=document.getElementById('root');
if(el) createRoot(el).render(<JournalApp />);
