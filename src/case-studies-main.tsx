import { createRoot } from 'react-dom/client';
import CaseStudiesApp from './CaseStudiesApp';
import './styles/react-case-studies.css';

const root = document.getElementById('root');
if (!root) {
  throw new Error('Case Studies mount target is missing.');
}

createRoot(root).render(<CaseStudiesApp />);
