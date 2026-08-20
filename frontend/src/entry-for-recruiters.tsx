import { RecruitersPage } from './pages/recruiters/RecruitersPage';
import { hydratePage } from './lib/hydrate';
import './styles/app.css';

hydratePage(RecruitersPage, 'for-recruiters');
