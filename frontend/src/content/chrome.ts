import type { ChromeData, SocialLink } from '@/types';

/**
 * Shared site chrome (nav + footer). This mirrors the production chrome that
 * is identical on every page (verified by chrome_consistency_qa.js upstream).
 */
export const SOCIAL_ICONS: Record<SocialLink['icon'], { viewBox: string; fill: 'currentColor' | 'none'; stroke?: string; strokeWidth?: string; d: string[] }> = {
  linkedin: {
    viewBox: '0 0 24 24',
    fill: 'currentColor',
    d: [
      'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.225 0z',
    ],
  },
  instagram: {
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: '1.8',
    d: ['M2.5 2.5h19v19h-19z', 'M12 16.4a4.4 4.4 0 1 1 0-8.8 4.4 4.4 0 0 1 0 8.8z', 'M17.6 6.4a1.15 1.15 0 1 0 0-2.3 1.15 1.15 0 0 0 0 2.3z'],
  },
  whatsapp: {
    viewBox: '0 0 24 24',
    fill: 'currentColor',
    d: [
      'M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.297-.497.1-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z',
    ],
  },
  youtube: {
    viewBox: '0 0 24 24',
    fill: 'currentColor',
    d: [
      'M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z',
    ],
  },
  behance: {
    viewBox: '0 0 24 24',
    fill: 'currentColor',
    d: [
      'M7.69 4.154c1.583 0 2.778.403 3.593 1.21.814.806 1.222 1.9 1.222 3.283 0 .888-.195 1.646-.585 2.273-.39.627-.994 1.156-1.812 1.585 1.094.35 1.9.91 2.42 1.682.52.77.78 1.68.78 2.73 0 1.5-.52 2.71-1.56 3.63-1.04.92-2.43 1.38-4.17 1.38H0V4.154h7.69zm-.42 6.19c.91 0 1.61-.23 2.1-.69.49-.46.73-1.1.73-1.92 0-.84-.24-1.47-.73-1.9-.49-.43-1.18-.64-2.1-.64H3.71v5.15h3.56zm.3 7.05c.98 0 1.74-.24 2.28-.73.54-.48.81-1.18.81-2.09 0-.88-.27-1.56-.82-2.04-.55-.48-1.3-.72-2.27-.72H3.71v5.58h3.86zM22.5 17.05c-.62.6-1.52.9-2.7.9-.85 0-1.56-.22-2.13-.65-.57-.44-.9-.98-1-1.64h4.95c.1-.98-.06-1.84-.44-2.55a4.3 4.3 0 00-1.76-1.64c-.77-.39-1.72-.58-2.86-.58-1.3 0-2.43.33-3.38.98a6.58 6.58 0 00-2.16 2.68c-.5 1.12-.75 2.4-.75 3.83 0 1.34.27 2.51.82 3.52.55 1 1.33 1.78 2.35 2.32 1.02.55 2.19.82 3.52.82.9 0 1.76-.14 2.58-.43a6.4 6.4 0 002.2-1.34c.64-.6 1.13-1.34 1.47-2.2h-4.3c-.09.52-.35.9-.78 1.16-.43.26-.9.38-1.4.38-.8 0-1.4-.24-1.8-.72-.4-.48-.6-1.06-.6-1.75h9.12c0-1.52-.3-2.84-.88-3.94-.6-1.1-1.4-1.96-2.43-2.58-1.02-.62-2.14-.93-3.36-.93-1.44 0-2.74.33-3.9.98a7.31 7.31 0 00-2.6 2.62c-.63 1.1-.95 2.33-.95 3.7 0 1.42.34 2.7 1.01 3.84.67 1.13 1.62 2.02 2.83 2.66a8.02 8.02 0 003.78.94c.99 0 1.94-.16 2.86-.47a7.36 7.36 0 002.6-1.5c.77-.7 1.35-1.54 1.74-2.5h-4.18c-.1.74-.4 1.3-.9 1.7zM18.21 8.55h-6.2v-1.9h6.2v1.9z',
    ],
  },
};

export const CHROME: ChromeData = {
  brandLabel: 'Abhijeet Varghese',
  brandHref: '/',
  logoUrl: 'assets/logo.png',
  primary: [
    { label: 'Story', href: '/story' },
    { label: 'Experience', href: '/experience' },
    { label: 'Case Studies', href: '/case-studies' },
    { label: 'Portfolio', href: '/portfolio' },
  ],
  mobile: [
    { label: 'Story', href: '/story', index: '01' },
    { label: 'Experience', href: '/experience', index: '02' },
    { label: 'Case Studies', href: '/case-studies', index: '03' },
    { label: 'Portfolio', href: '/portfolio', index: '04' },
  ],
  cta: { label: 'Start a conversation', href: '/contact' },
  footer: {
    line: 'Making ambitious ideas impossible to misunderstand.',
    email: 'hi@abhijeetvarghese.com',
    emailHref: 'mailto:hi@abhijeetvarghese.com',
    phone: '+91-96940 80706',
    phoneHref: 'tel:+919694080706',
    availability: 'Available for select projects — 2026',
    columns: [
      {
        label: 'Menu',
        links: [
          { label: 'Story', href: '/story' },
          { label: 'Experience', href: '/experience' },
          { label: 'Case Studies', href: '/case-studies' },
          { label: 'Portfolio', href: '/portfolio' },
          { label: 'Start a conversation', href: '/contact' },
          { label: 'Download résumé', href: 'assets/Abhijeet-Varghese-Resume.pdf' },
        ],
      },
      {
        label: 'Resources',
        links: [
          { label: 'Insights', href: '/insights' },
          { label: 'Journal', href: '/journal' },
          { label: 'Sitemap', href: '/sitemap' },
          { label: 'Search', href: '/search' },
          { label: 'For Recruiters', href: '/for-recruiters' },
          { label: 'Consulting', href: '/consulting' },
        ],
      },
      {
        label: 'Legal',
        links: [
          { label: 'Privacy Policy', href: '/privacy-policy' },
          { label: 'Terms', href: '/terms' },
        ],
      },
    ],
    social: [
      { label: 'LinkedIn', href: 'https://www.linkedin.com/in/abhijeetvarghese/', icon: 'linkedin' },
      { label: 'Instagram', href: 'https://www.instagram.com/abhijeetvarghese/', icon: 'instagram' },
      { label: 'WhatsApp', href: 'https://api.whatsapp.com/send?phone=919694080706', icon: 'whatsapp' },
      { label: 'YouTube', href: 'https://www.youtube.com/@AbhijeetVarghese', icon: 'youtube' },
      { label: 'Behance', href: 'https://www.behance.net/abhijeetvarghese', icon: 'behance' },
    ],
    copyright:
      '© 2026 Abhijeet Varghese. All Rights Reserved. Designing experiences where creativity, technology and human understanding come together.',
    note: 'Built on AV OS · experience design, engineering & creative leadership',
  },
};
