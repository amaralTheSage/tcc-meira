# Collaboration History

Collaboration history is a system-owned signal, not a social graph. Users do not
send friend requests or manage friend lists.

## Source Of Truth

`project_user` remains the current project access table. A collaboration exists
after two users have accepted membership in the same project.

`project_collaborations` preserves historical directed lookup rows:

- `project_id`: project where the collaboration happened.
- `user_id`: user receiving ranked recommendations.
- `collaborator_id`: person they worked with.
- `first_collaborated_at`: first time the pair was recorded.
- `last_collaborated_at`: latest time the pair was observed.

Rows are directed so user search can query one user's collaborators quickly.

## Recording

`ProjectMembership` records history when a `project_user` row is created.
`ProjectInvitationController@accept` also records after accepted invitations.

Removed members stay in collaboration history. Pending invitations do not count.

## Search Ranking

`CollaborationHistoryService::rankUsersFor` adds:

- `has_collaborated`
- `shared_projects_count`

Search endpoints sort collaborators first, then by shared project count, then by
name. Project invite search still allows any eligible non-member.

## Community Feed

`/community` returns `collaboratorPosts` for public projects owned by people the
viewer has worked with. The UI labels this subset as `Network` to avoid
presenting collaboration history as a managed collaborator list. Guests receive
an empty network subset.
