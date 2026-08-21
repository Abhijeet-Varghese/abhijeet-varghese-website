import { apiGet, apiSend, CsrfStore } from './client';
import type { LoginData, SessionData } from './types';

/** Session (reuses the existing backend auth — no parallel auth system). */
export const authApi = {
  session: () => apiGet<SessionData>('/session'),

  login: (email: string, password: string) =>
    apiSend<LoginData>('POST', '/auth/login', { email, password }),

  logout: () => apiSend<{ ok: boolean }>('POST', '/auth/logout'),

  changePassword: (current_password: string, new_password: string) =>
    apiSend<{ ok: boolean }>('POST', '/auth/change-password', { current_password, new_password }),
};

/** Fetch the session and populate the CSRF store (call once after login/boot). */
export async function bootstrapSession(): Promise<SessionData> {
  const s = await authApi.session();
  CsrfStore.set(s.csrf);
  return s;
}
