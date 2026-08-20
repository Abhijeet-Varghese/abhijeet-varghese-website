import { NotFoundPage } from './pages/not-found/NotFoundPage';
import { hydratePage } from './lib/hydrate';
import './styles/app.css';

hydratePage(NotFoundPage, 'not-found');
