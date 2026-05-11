# Local Development

## Dev Stack

- `composer run dev` starts Laravel on `127.0.0.1:8000`, Reverb on
  `127.0.0.1:8050`, and Vite on `127.0.0.1:5173`.
- `scripts/dev/preflight.mjs` runs before the stack starts and blocks duplicate
  dev servers on those ports.
- The preflight removes stale `public/hot` only when no Vite process is running.

## Vite Hot Mode

- Laravel uses `public/hot` to decide whether `@vite` should load the Vite dev
  server or the compiled `public/build` manifest.
- If Vite is running but `public/hot` is missing, Laravel serves stale build
  assets and frontend changes can look reverted.
- `composer run dev:health` verifies the hot file, Vite client endpoint, and
  Laravel hot-mode status.
- Recovery is to kill the listed stale PIDs, restart `composer run dev`, then run
  `composer run dev:health`.

## Traceboard Browser Playground

- Seed deterministic realtime data with
  `php artisan db:seed --class=TraceboardRealtimePlaywrightSeeder`.
- The playground project id is `019f0000-0000-7000-8000-000000000001`.
- Seeded users are `traceboard-owner@meira.test`,
  `traceboard-alice@meira.test`, and `traceboard-bob@meira.test`.
- For Playwright CLI sessions, start a browser-safe server with
  `APP_ENV=testing php artisan serve --host=127.0.0.1 --port=8010`; this keeps
  WorkOS validation bypassed like the Pest browser test environment.
- Generate browser storage state with the `meira-development` skill auth helper,
  then open `http://127.0.0.1:8010/{project}/traceboard` in isolated
  Playwright CLI sessions.
