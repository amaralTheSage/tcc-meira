# Notifications

## Delivery

- Actionable notifications use Laravel notification channels: `database`,
  `broadcast`, and `mail`.
- Reverb broadcasts target `App.Models.User.{id}` private channels.
- `User::receivesBroadcastNotificationsOn()` owns the user notification channel.
- `NotificationFeed` formats database notifications for Inertia shared props.

## Notification Types

- `project_invite`: sent when a project creator selects collaborators.
- `task_assigned`: sent when a project member is assigned to a task.
- `subtask_assigned`: sent when a project member is assigned to a subtask.
- `chat_mention`: sent only for explicit team chat mentions.

## Project Invitations

- Selected collaborators are stored in `project_invitations` as pending rows.
- Invitees are not attached to `project_user` until they accept.
- Accepting an invitation attaches the invitee and redirects to the project.
- Declining an invitation leaves project membership unchanged.

## Frontend

- `NotificationMenu` renders persisted notifications on home and project pages.
- The menu prepends Reverb notification payloads without a page reload.
- Dismissed notifications are soft-deleted through `DELETE /notifications/{id}`.
- Dismissed rows disappear from the feed and unread count after refresh.
- Project invite actions call accept or decline routes from the notification.
- Invite actions send `notification_id` so accepted or declined invite notices
  are soft-deleted with the action.
- Non-invite actions mark the row read and link to the target project view.
