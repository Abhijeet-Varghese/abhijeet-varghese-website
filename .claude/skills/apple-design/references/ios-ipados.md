# iOS and iPadOS Design Systems

Official guidance:
- https://developer.apple.com/design/human-interface-guidelines/designing-for-ios
- https://developer.apple.com/design/human-interface-guidelines/designing-for-ipados

## Shared foundations

- Primary input is direct touch; controls must feel immediate and track gestures continuously.
- Adapt to portrait/landscape, Dark Mode, Dynamic Type, localization, safe areas, and device features.
- Prefer system navigation, controls, sheets, alerts, menus, search, sharing, authentication, and permission flows.
- Place important frequent actions where hands can reach comfortably, generally middle/lower regions on iPhone.
- Keep content primary and controls discoverable without crowding the screen.
- Use semantic system colors/materials rather than hard-coding their apparent color.
- Standard touch target: 44×44 pt; don’t shrink the hit area to the visible glyph.

## iOS — iPhone

### Character

- Medium high-resolution display, usually held one- or two-handed at close distance.
- Interactions range from seconds to long media/game sessions.
- People frequently switch apps and expect state continuity.
- Core inputs include touch, virtual keyboard, voice, sensors, and optional controllers/spatial interaction.

### Priorities

- Focus each screen on a primary task.
- Keep hierarchy shallow and make back navigation predictable.
- Preserve edge-swipe/back conventions.
- Design around interruption, one-handed reach, changing orientation, and privacy-sensitive context.
- Integrate widgets, Spotlight, Shortcuts, quick actions, Live Activities, and platform capabilities when they add real value.

## iPadOS — iPad

### Character

- Large mobile display used handheld, on a surface, or on a stand.
- Supports touch, keyboard, trackpad/mouse, Apple Pencil, voice, and mixed input.
- Sessions can become deep productivity or creation workflows.
- Multiple apps/windows, resizing, drag and drop, and external displays are normal.

### Priorities

- Use the larger canvas for richer hierarchy, sidebars, inspectors, toolbars, and persistent context—not merely a stretched iPhone layout.
- Avoid unnecessary full-screen modal transitions.
- Support arbitrary window sizes and multitasking configurations.
- Give keyboard users shortcuts, focus navigation, menus, and discoverability.
- Give pointer users hover/focus feedback without making it required for touch.
- Give Apple Pencil precision, low latency, hover/gesture affordances where supported, and non-Pencil alternatives.
- Make drag and drop work within the app and across apps where appropriate.

## Current official resources

- iOS 27 and iPadOS 27 UI kit: Figma and Sketch
- App icon template: Figma, Sketch, Photoshop/Illustrator package
- Resource index: https://developer.apple.com/design/resources/#ios-apps

## Review checklist

- [ ] 44×44 pt minimum interactive targets
- [ ] Safe areas and system overlays respected
- [ ] Dynamic Type through accessibility sizes
- [ ] Portrait, landscape, split view, narrow and wide windows
- [ ] Touch + keyboard + pointer + Pencil paths on iPad
- [ ] Back, dismiss, undo, destructive confirmation
- [ ] Light/Dark, Increase Contrast, Reduce Transparency, Reduce Motion
- [ ] VoiceOver order and useful labels
- [ ] No iPhone-only assumptions in iPad layouts
