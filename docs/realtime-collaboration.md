# Realtime Collaboration

## Broadcasting

- Board events use private channels for tasks, columns, subtasks, and cursors.
- Event payload classes in `app/Events` use typed public payload properties.
- Traceboard task and note movement broadcasts `NodeDragged`.
- Task and note creation broadcasts `NodeAdded`.
- Task and note deletion broadcasts `NodeRemoved`.

## Cursor Updates

- `ProjectCursorController@store` validates cursor coordinates.
- The traceboard frontend also whispers cursor movement through Echo.
- Stale cursor nodes are removed client-side after an inactivity threshold.

## Team Chat

- `ChatController@index` renders `project/team-chat`.
- The project payload loads `chat.messages.user` ordered by creation time.
- `MessageController@store` creates messages and broadcasts `MessageAdded`.
- Message attachments are stored on the public disk under `messages`.
