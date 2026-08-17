# PORTFOLIO — Page-Specific Design System Override

> Dedicated visual index. This page is intentionally different from `case-studies.html`.

## Purpose

- **Portfolio:** rapid visual proof across mediums, clients, practice areas and project types.
- **Case Studies:** slower narrative evidence focused on challenge, approach, role and outcome.

Never merge the two pages or point both navigation items to one URL.

## Portfolio composition

1. Full-height dark visual-index hero.
2. Asymmetric three-project gallery using only published work.
3. Dark practice-spectrum directory sourced from the six canonical capabilities.
4. Warm-paper proof wall using the 16 canonical client logos.
5. Dark final invitation.

## Visual language

- Navy/paper/azure brand system.
- Inter Tight display and body; Instrument Serif for editorial contrast.
- Large asymmetric composition with low content density.
- Project copy sits outside imagery; no decorative content glass.
- Functional pills only for project navigation affordances.
- Images retain distinct aspect ratios to avoid a generic card grid.

## Interaction

- Native links and focus states.
- Subtle image scale and action lift on hover/focus-capable devices.
- All information remains available without hover or JavaScript.
- No filtering UI until enough published work exists to justify it.

## Responsive

- Desktop uses a 12-column asymmetric grid.
- Under 900px projects become one sequential column.
- Mobile retains all metadata and project links with no horizontal overflow.
- Logo proof wall becomes two columns.

## Accessibility

- One H1; each project is an H2 inside an article.
- Published project image alt text names both project and client.
- Current navigation exposes only Portfolio as `aria-current`.
- Case Studies exposes only Case Studies as `aria-current`.
- Minimum 44px primary targets, visible focus and reduced-motion-safe reveals.

## Canonical URLs

- Portfolio: `portfolio.html`
- Case Studies: `case-studies.html`
- Standard project detail: `case-study-{slug}.html`
- Orange Business EBC: `/experience-design/orange-business-executive-briefing-center/` (legacy flat URL redirects)
