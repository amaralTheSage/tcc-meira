# Core And Auth

## Entry Points

- `/` is rendered by `WelcomeController`.
- `/home` is rendered by `ProjectController@index`.
- Authenticated routes use `auth` and `ValidateSessionWithWorkOS`.
- Settings routes live in `routes/settings.php`.

## Users

- `UserController@searchUsers` backs `/search-users` with JSON results and
  excludes the authenticated user.
- `UserController@acceptFriendship` accepts friend requests.
- `User` owns project, task, friend, post, and template relationships.

## Auth Boundary

- Project routes require an authenticated session.
- Project membership authorization is not centralized yet; see `ISSUES.md`.
- Controllers should keep route rendering thin and move workflow logic to services.
