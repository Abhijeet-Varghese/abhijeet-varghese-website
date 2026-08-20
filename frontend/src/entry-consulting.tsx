import { ConsultingPage } from './pages/consulting/ConsultingPage';
import { hydratePage } from './lib/hydrate';
import './styles/app.css';

hydratePage(ConsultingPage, 'consulting');
