# Project Management

## Projects

- `Project` is the root entity for traceboard, Kanban, pins, sprints, tags, docs, and chat.
- `Project::boot()` creates default columns, one chat record, and one docs record.
- `ProjectController` owns dashboard, settings, publishing, template apply, and deletion routes.
- Project creation stores selected collaborators as pending invitations, not
  immediate members.
- `ProjectInvitationController` accepts or declines invitation rows outside the
  project member middleware.
- Template publishing and cloning logic is delegated to `App\Services\Projects`.

## Traceboard

- `TaskController@index` renders `project/traceboard`.
- `TaskController` owns task creation, movement, updates, deletion, and completion.
- Task image upload is handled by `TaskController@update`; there is no separate
  `tasks.upload-image` route.
- Task connection writes go through `ConnectionsController`.
- React operation batching lives in `resources/js/components/traceboard/use-board-operation-queue.ts`.

## Kanban

- `ColumnController@index` renders `project/kanban`.
- Columns own ordered task groups.
- Subtasks are created and updated by `SubtaskController`.
- Task and subtask user assignments are split into `TaskUserController` and `SubtaskUserController`.
- Assignment controllers broadcast typed attach and detach payloads for local
  Kanban updates.

## Sprints

- `SprintController@index` renders sprint planning.
- Project-scoped sprint CRUD uses `/{project}/sprint`.
- Cross-project sprint actions use `/sprints/{sprint}/...`.

## Docs

- `ProjectDocsController` owns project document CRUD, content saves, and assets.
- Docs routes are project-member scoped under `/{project}/docs`.
- `ProjectDocumentSaved` broadcasts saved versions to active editors.
