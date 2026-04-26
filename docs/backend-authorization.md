# Backend Authorization And Scoping

Authenticated project routes under `/{project}` use `project.member` middleware.
The middleware returns `403` when the signed-in user is not attached to the
project through `project_user`.

Global sprint lifecycle routes under `/sprints/{sprint}` use
`sprint.project.member`. These routes do not include a project URL segment, so
membership is checked through the sprint's `project_id`.

Controllers still scope nested resources after middleware runs. A route project
may only mutate tasks, notes, columns, pins, sprints, subtasks, tags, chats, and
task connections that belong to that same project. Existing records from another
project return `404`.

Delete endpoints for locally generated task and subtask IDs tolerate records
that never reached the database. They still reject existing records owned by a
different project.

Request payloads that reference project-owned resources validate against the
route project where practical. Examples include task `column_id`, task
`sprint_id`, task and subtask assignees, tag application, chat messages, and
Kanban column reorder payloads.
