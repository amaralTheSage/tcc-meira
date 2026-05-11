# Frontend Structure

## Application Shell

- Inertia pages live in `resources/js/pages`.
- Shared application components live in `resources/js/components`.
- Vendored frontend UI components live under `resources/js/components/ui`,
  including shadcn-io additions.
- Shared model contracts live in `resources/js/types`.
- Shared helper logic lives in `resources/js/lib` and `resources/js/hooks`.
- Frontend-owned build assets live in `resources/js/assets`.
- Inertia page resolution lives in `resources/js/inertia-pages.ts`.
- The page map excludes colocated `*.test.tsx` files from production builds.
- The app shell currently locks appearance to dark mode in Blade and in
  `resources/js/hooks/use-appearance.tsx`.
- Appearance selection UI remains in the codebase but is not exposed in
  settings navigation while light mode is paused.

## Home Page

- The desktop Community tile uses `/landing-carousel/traceboard.png` as its
  project screenshot backdrop.
- Mobile keeps a compact text link so the home project list remains the primary
  first-screen action on small viewports.
- Home exposes account settings and logout through the same `UserMenuContent`
  dropdown used by the project sidebar.
- Vite development serves HMR on `127.0.0.1:5173` with a strict port so browser
  WebSocket refreshes do not drift between IPv4, IPv6, or alternate ports.

## Project Pages

- Project pages are grouped under `resources/js/pages/project`.
- Project pages use the sidebar project switcher for fast project changes.
- The switcher reads `projectSwitcher.projects` from shared Inertia data and
  keeps navigation on the matching workspace route when possible.
- Docs detail URLs switch to the selected project's docs index because document
  IDs are project-scoped.
- Traceboard components live under `resources/js/components/traceboard`.
- Kanban components live under `resources/js/components/kanban`.
- Project docs components live under `resources/js/components/project-docs`.
- Sprint planning components live under `resources/js/components/sprint-planner`.
- Publishing components live under `resources/js/components/publish`.
- Traceboard sprint filtering uses the shared shadcn Select control.
- Traceboard can initialize its sprint filter from the `?sprint=` URL parameter.
- Kanban filters and modal sprint assignment use shared shadcn Select controls.
- Kanban task cards show sprint assignment as compact metadata, not a title pill.
- Kanban, Team Chat, and Sprint planner share compact dark project headers,
  bordered work surfaces, and Meira-red accent states.
- Home workspace rows, project settings previews, shared Kanban, and template
  Kanban use the same dark bordered card treatment as editable project views.
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
- User search rows show a `Worked together` badge when backend collaboration
  history marks a result as a prior collaborator.
- Persisted notification UI lives under `resources/js/components/notifications`.
- The project sidebar notification trigger is owned by `NotificationPanel`.
- It uses the shared sidebar menu button so icon collapse matches other links.
- Its label is hidden in icon-collapse mode to prevent vertical overflow.

## Component Boundaries

- Large interactive views should delegate workflow logic to hooks or services.
- Modal bodies should be split into focused child components when they exceed one concern.
- Generated or third-party component trees should not drive application style choices.
- Ziggy route names are used from React with `route(...)`.
