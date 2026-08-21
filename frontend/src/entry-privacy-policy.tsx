import { LegalPage } from './pages/legal/LegalPage';
import { hydratePage } from './lib/hydrate';
import './styles/app.css';

hydratePage(() => <LegalPage activeHref="privacy-policy.html" kind="privacy" />, 'privacy-policy');
