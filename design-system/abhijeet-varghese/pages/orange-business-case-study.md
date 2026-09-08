# ORANGE BUSINESS EBC — Page-Specific Design Override

> Long-form project detail for the Orange Business New Executive Briefing Center in Mumbai.

## Canonical route

- `/experience-design/orange-business-executive-briefing-center/`
- Legacy `/case-study-enterprise-technology-made-understandable.html` redirects to the canonical route.
- The Case Studies and Portfolio indexes remain separate pages.

## Creative direction

- Concept: **The room became the interface.**
- Narrative: Space → Identity → Response → Interaction → Immersion → Collaboration → Business Experience → Delivery → Outcome.
- Orange `#F57900`, black and neutral paper form a client-specific project world.
- Approved AV typography remains local: Inter Tight for display/body and Poppins for technical labels.
- Real supplied project photography only; do not substitute stock or generated imagery.
- The public navbar and footer are rendered by the same AV OS `chrome()` and `footer()` components used by the homepage; no page-specific chrome is permitted.
- Liquid Glass remains limited to the shared functional navbar and media controls.

## Interaction

- The panorama supports pointer drag, but its hotspots provide single-pointer and keyboard alternatives.
- Choice groups expose `aria-pressed`; the three proof panels use complete tab/tabpanel semantics and arrow-key navigation.
- Videos load only when an actual MP4 exists and the active panel approaches the viewport. Missing films resolve to their supplied static posters without broken requests or fake media.
- Scroll effects are requestAnimationFrame-throttled and disabled under reduced motion.
- The page is complete and readable without JavaScript.

## Responsive and accessibility

- One H1 and sequential section headings.
- Fixed chrome is offset with scroll padding; focus is never obscured.
- 44px minimum primary interaction targets and persistent visible focus.
- No document-level horizontal overflow; intentional mobile strips scroll within their own controls.
- Support `prefers-reduced-motion`, `prefers-reduced-transparency`, `prefers-contrast` and forced colors.
- Validate at 280×653, 320×480, 390×844, 568×320, 768×1024, 1024×768, 1440×900, 1920×1080, 3440×1440 and 3840×2160.

## Non-negotiables

- Do not fabricate ROI, visitor volumes, sales uplift, conversion rates, awards or financial outcomes.
- Preserve the user-supplied authorship, role and project narrative.
- No custom cursor, `cursor:none`, `data-cur`, Pondar, CDN fonts or third-party runtime.
- Keep the homepage navbar/footer component structurally and visually identical on this nested route, including Portfolio and the focus-trapped compact dialog through 900px.
