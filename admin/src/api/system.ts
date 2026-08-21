import { apiGet } from './client';
import type { FeatureFlag, MediaList, StatusData } from './types';

/** System/media/feature-flag APIs (existing backend endpoints). */
export const systemApi = {
  status: () => apiGet<StatusData>('/status'),
  flags: () => apiGet<FeatureFlag[]>('/flags'),
  media: (opts: { page?: number; limit?: number; q?: string } = {}) => {
    const p = new URLSearchParams();
    if (opts.page) p.set('page', String(opts.page));
    if (opts.limit) p.set('limit', String(opts.limit));
    if (opts.q) p.set('q', opts.q);
    return apiGet<MediaList>(`/media?${p.toString()}`);
  },
  deployments: () => apiGet<unknown[]>('/deployments'),
  redirects: () => apiGet<unknown[]>('/redirects'),
};
