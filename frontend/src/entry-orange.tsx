import { OrangePage } from './pages/orange/OrangePage';
import { hydratePage } from './lib/hydrate';
import './styles/app.css';
import './styles/orange-business-case-study.css';

hydratePage(OrangePage, 'orange');
