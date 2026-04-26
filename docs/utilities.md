# Utilities

## Notes

- Notes belong to projects.
- `NoteController` creates, updates, moves, and deletes traceboard notes.
- Note mutations broadcast through the shared node event classes.

## Pins

- Pins belong to projects and can be text or link pins.
- `PinController@index` renders `project/pins`.
- Pin movement stores ordered board positions.
- Pin website logos use a curated frontend SVG catalog with a generic fallback.

## Tags

- Tags belong to projects and can attach to tasks.
- `TagController` owns tag CRUD, apply, and detach routes.
- Task tag state is used by both Kanban and traceboard components.

## Docs Surface

- `ProjectDocsController@show` renders project docs.
- The rich document editor lives under `resources/js/components/doc-maker`.
- The code-block renderer is treated as generated/vendor-like UI for lint boundaries.
