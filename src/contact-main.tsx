import { createRoot } from 'react-dom/client';
import ContactApp from './ContactApp';
import './styles/react-contact.css';

const root = document.getElementById('root');
if (!root) throw new Error('Contact mount missing');
createRoot(root).render(<ContactApp />);
