# Quality Boundaries

## Required Commands

- Backend tests: `php artisan test`.
- Frontend types: `npm run types`.
- Frontend lint: `npx eslint .` or `npm run lint`.
- PHP formatting: `composer run lint`.
- Build check: `npm run build`.

## Refactor Scope

- Application code is expected to stay under 500 lines per file.
- Generated or vendor-like UI code is documented instead of reshaped.
- Product bugs found during structure work are recorded in `ISSUES.md`.
- Behavior changes should be limited to quality fixes needed for types, routes, tests, or lint.

## Generated UI Exceptions

- `components/ui/**` and `resources/js/components/ui/**` contain shadcn-style primitives.
- `resources/js/components/ui/shadcn-io/**` is external UI code.
- `resources/js/components/doc-maker/code-block/**` is treated as generated code.
- ESLint ignores generated/vendor-like component trees listed above.
