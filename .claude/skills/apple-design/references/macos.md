# macOS Design System

Official: https://developer.apple.com/design/human-interface-guidelines/designing-for-macos

## Character

- Large high-resolution displays, often multiple displays.
- Stationary use at roughly 1–3 feet.
- High-precision keyboard, mouse, and trackpad input.
- Sessions often involve hours of concentration and multiple simultaneous apps/windows.

## Core model

- Windows are user-owned workspaces: movable, resizable, minimizable, restorable, full-screen capable, and stateful.
- The menu bar should expose the app’s command model, including commands not currently represented in visible UI.
- Toolbars, sidebars, inspectors, tables, outlines, split views, context menus, keyboard shortcuts, drag and drop, and file workflows are first-class.
- Information density can be higher than on touch platforms, but hierarchy and scanability must remain comfortable.
- Use precision input to enable detailed selection and editing without making targets needlessly small.

## Design priorities

- Present more context with fewer nested levels and less modality.
- Preserve window size, position, sidebar/inspector state, selection, and relevant document state.
- Support keyboard-only workflows and standard shortcut conventions.
- Use standard menus and command names; disable unavailable commands rather than hiding every one.
- Support active/inactive window states and multiple windows/documents.
- Provide toolbar customization where it benefits serious workflows.
- Respect system appearance, accent color, increased contrast, reduced transparency, and text preferences.
- Use sheets for window-scoped decisions; reserve app-modal interruption for truly global blockers.

## Target baseline

- Default body text: 13 pt
- Minimum custom text: 10 pt
- Default button target: 28×28 pt
- Minimum target: 20×20 pt, used carefully with high-precision input

## Current official resources

- macOS 27 UI kit: Figma and Sketch
- Resource index: https://developer.apple.com/design/resources/#macos-apps

## Review checklist

- [ ] Resizable from compact to large and across displays
- [ ] Complete menu-bar command model
- [ ] Keyboard shortcuts and focus order
- [ ] Context menus and drag/drop where expected
- [ ] Multiple windows/documents and restoration
- [ ] Active/inactive appearance
- [ ] Full-screen behavior
- [ ] VoiceOver and Full Keyboard Access
- [ ] High contrast/reduced transparency
- [ ] No enlarged mobile layout masquerading as a Mac app
