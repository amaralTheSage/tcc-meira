# Realtime Collaboration

## Broadcasting

- Board events use private channels for tasks, columns, subtasks, and cursors.
- Event payload classes in `app/Events` use typed public payload properties.
- Traceboard task and note movement broadcasts `NodeDragged`.
- Traceboard task connection creates/deletes broadcast `TaskConnectionChanged`
  with `{ sourceId, targetId, connected, userId }`.
- Task and note creation broadcasts `NodeAdded`.
- Task and note deletion broadcasts `NodeRemoved`; context-menu, note button,
  Backspace, and Delete-key selected-node deletes all queue the same backend
  delete routes.
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
- Cursor whispers use a leading and trailing one-second throttle.
- Remote traceboard cursors animate between whispered positions with a
  one-second smoothstep `requestAnimationFrame` interpolation.
- Cursor tracking uses one window-level pointer listener and reads the current
  board ref at event time so remounts do not freeze outbound cursor whispers.
- Remote cursor nodes have fixed dimensions so React Flow keeps them visible
  during animation, disable pointer events, and use shared user-id palette
  colors.
- Remote cursor nodes are hidden while that user owns any active task or note
  touch lock.
- The first remote cursor point appears immediately. Later whispers retarget
  from the currently rendered point.
- Stale cursor nodes are removed client-side after an inactivity threshold.
- Intermediate task and note drag patches are throttled to one per second.
- Drag-stop patches still save immediately so final coordinates and undo
  snapshots stay precise.
- Remote task and note drags are listened to once at board level and glide from
  the currently rendered position to each broadcast target.

## Traceboard Touch Locks

- Traceboard task and note touch locks are UI-only Echo whispers on the existing
  `tasks` channel; no database state, routes, or backend event classes are
  changed.
- `nodeTouchStarted` whispers use
  `{ nodeId, type, user: { id, name, avatar }, expiresAt }`.
- `nodeTouchEnded` whispers use `{ nodeId, userId }`.
- Local locks track `pointer`, `drag`, `editing`, and `context` reasons. A lock
  is released only after every active reason for that node ends.
- Drag locks clear locally on drag stop, then wait for a one-second remote
  quiet period before whispering release to other clients.
- Starting another drag before that delay ends cancels the pending release and
  starts a fresh delay on the next drag stop.
- The local drag release also clears the pointer reason from the same drag
  gesture; newer pointer, editing, and context locks cancel or hold the delayed
  remote release.
- Pointer release is listened for in capture phase and also requests drag
  cleanup, so React Flow event handling cannot leave a drag lock stranded.
- Active local locks heartbeat before the eight-second stale timeout. Missing
  releases are removed client-side after expiry.
- All clients render locked tasks and notes with the locking user's palette
  border color. Remote locks also show the locking user avatar beside the node;
  the locking user sees only their own colored border.
- Remote-locked React Flow nodes are decorated with `draggable: false` and
  `connectable: false`.
- Board-level guards ignore remote-locked node drag changes, blocked connects,
  blocked edge deletes, and queued task/note mutations that touch a locked node.

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
