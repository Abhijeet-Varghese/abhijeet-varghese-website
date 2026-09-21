import { createRoot } from 'react-dom/client';
import IndianArmyApp from './IndianArmyApp';
import './styles/react-indian-army.css';

const root = document.getElementById('root');
if (!root) {
  throw new Error('Indian Army mount target is missing.');
}

createRoot(root).render(<IndianArmyApp />);
