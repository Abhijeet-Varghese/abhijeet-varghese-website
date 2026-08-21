import { useApi } from './useApi';
import { contentApi } from '@/api/content';
import type { ContentDoc } from '@/api/types';

/**
 * Load the full CMS content document (admin) once, with refetch. Shared by the
 * content modules so a single page edit can refresh the listing in place.
 */
export function useContentDoc() {
  return useApi<ContentDoc>(() => contentApi.doc());
}
