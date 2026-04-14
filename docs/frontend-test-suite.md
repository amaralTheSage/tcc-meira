# Frontend Test Suite

The frontend suite uses two layers:

- Vitest covers React components, hooks, browser API shims, and Inertia/Echo interactions in jsdom.
- Pest 4 browser testing covers authenticated Inertia workflows in a real Playwright browser.

Dusk is intentionally not used. Pest browser tests run through the Laravel test case and `RefreshDatabase`, so they share the same factories, auth helpers, and testing database behavior as feature tests without a separate `dusk_pgsql` connection or ChromeDriver scaffold.

## Commands

- `npm run test`: run Vitest once.
- `npm run test:watch`: run Vitest in watch mode.
- `npm run test:coverage`: run Vitest with V8 coverage.
- `composer test:browser`: build Vite assets, then run `vendor/bin/pest tests/Browser`.
- `php artisan test`: run the backend Pest/PHPUnit suite.

## Browser Setup

Playwright browsers are installed with:

```bash
npx playwright install
```

If Playwright reports missing Linux runtime libraries, install the OS packages it lists before running browser tests.

## Selectors

Use `data-testid` for stable frontend test selectors. Testing Library reads them directly, and Pest browser tests can target them with `@selector-name`.

Examples:

- `data-testid="home-new-project-trigger"`
- `data-testid="kanban-add-column"`
- `data-testid="team-chat-input"`

Avoid selecting by Tailwind classes or visual text when the text is incidental to layout rather than behavior.

## Test Support

Vitest support lives in `resources/js/test`:

- `setup.ts` installs jsdom shims and module mocks.
- `inertia.ts` owns Inertia router, form, page, and route mocks.
- `echo.ts` owns Echo listener mocks.
- `factories.ts` builds typed frontend fixtures.

Pest browser support lives in:

- `tests/BrowserTestCase.php`, which keeps real Vite assets enabled.
- `tests/Browser`, which contains workflow tests using Laravel factories and `actingAs()`.
