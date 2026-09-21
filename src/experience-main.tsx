import { createRoot } from 'react-dom/client';
import ExperienceApp from './ExperienceApp';
import './styles/react-experience.css';

const root = document.getElementById('root');
if (!root) {
  throw new Error('Experience mount target is missing.');
}

createRoot(root).render(<ExperienceApp />);
