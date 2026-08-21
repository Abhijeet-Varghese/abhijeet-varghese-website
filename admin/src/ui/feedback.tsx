/**
 * AV OS admin — feedback primitives (spinner, empty/error states, dialog,
 * toast host).
 */
import { useEffect, type ReactNode } from 'react';
import { useUi } from '@/state/ui';
import './feedback.css';

export function Spinner({ label }: { label?: string }) {
  return (
    <div className="av-spinner" role="status" aria-live="polite">
      <span className="av-spinner__ring" aria-hidden="true" />
      {label && <span>{label}</span>}
    </div>
  );
}

export function EmptyState({ title, hint, action }: { title: string; hint?: string; action?: ReactNode }) {
  return (
    <div className="av-empty">
      <div className="av-empty__icon" aria-hidden="true">◇</div>
      <h3 className="av-empty__title">{title}</h3>
      {hint && <p className="av-empty__hint">{hint}</p>}
      {action && <div className="av-empty__action">{action}</div>}
    </div>
  );
}

export function ErrorState({ message, requestId, onRetry }: { message: string; requestId?: string | null; onRetry?: () => void }) {
  return (
    <div className="av-empty av-empty--error" role="alert">
      <div className="av-empty__icon" aria-hidden="true">!</div>
      <h3 className="av-empty__title">Something went wrong</h3>
      <p className="av-empty__hint">{message}</p>
      {requestId && <code className="av-empty__rid">request {requestId}</code>}
      {onRetry && (
        <div className="av-empty__action">
          <button className="av-btn av-btn--ghost av-btn--sm" onClick={onRetry}>Try again</button>
        </div>
      )}
    </div>
  );
}

export function Dialog({ open, title, onClose, children, footer }: {
  open: boolean; title: string; onClose: () => void; children: ReactNode; footer?: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="av-dialog-backdrop" onClick={onClose} role="presentation">
      <div className="av-dialog" role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <header className="av-dialog__head">
          <h2 className="av-dialog__title">{title}</h2>
          <button className="av-dialog__close" onClick={onClose} aria-label="Close">×</button>
        </header>
        <div className="av-dialog__body">{children}</div>
        {footer && <footer className="av-dialog__foot">{footer}</footer>}
      </div>
    </div>
  );
}

export function ToastHost() {
  const { toasts, dismissToast } = useUi();
  return (
    <div className="av-toasts" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`av-toast av-toast--${t.kind}`} role="status">
          <span className="av-toast__icon" aria-hidden="true">
            {t.kind === 'success' ? '✓' : t.kind === 'error' ? '!' : t.kind === 'warning' ? '!' : 'i'}
          </span>
          <span className="av-toast__msg">{t.message}</span>
          <button className="av-toast__close" onClick={() => dismissToast(t.id)} aria-label="Dismiss">×</button>
        </div>
      ))}
    </div>
  );
}
