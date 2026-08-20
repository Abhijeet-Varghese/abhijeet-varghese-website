import { LegalPage } from './pages/legal/LegalPage';
import { TERMS, TERMS_PAGE } from './content/pages';
import { hydratePage } from './lib/hydrate';
import './styles/app.css';

hydratePage(
  () => <LegalPage activeHref="terms.html" num={TERMS_PAGE.num} title={TERMS_PAGE.title} lede={TERMS_PAGE.lede} sections={TERMS} />,
  'terms',
);
