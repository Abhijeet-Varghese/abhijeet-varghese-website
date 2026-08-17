# Apple Accessibility Design System

Official: https://developer.apple.com/design/human-interface-guidelines/accessibility

An accessible interface is intuitive, perceivable, and adaptable. Accessibility is a design input, not a post-build patch.

## Vision

- Support Dynamic Type/system text styles and custom enlargement.
- Aim to support at least 200% enlargement; watchOS guidance calls for at least 140%.
- Don’t clip, overlap, truncate essential text, or lock content into fixed heights.
- Use sufficient weight/size; thin small text is difficult to read.
- Don’t encode meaning with color alone.
- Test color blindness, low vision, light sensitivity, Dark Mode, Increase Contrast, Reduce Transparency, and Bold Text.

### Contrast baselines used by Apple Accessibility Inspector

- Text up to 17 pt: 4.5:1
- Text 18 pt or larger: 3:1
- Bold text: 3:1

## VoiceOver and semantics

- Give every meaningful control a clear role, label, value, state, and hint only when needed.
- Keep reading/focus order aligned with visual and task order.
- Announce asynchronous changes and errors without moving focus unexpectedly.
- Group related visual fragments into a useful accessibility element.
- Hide purely decorative artwork from assistive technology.
- Ensure custom components expose the same semantics as system equivalents.

## Motor

- Use generous targets and spacing.
- Support keyboard/Full Keyboard Access, Switch Control, Voice Control, AssistiveTouch, Dwell Control, and alternative inputs appropriate to the platform.
- Avoid time-critical precision as the only path.
- Make drag actions available through an alternative command.
- Keep motion cancellable and controls reachable without prolonged posture/reach.

## Hearing

- Caption spoken and meaningful audio.
- Provide visual/haptic alternatives for audio-only alerts.
- Don’t rely on haptics as the only signal.
- Respect audio routing, volume, and environmental context.

## Cognitive

- Use familiar language and consistent placement.
- Keep flows direct, forgiving, and recoverable.
- Prevent errors where possible; explain correction near the source and in a useful summary.
- Avoid unnecessary animation, surprise, or irreversible action.
- Preserve state and let people resume.

## Motion

- Honor Reduce Motion.
- Don’t use motion as the only state signal.
- Prefer fades or direct state changes when spatial travel adds no information.
- Avoid flashing, large-field motion, parallax that can’t be disabled, and sustained oscillation.

## Platform baseline table

See `../data/platform-metrics.csv` for default/minimum text and target sizes.

## Review matrix

- [ ] Dynamic Type/accessibility sizes
- [ ] VoiceOver path and rotor/grouping
- [ ] Full Keyboard Access/focus visibility
- [ ] Switch/Voice Control names
- [ ] Increase Contrast
- [ ] Reduce Transparency
- [ ] Reduce Motion
- [ ] Bold Text and Button Shapes
- [ ] Color Filters/grayscale
- [ ] RTL and long localization
- [ ] Captions/audio alternatives
- [ ] Errors and status announcements
