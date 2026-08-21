import { LegalPage } from './pages/legal/LegalPage';
import { hydratePage } from './lib/hydrate';
import './styles/app.css';

hydratePage(() => <LegalPage activeHref="/privacy-policy" kind="privacy" />, 'privacy-policy');
