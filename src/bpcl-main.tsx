import { createRoot } from 'react-dom/client';
import BpclApp from './BpclApp';
import './styles/react-bpcl.css';

const root = document.getElementById('root');
if (!root) {
  throw new Error('BPCL mount target is missing.');
}

createRoot(root).render(<BpclApp />);
