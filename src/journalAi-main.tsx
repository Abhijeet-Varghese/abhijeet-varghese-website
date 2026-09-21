import { createRoot } from 'react-dom/client';
import JournalAiApp from './JournalAiApp';
import './styles/react-journalAi.css';
const el=document.getElementById('root');
if(el) createRoot(el).render(<JournalAiApp />);
