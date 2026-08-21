import { EmptyState } from '@/ui/feedback';

export function NotFound() {
  return <EmptyState title="Page not found" hint="The route you requested does not exist in AV OS." />;
}

export function Unauthorized() {
  return <EmptyState title="Not authorized" hint="You do not have permission to view this area." />;
}
