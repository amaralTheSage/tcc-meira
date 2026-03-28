# Project Management

This document handles the core heavy-lifting of the "Meira" application: Projects, Tasks, and methodologies (Kanban vs. Traceboard vs. Sprints).

## Projects
- Projects are the root entity. Almost all core routes are prefixed with `/{project}` and verify project membership.
- Projects can be published (`ProjectController::publish`) or deleted.

## Traceboard vs. Kanban
- **Traceboard:** Deals with raw `Task` mapping (`/traceboard/tasks`). Tasks can be completed, updated, and connected (`tasks.connect`).
- **Kanban:** Handles `Column` and `Subtask` entities under the `/kanban` domain. Columns can be reordered (`/kanban/columns/reorder`).
- **Sprints:** Sprints group tasks together (`/sprints/{sprint}/attach-tasks`). Managed via `SprintController`.

**[Add specific design decisions regarding Project structure, Eloquent relationships, or UI/UX rules here]**
