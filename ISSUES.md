# Issues Found During AGENTS Refactor

These are product or incomplete-feature issues found during the structure pass. They were not fixed in this refactor.

## Project Access Control

- Project creation still shows a generic user picker instead of a friends-first collaborator workflow.

## Publishing

- `ProjectPublisher` accepts `images` but does not persist them to the `image_post` table.
- Project deletion after publishing appears intentionally unfinished in the previous controller flow.
- The community profile page receives newly published data only through a render response, not a redirect or shared reload strategy.

## Templates

- Applying a template creates a normal `Project`, which also creates default columns through `Project::boot()`. Template columns are then cloned on top of those defaults.
- Template Kanban preview has incomplete UI coverage compared with traceboard and pins previews.
- Template payloads are stored as JSON arrays without schema validation before cloning.

## Team Chat And Notifications

- Notification UI components use static sample data instead of persisted notifications.
- `NotificationService` is not wired into project invites or task assignment flows.
- Chat supports storing messages, but edit/delete message flows are not implemented.

## Task And Subtask Workflows

- A previous development route named `/{project}/deletar-tasks` deleted all project tasks and had no production-safe guard.
- Task and subtask assignment events only broadcast the user/task IDs; the frontend reloads data instead of applying a typed payload.
- Some task deletion routes accept raw IDs so the UI can delete optimistic tasks that may not exist yet.
- Task image upload exists inside the update endpoint, but the removed `tasks.upload-image` route referenced a missing method.

## Docs Editor

- Project docs have a route and editor components, but persistence and project-scoped document models are not implemented.
- The code-block editor component tree is treated as generated/vendor-like UI and still needs a dedicated ownership decision before deeper refactor.

## Build Packaging

- `npm run build` leaves `/community_wavy_thing.svg` and `/welcome-bg.png` unresolved until runtime.
- Several generated syntax-highlighting and context-menu chunks exceed Vite's default 500 kB warning threshold.
