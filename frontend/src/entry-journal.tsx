import { JournalPage } from './pages/journal/JournalPage';
import { hydratePage } from './lib/hydrate';
import './styles/app.css';

hydratePage(JournalPage, 'journal');
