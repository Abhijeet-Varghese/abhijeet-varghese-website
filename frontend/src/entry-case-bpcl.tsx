import { ComingSoonCase } from './pages/case-study/ComingSoonCase';
import { PROJECTS } from './content/projects';
import { hydratePage } from './lib/hydrate';
import './styles/app.css';

const bpcl = PROJECTS.find((p) => p.slug === 'intuitive-experiences-for-industrial-environments')!;
hydratePage(() => <ComingSoonCase project={bpcl} />, 'case-bpcl');
