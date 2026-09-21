import { createRoot } from 'react-dom/client';
import JournalExpApp from './JournalExpApp';
import './styles/react-journalExp.css';
const el=document.getElementById('root');
if(el) createRoot(el).render(<JournalExpApp />);
