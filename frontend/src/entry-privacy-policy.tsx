import { LegalPage } from './pages/legal/LegalPage';
import { PRIVACY, PRIVACY_PAGE } from './content/pages';
import { hydratePage } from './lib/hydrate';
import './styles/app.css';

hydratePage(
  () => <LegalPage activeHref="privacy-policy.html" num={PRIVACY_PAGE.num} title={PRIVACY_PAGE.title} lede={PRIVACY_PAGE.lede} sections={PRIVACY} />,
  'privacy-policy',
);
