# Frontend Structure

## Application Shell

- Inertia pages live in `resources/js/pages`.
- Shared application components live in `resources/js/components`.
- Shared model contracts live in `resources/js/types`.
- Shared helper logic lives in `resources/js/lib` and `resources/js/hooks`.

## Project Pages

- Project pages are grouped under `resources/js/pages/project`.
- Traceboard components live under `resources/js/components/traceboard`.
- Kanban components live under `resources/js/components/kanban`.
- Sprint planning components live under `resources/js/components/sprint-planner`.
- Publishing components live under `resources/js/components/publish`.

## Component Boundaries

- Large interactive views should delegate workflow logic to hooks or services.
- Modal bodies should be split into focused child components when they exceed one concern.
- Generated or third-party component trees should not drive application style choices.
- Ziggy route names are used from React with `route(...)`.
