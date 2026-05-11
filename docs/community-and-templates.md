# Community And Templates

## Community

- `/community` is rendered by `CommunityController@feed`.
- `/community/profile/{user}` loads a user with projects, posts, and templates.
- `ProjectPublisher` creates community posts and optional templates.
- Community cards use uploaded post images first, then a generated workflow
  preview from the published project's tasks and notes.

## Template Preview

- `TemplatePreviewController` renders template preview pages.
- Preview routes are grouped under `/templates/{template}`.
- Preview pages exist for traceboard, Kanban, and pins.
- Preview pages are read-only. They should not reuse editable project controls.

## Template Apply

- `ProjectTemplateApplier` clones template data inside a database transaction.
- `ProjectTemplatePayloadBuilder` serializes columns, tasks, sprints, subtasks, pins, notes, docs, and task connections.
- `ProjectTemplatePayloadValidator` checks template JSON shape before cloning.
- Template columns replace the new project's boot-created default columns when
  the payload contains columns.
- `ProjectTemplateApplier` clones docs after replacing the new project's default document.
- Applying a template redirects to the cloned project's traceboard.
