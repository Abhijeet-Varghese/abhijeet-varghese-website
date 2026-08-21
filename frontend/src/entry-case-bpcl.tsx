import { ComingSoonCase } from './pages/case-study/ComingSoonCase';
import { hydratePage } from './lib/hydrate';
import './styles/app.css';

hydratePage(() => <ComingSoonCase slug="intuitive-experiences-for-industrial-environments" />, 'case-bpcl');
