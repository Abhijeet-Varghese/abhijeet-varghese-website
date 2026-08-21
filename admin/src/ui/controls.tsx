/**
 * AV OS admin — reusable UI primitives (buttons, inputs, selects, textareas,
 * toggles, badges). All styling flows from the design tokens in tokens.css.
 */
import { forwardRef, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import './controls.css';

/* ---- Button ---- */
type ButtonVariant = 'primary' | 'ghost' | 'danger' | 'subtle';
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: 'sm' | 'md';
  loading?: boolean;
}
export function Button({ variant = 'primary', size = 'md', loading, children, disabled, className = '', ...rest }: ButtonProps) {
  return (
    <button
      className={`av-btn av-btn--${variant} av-btn--${size} ${loading ? 'is-loading' : ''} ${className}`}
      disabled={disabled || loading}
      {...rest}
    >
      {loading && <span className="av-btn__spinner" aria-hidden="true" />}
      {children}
    </button>
  );
}

/* ---- Input ---- */
export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className = '', ...rest }, ref) => <input ref={ref} className={`av-input ${className}`} {...rest} />,
);
Input.displayName = 'Input';

/* ---- Textarea ---- */
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className = '', ...rest }, ref) => <textarea ref={ref} className={`av-textarea ${className}`} {...rest} />,
);
Textarea.displayName = 'Textarea';

/* ---- Select ---- */
export function Select({ className = '', children, ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={`av-select ${className}`} {...rest}>{children}</select>;
}

/* ---- Toggle ---- */
export function Toggle({ checked, onChange, label, disabled }: { checked: boolean; onChange: (v: boolean) => void; label?: string; disabled?: boolean }) {
  return (
    <label className="av-toggle">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        className={`av-toggle__track ${checked ? 'is-on' : ''}`}
        onClick={() => onChange(!checked)}
        disabled={disabled}
      >
        <span className="av-toggle__thumb" />
      </button>
      {label && <span className="av-toggle__label">{label}</span>}
    </label>
  );
}

/* ---- Badge ---- */
type BadgeTone = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'accent';
export function Badge({ tone = 'default', children }: { tone?: BadgeTone; children: ReactNode }) {
  return <span className={`av-badge av-badge--${tone}`}>{children}</span>;
}

/* ---- Field wrapper ---- */
export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div className="av-field">
      <label className="av-label">{label}</label>
      {children}
      {hint && <p className="av-field__hint">{hint}</p>}
    </div>
  );
}
