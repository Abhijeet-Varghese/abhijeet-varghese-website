import { ExperiencePage } from './pages/experience/ExperiencePage';
import { hydratePage } from './lib/hydrate';
import './styles/app.css';

hydratePage(ExperiencePage, 'experience');
