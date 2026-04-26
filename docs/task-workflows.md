# Task Workflows

## Realtime Assignments

- Task assignment broadcasts include `projectId`, `taskId`, `user`, and
  `assigned`.
- Subtask assignment broadcasts also include `subtaskId` and parent `taskId`.
- Kanban listeners ignore events for other projects and update local state
  without reloading columns.

## Deletes

- Task and subtask delete routes accept raw string IDs so optimistic UI records
  can be deleted before they reach the database.
- Missing raw IDs are tolerated. Existing records from another project still
  return `404`.
- The old development-only `/{project}/deletar-tasks` bulk route is not
  registered.

## Images

- Task image uploads use `TaskController@update` with multipart `_method=PATCH`.
- There is no separate `tasks.upload-image` route.
