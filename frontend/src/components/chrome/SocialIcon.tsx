import type { SocialLink } from '@/types';
import { SOCIAL_ICONS } from '@/content/chrome';

export function SocialIcon({ icon }: Pick<SocialLink, 'icon' | 'label'>) {
  const spec = SOCIAL_ICONS[icon];
  return (
    <svg
      viewBox={spec.viewBox}
      fill={spec.fill}
      stroke={spec.stroke}
      strokeWidth={spec.strokeWidth}
      aria-hidden="true"
      focusable="false"
    >
      {icon === 'instagram' ? (
        <>
          <rect x="2.5" y="2.5" width="19" height="19" rx="5.2" />
          <circle cx="12" cy="12" r="4.4" />
          <circle cx="17.6" cy="6.4" r="1.15" fill="currentColor" stroke="none" />
        </>
      ) : (
        spec.d.map((d, i) => <path key={i} d={d} />)
      )}
    </svg>
  );
}
