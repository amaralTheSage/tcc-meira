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

## Optimistic Traceboard Writes

- Traceboard task and note update/move/complete routes resolve raw string IDs in
  the controller instead of relying on UUID route model binding.
- Missing task or note IDs from optimistic clients create project-owned
  placeholders; existing IDs from other projects still return `404`.
- Late task or note store requests are idempotent and do not overwrite an
  earlier move, rename, or status write for the same client ID.
- Kanban subtask creation uses server-generated subtask IDs; client-supplied
  IDs in create payloads are ignored.

## Images

- Task image uploads use `TaskController@update` with multipart `_method=PATCH`.
- There is no separate `tasks.upload-image` route.
