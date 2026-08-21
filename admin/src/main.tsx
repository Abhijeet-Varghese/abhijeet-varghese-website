import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { AuthProvider } from './auth/AuthProvider';
import { UiProvider } from './state/ui';
import './styles/tokens.css';
import './styles/app.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <UiProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </UiProvider>
  </StrictMode>,
);
