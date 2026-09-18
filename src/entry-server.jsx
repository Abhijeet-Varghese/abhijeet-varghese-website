import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server.js';
import App from './app/App.jsx';

export function render(url) {
  return renderToString(<StaticRouter location={url}><App /></StaticRouter>);
}
