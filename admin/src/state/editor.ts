/**
 * AV OS admin — save-state foundation (Phase 5 §30).
 * Reusable clean/dirty/saving/saved/failed state machine for forms and future
 * editor modules. The visual builder (Phase 6) will build richer history on
 * top of these primitives.
 */
export type SaveState = 'clean' | 'dirty' | 'saving' | 'saved' | 'failed';

export interface SaveStateInfo {
  state: SaveState;
  label: string;
}

export const SAVE_STATE_LABEL: Record<SaveState, string> = {
  clean: 'Saved',
  dirty: 'Unsaved changes',
  saving: 'Saving…',
  saved: 'Saved',
  failed: 'Save failed',
};

export function saveStateInfo(state: SaveState): SaveStateInfo {
  return { state, label: SAVE_STATE_LABEL[state] };
}

/** Compute dirty by deep-equality of a serializable snapshot. */
export function isDirty<T>(current: T, baseline: T): boolean {
  return JSON.stringify(current) !== JSON.stringify(baseline);
}
