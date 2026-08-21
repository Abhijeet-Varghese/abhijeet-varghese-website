import { Badge } from '@/ui/controls';
import type { SaveState } from '@/state/editor';

/** Visual save-state indicator (clean/dirty/saving/saved/failed). */
export function SaveStateBadge({ state }: { state: SaveState }) {
  if (state === 'dirty') return <Badge tone="warning">Unsaved changes</Badge>;
  if (state === 'saving') return <Badge tone="info">Saving…</Badge>;
  if (state === 'saved') return <Badge tone="success">Saved</Badge>;
  if (state === 'failed') return <Badge tone="danger">Save failed</Badge>;
  return <Badge tone="default">Saved</Badge>;
}
