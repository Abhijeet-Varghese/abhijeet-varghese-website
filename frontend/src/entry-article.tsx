import { ArticlePage } from './pages/article/ArticlePage';
import { hydratePage } from './lib/hydrate';
import './styles/app.css';

const pageId = document.getElementById('root')?.dataset.page ?? '';
hydratePage(() => <ArticlePage slug={pageId} />, pageId);
