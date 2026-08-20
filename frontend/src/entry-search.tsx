import { SearchPage } from './pages/search/SearchPage';
import { hydratePage } from './lib/hydrate';
import './styles/app.css';

hydratePage(SearchPage, 'search');
