import { ComingSoonCase } from './pages/case-study/ComingSoonCase';
import { hydratePage } from './lib/hydrate';
import './styles/app.css';

hydratePage(() => <ComingSoonCase slug="immersive-solutions-for-the-indian-army" />, 'case-army');
