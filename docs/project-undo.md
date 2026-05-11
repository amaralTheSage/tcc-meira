# Project Undo

Project undo stores per-user, project-scoped inverse actions for board edits.
The first version covers Traceboard, Kanban, Pins, tags, and board assignees.

## Storage

- `project_undo_actions` stores one row per undoable user action.
- Rows include `project_id`, `user_id`, `action_type`, `action_label`,
  `undo_payload`, and `undone_at`.
- The latest row with `undone_at = null` is the only action exposed to a
  member as available undo state.

## Payloads

- Create actions store the created resource snapshot and undo by deleting it.
- Update and move actions store before and after snapshots and undo by restoring
  the before snapshot.
- Traceboard task and note moves collapse by node while they remain the latest
  user action. Undo returns to the position before the first move in that run.
- Delete actions store a recoverable before snapshot and undo by recreating it.
- Reorder actions store before and after order states for tasks, columns, or
  pins.
- Relation actions store the pivot table keys and expected post-action state.

## Conflict Policy

Undo applies only if the affected state still matches the recorded post-action
state. If another edit changed the same resource, undo aborts and leaves the row
available for a later retry or manual resolution.

## Frontend

- `ProjectUndoProvider` wraps project pages and owns `Ctrl+Z`.
- Inputs, textareas, selects, and contenteditable editors keep native undo.
- Traceboard and Pins register pending-write flushers before the undo request.
- A header icon calls `project.undo` with a forced Inertia remount so local
  board state refreshes without a browser reload.
- `ProjectBoardRefreshed` also remounts other members' project pages after an
  undo.

## Out of Scope

Docs, chat, sprint planner CRUD, project settings, members, publishing,
templates, project deletion, and redo are not included in this version.
