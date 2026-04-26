# Community And Templates

## Community

- `/community` is rendered by `CommunityController@feed`.
- `/community/profile/{user}` loads a user with projects, posts, and templates.
- `ProjectPublisher` creates community posts and optional templates.
- Community post images are not persisted by the current publisher; see `ISSUES.md`.

## Template Preview

- `TemplatePreviewController` renders template preview pages.
- Preview routes are grouped under `/templates/{template}`.
- Preview pages exist for traceboard, Kanban, and pins.

## Template Apply

- `ProjectTemplateApplier` clones template data inside a database transaction.
- `ProjectTemplatePayloadBuilder` serializes columns, tasks, subtasks, pins, notes, and task connections.
- Applying a template redirects to the cloned project's traceboard.
