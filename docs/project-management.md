# Project Management

## Projects

- `Project` is the root entity for traceboard, Kanban, pins, sprints, tags, docs, and chat.
- `Project::boot()` creates default columns and one chat record for every new project.
- `ProjectController` owns dashboard, settings, publishing, template apply, and deletion routes.
- Template publishing and cloning logic is delegated to `App\Services\Projects`.

## Traceboard

- `TaskController@index` renders `project/traceboard`.
- `TaskController` owns task creation, movement, updates, deletion, and completion.
- Task connection writes go through `ConnectionsController`.
- React operation batching lives in `resources/js/components/traceboard/use-board-operation-queue.ts`.

## Kanban

- `ColumnController@index` renders `project/kanban`.
- Columns own ordered task groups.
- Subtasks are created and updated by `SubtaskController`.
- Task and subtask user assignments are split into `TaskUserController` and `SubtaskUserController`.

## Sprints

- `SprintController@index` renders sprint planning.
- Project-scoped sprint CRUD uses `/{project}/sprint`.
- Cross-project sprint actions use `/sprints/{sprint}/...`.
