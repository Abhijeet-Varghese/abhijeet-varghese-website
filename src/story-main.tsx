import { createRoot } from 'react-dom/client';
import StoryApp from './StoryApp';
import './styles/react-story.css';

const root = document.getElementById('root');
if (!root) {
  throw new Error('Story mount target is missing.');
}

createRoot(root).render(<StoryApp />);
