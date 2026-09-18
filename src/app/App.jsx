import { Routes, Route } from 'react-router-dom';
import HomePage from '../pages/HomePage.jsx';
import NotFound from '../pages/NotFound.jsx';

// Route map: '/' is React. Inner routes (story, experience, case-studies,
// portfolio, insights, contact, essays, legal...) are still served by the
// legacy static files at the web-root level — Apache resolves them BEFORE the
// SPA fallback, so deep links + refresh keep working during the incremental
// takeover. Unknown paths fall through to the React 404.
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
