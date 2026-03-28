# Utilities (Notes, Pins, Tags)

This document handles ancillary UI features that attach to Tasks, Projects, or Subtasks.

## Notes
- Managed via `NoteController` under a specific project (`/traceboard/notes`). Can be updated, moved, and destroyed.

## Pins
- Pins are spatial or visual markers on the board. They can be dynamically moved via `patch('/pins/move/{pin}')`.

## Tags
- Common organizational tags managed by `TagController`. Apply and detach endpoints exist (`/apply-tag`, `/detach-tag`).

**[Add specific design decisions regarding UI styling, drag-and-drop behaviors, or polymorphic relationships here]**
