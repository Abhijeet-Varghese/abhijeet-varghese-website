# visionOS Design System

Official: https://developer.apple.com/design/human-interface-guidelines/designing-for-visionos

## Character

- Infinite 3D space with windows, volumes, 3D objects, Shared Space, and Full Space.
- People remain connected to surroundings through passthrough and can vary immersion.
- Primary interaction combines eyes for targeting with an indirect hand gesture; direct touch, keyboard, pointer, controller, and accessibility inputs may supplement it.
- Spatial Audio, depth, scale, placement, and comfort are part of the interface.

## Start familiar

- Use windows for contained, UI-centric tasks.
- Enter deeper immersion only for moments that benefit from it; choose the minimum sufficient immersion.
- Use system components/materials so gaze, focus, depth, and accessibility behavior remain familiar.
- Let people position windows and preserve spatial continuity.

## Comfort

- Keep essential content within a comfortable field of view and relative to the head.
- Bring content to people; don’t require prolonged reach, frequent head turns, or excessive body movement.
- Support indirect gestures with hands resting naturally.
- Use direct manipulation only at a comfortable distance and duration.
- Avoid fast peripheral motion, large high-contrast moving surfaces, sustained oscillation, world rotation, and motion without a stable frame of reference.
- Prefer fades when relocation motion communicates nothing useful.

## Spatial hierarchy

- Use depth sparingly and semantically.
- Maintain legibility across dynamic scale and distance.
- Keep controls in predictable planes and avoid uncontrolled overlap.
- Use passthrough intentionally; never obscure surroundings without a clear reason and user control.
- Use Spatial Audio to reinforce source and space, not to distract.

## Target baseline

- Default text: 17 pt
- Minimum custom text: 12 pt
- Default target: 60×60 pt
- Minimum target: 28×28 pt; use with care because gaze targeting benefits from generous separation.

## Current official resources

- visionOS 26 UI kit: Figma and Sketch
- visionOS 2 legacy UI kit/templates: Figma and Sketch
- Resource index: https://developer.apple.com/design/resources/#visionos-apps

## Review checklist

- [ ] Minimum sufficient immersion selected
- [ ] Comfortable field-of-view placement
- [ ] Gaze targets are generous and separated
- [ ] Indirect gesture path works
- [ ] Stationary visual reference for motion
- [ ] Passthrough and exit controls remain available
- [ ] Seated/standing/lying contexts considered
- [ ] VoiceOver, Dwell Control, Switch Control, Head Pointer
- [ ] No forced world rotation or peripheral motion
