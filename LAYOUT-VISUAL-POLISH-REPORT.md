# AV OS v2.4.20 — Full Website Layout & Visual Polish Audit

**Date:** 2026-08-17
**Scope:** Entire public website
**Constraint:** Precision only—no redesign, content reduction or feature removal.

## Audit coverage

- **24 public routes audited**
- **77 semantic content sections audited**
- Shared header, compact navigation dialog and footer audited on every route
- **174 temporary visual comparison captures**: desktop/mobile top, footer and representative mid-section states
- Pixel-geometry QA at:
  - 390×844
  - 768×1024
  - 1366×600
  - 1440×700
  - 1920×800
  - 3440×1440
  - 3840×2160
- Existing 24-route × 25-size responsive matrix and continuous-width sweeps rechecked after the visual corrections

## Findings

| Category | Findings |
|---|---:|
| Primary layout/composition issues | 3 |
| Spacing rhythm issues | 6 |
| Typography/leading inconsistencies | 7 |
| Alignment/collision issues | 2 |
| Responsive visual issues | 3 |
| Distinct findings corrected | 12 |
| Shared component families normalized | 8 |

Category totals overlap where one defect affected composition, spacing and responsive alignment.

## Corrections

### 1. Homepage short-height composition

At 1366×600, 1440×700 and 1920×800 the desktop hero’s row sizing allowed the portrait to determine an oversized second row. The primary actions and availability state were pushed below the first frame.

Corrected without removing anything:

- Reduced only the short-height stage padding and grid gap
- Applied a controlled short-height display scale to the name
- Top-aligned the copy within its row
- Tightened tagline, role and availability spacing
- Reduced only the short-height portrait envelope
- Preserved the portrait, supporting lede, scroll cue, marquee and all animations below the primary first-frame composition

Result: both CTAs and availability remain visible with comfortable breathing room at all three specified short-height resolutions.

### 2. Homepage tablet text/media collision

At 768–1080px, the supporting lede and portrait occupied the same grid row, creating a subtle text-over-image collision.

Corrected by:

- Giving name, copy, lede and portrait explicit sequential grid rows
- Adding a 24px media separation at tablet widths
- Retaining the original compact mobile composition below 768px

Result: the lede now reads cleanly before the portrait, with a deliberate 12px+ visual gap after rendered transforms.

### 3. Portfolio 1366×600 transition

The Portfolio hero’s proof strip reached the viewport edge while the next paper section intentionally overlapped by 28px, partially obscuring the bottom copy and statistics.

Corrected by:

- Using a short-height-only 100svh composition
- Rebalancing top/bottom padding on the 8-point rhythm
- Tightening title margin and scale only for ≤640px desktop heights
- Reserving a safe gap above the intentional paper overlap

Result: title, lede and proof statistics remain fully readable before the editorial paper transition.

### 4. Typographic leading normalization

Seven repeated heading families inherited the 1.6 body line-height, producing excess vertical air and uneven card rhythm:

1. AI project titles
2. Booking-card heading
3. Booking-success heading
4. Recruiter/service-card heading
5. Legal and prose subheadings
6. Portfolio practice titles
7. About “Still curious” display title

Each family now has an explicit role-appropriate line-height between 1.05 and 1.25. Typefaces, sizes, weights, copy and hierarchy are unchanged.

## Container and alignment findings

- Shared public container: consistent 1280px maximum with fluid side gutters
- Standard page hero and body axes: aligned
- Homepage section axes: aligned
- Shared header/footer axes and materials: identical across all routes
- Orange Business uses its intentionally wider 1440/1680 immersive canvas while maintaining the same mobile/tablet gutters
- Article reading measure remains intentionally narrower than media/header containers
- No accidental horizontal axis shifts were found after correction

## Grid and component review

Verified and preserved:

- Three Case Study cards as one family
- Three intentionally asymmetric Portfolio pieces
- Six Portfolio practice rows
- Sixteen-organisation proof wall
- Homepage client, capability, work, AI and journey systems
- Eight About evolution cards
- Experience timeline/job system
- Article and journal families
- Contact/booking controls and modal
- Orange Business panorama, journey, architecture, proof panels and technology-purpose controls

Variable editorial heights and asymmetry were retained where intentional.

## Intentionally preserved exceptions

- About’s full-bleed identity spread, sticky 3D film stack and paper-curtain overlap
- Portfolio’s asymmetric project composition and negative paper transition
- Orange Business’s wider immersive content canvas
- Article/case-study full-bleed hero media
- Narrow editorial reading measures inside wider page containers
- Approved compact-landscape About simplifications from the existing creative direction
- Full normal-motion choreography; only user-requested reduced-motion behavior differs

## Final visual QA

`tests/visual_precision_qa.js` verifies:

- 24 routes
- 77 semantic sections
- Seven composition viewports
- Primary container axes
- Unexpected section overlap
- Heading geometry and leading
- Navigation/H1 separation
- Homepage short-height CTA visibility
- Portfolio short-height transition clearance
- Story CTA containment
- Tablet homepage media/text separation

**Result: ALL CLEAN.**

## Preservation confirmation

No page, section, text, image, video region, project, case study, animation, interaction, form, CTA, button, navigation item or functionality was removed, hidden, disabled, simplified or replaced during this visual precision pass.
