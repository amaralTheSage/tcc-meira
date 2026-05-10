# Frontend Structure

## Application Shell

- Inertia pages live in `resources/js/pages`.
- Shared application components live in `resources/js/components`.
- Shared model contracts live in `resources/js/types`.
- Shared helper logic lives in `resources/js/lib` and `resources/js/hooks`.
- Frontend-owned build assets live in `resources/js/assets`.
- Inertia page resolution lives in `resources/js/inertia-pages.ts`.
- The page map excludes colocated `*.test.tsx` files from production builds.

## Project Pages

- Project pages are grouped under `resources/js/pages/project`.
- Traceboard components live under `resources/js/components/traceboard`.
- Kanban components live under `resources/js/components/kanban`.
- Project docs components live under `resources/js/components/project-docs`.
- Sprint planning components live under `resources/js/components/sprint-planner`.
- Publishing components live under `resources/js/components/publish`.
- Traceboard sprint filtering uses the shared shadcn Select control.
- Traceboard can initialize its sprint filter from the `?sprint=` URL parameter.
- Kanban filters and modal sprint assignment use shared shadcn Select controls.
- Kanban task cards show sprint assignment as compact metadata, not a title pill.
- Sprint color rendering uses `resources/js/lib/sprint-colors.ts` so selectors,
  badges, and Gantt rows share the same fallback and contrast rules.
- Sprint badge UI lives in `resources/js/components/sprint-badge.tsx` and is
  reused by traceboard and Kanban task cards.
- Sprint planner row controls use fixed-size icon buttons.
- Sprint planner actions live in the Gantt sidebar rows beside each sprint.
- Sprint task selection saves the complete selected set, including empty sets.
- Project settings destructive actions use the shared Button destructive variant.
- Project settings member management lives in
  `resources/js/components/project-settings/member-manager.tsx`.
- JSON-backed user search lives in `resources/js/components/user-search-picker.tsx`
  and should be used instead of Inertia navigation for invite pickers.
- Persisted notification UI lives under `resources/js/components/notifications`.
- The project sidebar notification trigger is owned by `NotificationPanel`.
- It uses the shared sidebar menu button so icon collapse matches other links.
- Its label is hidden in icon-collapse mode to prevent vertical overflow.

## Component Boundaries

- Large interactive views should delegate workflow logic to hooks or services.
- Modal bodies should be split into focused child components when they exceed one concern.
- Generated or third-party component trees should not drive application style choices.
- Ziggy route names are used from React with `route(...)`.
