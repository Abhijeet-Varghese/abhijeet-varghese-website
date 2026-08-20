import { ComingSoonCase } from './pages/case-study/ComingSoonCase';
import { PROJECTS } from './content/projects';
import { hydratePage } from './lib/hydrate';
import './styles/app.css';

const army = PROJECTS.find((p) => p.slug === 'immersive-solutions-for-the-indian-army')!;
hydratePage(() => <ComingSoonCase project={army} />, 'case-army');
