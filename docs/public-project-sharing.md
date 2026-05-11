# Public Project Sharing

Project sharing is modeled on `projects.visibility`, not by deleting or replacing
the editable project.

## Visibility

- `private`: default. Shared routes return 404 and the project is absent from the
  community feed. Moving a project back to private revokes its share token.
- `link_only`: shared routes are available through `projects.share_token`, but
  the project is absent from the community feed.
- `public`: shared routes are available and the project appears on the
  community feed.

`projects.published_at` records the first link-only or public publication.
`projects.public_views_count` caches unique daily non-member views.

## Publication Metadata

`community_posts.project_id` stores the project publication metadata. The row
contains the public title and description, while `image_post` stores gallery
images. The `community_post_user` pivot stores members displayed on community
cards and dialogs.

## Project Settings

Project members manage visibility from `/{project}/project-settings`. The old
`/{project}/publish` URL redirects there so sharing has one settings surface.

## Shared Routes

Public read-only routes are:

- `/p/{share_token}`
- `/p/{share_token}/traceboard`
- `/p/{share_token}/kanban`
- `/p/{share_token}/pins`
- `/p/{share_token}/docs`
- `/p/{share_token}/export`

The authenticated `POST /p/{share_token}/copy` route creates a private editable
project copy for the current user.

## Copy And Export

Exports use native Meira JSON with `schema_version`, `exported_at`, project
metadata, and `data` from `ProjectTemplatePayloadBuilder`.

Template application and shared-project copying both use `ProjectPayloadCloner`,
so columns, tasks, sprints, task connections, subtasks, notes, pins, and docs
share the same clone behavior.

## View Counting

`project_views` stores one row per project, visitor hash, and day. Project
members do not increment counts. Anonymous and authenticated non-member viewers
are counted once per day.

## Community Feed

`/community` returns public posts plus a signed-in user's collaborator subset.
Guests receive an empty collaborator subset. Link-only projects never appear in
either feed.
Community post payloads include a compact workflow preview from traceboard tasks
and notes. Uploaded gallery images take precedence; cards and dialogs render the
workflow preview only when a post has no uploaded images. The preview uses React
Flow nodes and edges so its connector behavior matches the public traceboard
view, but it disables edge animation so feed cards stay visually still.
