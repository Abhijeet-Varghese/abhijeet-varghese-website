import { ArticlePage } from './pages/article/ArticlePage';
import { ARTICLES_BY_SLUG } from './content/articles';
import { hydratePage } from './lib/hydrate';
import './styles/app.css';

const pageId = document.getElementById('root')?.dataset.page ?? '';
const article = ARTICLES_BY_SLUG[pageId];
if (!article) throw new Error(`Unknown article "${pageId}"`);
hydratePage(() => <ArticlePage article={article} />, pageId);
