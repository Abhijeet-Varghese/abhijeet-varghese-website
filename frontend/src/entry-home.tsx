import { Home } from './pages/home/Home';
import { hydratePage } from './lib/hydrate';
import './styles/app.css';

hydratePage(Home, 'home');
