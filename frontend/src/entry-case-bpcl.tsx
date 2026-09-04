import { BPCLCase } from './pages/case-study/BPCLCase';
import { hydratePage } from './lib/hydrate';
import './styles/app.css';

hydratePage(() => <BPCLCase />, 'case-bpcl');
