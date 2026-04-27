# Realtime Collaboration

## Broadcasting

- Board events use private channels for tasks, columns, subtasks, and cursors.
- Event payload classes in `app/Events` use typed public payload properties.
- Traceboard task and note movement broadcasts `NodeDragged`.
- Task and note creation broadcasts `NodeAdded`.
- Task and note deletion broadcasts `NodeRemoved`.
- Task and subtask assignment broadcasts include `projectId`, `assigned`, and a
  typed `user` object so Kanban can update local state without reloading columns.
- Assignment listeners ignore payloads for other projects because the current
  broadcast channels are not project-scoped.
- Document saves broadcast on project/document presence channels so open editors
  can sync versions without reloading the docs page.

## Cursor Updates

- `ProjectCursorController@store` validates cursor coordinates.
- The traceboard frontend also whispers cursor movement through Echo.
- Traceboard cursor whispers keep the payload shape `{ id, x, y }`.
- Remote traceboard cursors are rendered as client-owned React Flow nodes with
  `remote-cursor:{userId}` ids, separate from task and note state.
- Remote traceboard cursors animate between whispered positions with a 260ms
  requestAnimationFrame interpolation, below the 300ms send interval.
- The first remote cursor point appears immediately. Later whispers retarget
  from the currently rendered point.
- Stale cursor nodes are removed client-side after an inactivity threshold.

## Team Chat

- `ChatController@index` renders `project/team-chat`.
- The project payload loads members and `chat.messages.user` ordered by creation
  time.
- `MessageController@store` creates messages and broadcasts `MessageAdded`.
- Message edits broadcast `MessageUpdated`; soft deletes broadcast
  `MessageDeleted`.
- Message attachments are stored on the public disk under `messages`.
- Explicit chat mentions send notifications; ordinary messages stay chat-only.

## Notifications

- Laravel notification broadcasts use private `App.Models.User.{id}` channels.
- `NotificationMenu` listens with `useEchoNotification` and updates the unread
  list in place.

## Project Docs

- Docs presence channels use `project.{project}.docs.{document}`.
- Presence authorization returns collaborator id, name, and avatar.
- The editor whispers `docsSelection` payloads for remote cursor decorations.
- Stale saves return HTTP 409 with the latest document payload.
