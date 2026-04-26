# Backend Test Suite

This suite is Pest-only and runs with:

```bash
php artisan test
```

Feature tests live under `tests/Feature/Backend` and cover authenticated routes,
project workflows, traceboard, Kanban, sprints, pins, chat, community,
templates, tags, subtasks, and assignments. Unit tests cover model defaults,
service payloads, notifications, and broadcast event payloads.

`tests/Support/BackendFixtures.php` owns shared fixture setup. Prefer extending
that helper instead of copying project/member/task setup into individual tests.

All Laravel tests extend `Tests\TestCase`; feature tests use `RefreshDatabase`.
`Tests\TestCase` disables Vite so Inertia responses can be asserted without a
frontend build manifest.

The suite intentionally asserts expected secure behavior:

- Project routes require authenticated project membership.
- Nested resources must belong to the route project.
- Global sprint lifecycle routes must still enforce project membership.
- Task, subtask, tag, chat, and assignment requests must reject foreign project
  records.
- Chat messages must use the authenticated user as author.

Some of these expectations fail against the current controllers. Treat those
failures as backend work items, not test flakiness.
