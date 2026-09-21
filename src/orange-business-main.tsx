import { createRoot } from 'react-dom/client';
import OrangeBusinessApp from './OrangeBusinessApp';
import './styles/react-orange-business.css';

const root = document.getElementById('root');
if (!root) {
  throw new Error('Orange Business mount target is missing.');
}

createRoot(root).render(<OrangeBusinessApp />);
