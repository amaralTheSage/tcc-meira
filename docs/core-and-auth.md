# Core And Auth

## Entry Points

- `/` is rendered by `WelcomeController`.
- `/home` is rendered by `ProjectController@index`.
- Authenticated routes use `auth` and `ValidateSessionWithWorkOS`.
- Settings routes live in `routes/settings.php`.

## Users

- `UserController@searchUsers` backs `/search-users` with JSON results and
  excludes the authenticated user.
- Search results include collaborator ranking metadata from accepted project
  membership history.
- `User` owns project, task, post, and template relationships.
- `settings/profile` displays the stored user avatar, including WorkOS-provided
  remote URLs. Uploading a profile image stores a local public avatar URL and
  replaces the app's `users.avatar` value without mutating the WorkOS account.

## Auth Boundary

- Project routes require an authenticated session.
- Project membership authorization is not centralized yet; see `ISSUES.md`.
- Controllers should keep route rendering thin and move workflow logic to services.
