import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/auth/AuthProvider';
import { usePermissions } from '@/permissions/usePermissions';
import { Spinner } from '@/ui/feedback';
import { Unauthorized } from '@/pages/Status';

/** Route guard — auth + permission (UX only; backend is authoritative). */
export function Guard({ permission, children }: { permission?: string; children: ReactNode }) {
  const { loading, authed } = useAuth();
  const { can } = usePermissions();

  if (loading) return <Spinner label="Loading…" />;
  if (!authed) return <Navigate to="/login" replace />;
  if (permission && !can(permission)) return <Unauthorized />;
  return <>{children}</>;
}
