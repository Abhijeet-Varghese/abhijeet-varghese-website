import { ContactPage } from './pages/contact/ContactPage';
import { hydratePage } from './lib/hydrate';
import './styles/app.css';

hydratePage(ContactPage, 'contact');
