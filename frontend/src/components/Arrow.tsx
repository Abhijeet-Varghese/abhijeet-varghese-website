/** The site-wide link/button arrow mark (stroke icon). */
export function Arrow({ className = 'btn__arrow', size = 16 }: { className?: string; size?: number }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M2 8h11M9 3.5 13.5 8 9 12.5" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

/** Larger variant used by essays/links (18px, stroke 1.4). */
export function ArrowSm({ size = 18 }: { size?: number }) {
  return (
    <svg className="btn__arrow" width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M2 8h11M9 3.5 13.5 8 9 12.5" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}
