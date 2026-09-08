# Liquid Glass

Official source: https://developer.apple.com/design/human-interface-guidelines/materials#Liquid-Glass

Liquid Glass is Apple’s dynamic functional material for controls and navigation. It creates a distinct layer above content while letting content remain perceptible beneath it.

## Correct use

- Use it for functional chrome: navigation, tab bars, sidebars, toolbars, floating controls, menus, popovers, and transient active controls.
- Keep content itself in the content layer using standard materials/backgrounds.
- Prefer system components, which automatically receive platform-appropriate material behavior.
- Apply custom glass sparingly and only when hierarchy and interaction benefit.

## Variants

### Regular

- Blurs and adjusts luminosity to protect foreground legibility.
- Appropriate for text-bearing chrome, sidebars, alerts, and popovers.
- Usually the safer default.

### Clear

- Highly translucent and best over rich media where preserving background visibility is important.
- Use for sparse floating controls rather than text-heavy surfaces.
- If content beneath is bright, Apple recommends considering a dark dimming layer around 35% opacity; dark media may not need it.

## Hierarchy rules

- Glass is not a decorative card style.
- Don’t put glass on every content panel.
- Group related controls into coherent glass regions.
- Avoid glass-on-glass nesting that destroys hierarchy.
- Let scroll-edge effects mediate content passing beneath chrome.
- Maintain separation between controls and content through placement, material, contrast, and behavior.

## Accessibility

- Test Reduce Transparency, Increase Contrast, light/dark appearance, and different background content.
- Never assume blur alone guarantees legibility.
- Use semantic/vibrant foreground colors and sufficient contrast.
- Provide near-solid fallback surfaces when transparency is reduced.
- Motion/refraction must not become necessary to understand state.

## Web translation

Apple’s native material isn’t equivalent to a CSS blur. When translating to web:

```css
.control-layer {
  background: color-mix(in srgb, #0b1020 72%, transparent);
  border: 1px solid rgba(255,255,255,.16);
  -webkit-backdrop-filter: blur(20px) saturate(160%);
  backdrop-filter: blur(20px) saturate(160%);
}
@media (prefers-reduced-transparency: reduce) {
  .control-layer { background: #0b1020; backdrop-filter: none; }
}
@media (prefers-contrast: more) {
  .control-layer { background: rgba(11,16,32,.96); border-color: rgba(255,255,255,.42); }
}
```

Use this only for chrome, never as a universal content-card recipe.

Related official videos:
- Meet Liquid Glass: https://developer.apple.com/videos/play/wwdc2025/219/
- Get to know the new design system: https://developer.apple.com/videos/play/wwdc2025/356/
