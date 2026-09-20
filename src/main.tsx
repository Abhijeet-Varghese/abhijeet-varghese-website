import { createRoot } from 'react-dom/client';
import App from './App';

// The approved visual cascade is linked verbatim from public CSS in index.html.
// This bundle only adds the intentionally scoped React-homepage deltas.
import './styles/react-home.css';

const root = document.getElementById('root');
if (!root) {
  throw new Error('Homepage mount target is missing.');
}

createRoot(root).render(<App />);
