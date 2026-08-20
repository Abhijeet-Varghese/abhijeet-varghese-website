import { CaseStudiesPage } from './pages/case-studies/CaseStudiesPage';
import { hydratePage } from './lib/hydrate';
import './styles/app.css';

hydratePage(CaseStudiesPage, 'case-studies');
