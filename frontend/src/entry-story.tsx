import { StoryPage } from './pages/story/StoryPage';
import { hydratePage } from './lib/hydrate';
import './styles/app.css';

hydratePage(StoryPage, 'story');
