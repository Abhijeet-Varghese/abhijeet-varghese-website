/**
 * AV OS admin — permission hook (UX only).
 * The backend is the security boundary; these helpers only shape the UI
 * (hide/show controls). Every mutation is re-checked server-side.
 */
import { useAuth } from '@/auth/AuthProvider';

export function usePermissions() {
  const { permissions, user } = useAuth();
  return {
    /** Can the current user perform this permission (best-effort, UI-only)? */
    can: (perm: string): boolean => {
      if (user?.role === 'Super Admin') return true;
      return permissions.includes(perm);
    },
    permissions,
    isSuperAdmin: user?.role === 'Super Admin',
    role: user?.role ?? null,
  };
}

/** Route-guard helper: returns the first missing permission, or null. */
export function missingPermission(required: string[], permissions: string[], isSuperAdmin: boolean): string | null {
  if (isSuperAdmin) return null;
  for (const p of required) {
    if (!permissions.includes(p)) return p;
  }
  return null;
}
