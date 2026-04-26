# Community Seeding

`php artisan db:seed` creates two community data sets.

`CommunityFeedSeeder` keeps the newer Meira collaboration examples as
deterministic public projects. They use stable share tokens and no longer add
random filler posts.

`LegacyCommunityMockProjectSeeder` recreates the old mock feed cards as real
projects with posts, members, images, tasks, notes, pins, docs, and seeded view
records.

## Legacy Projects

- `5ª SAJIC` -> public, `/p/legacy-sajic-2025`
- `4ª SAJIC` -> public, `/p/legacy-sajic-2024`
- `Coisa Imóveis` -> public, `/p/legacy-coisa-imoveis`
- `MEIRA` -> public, `/p/legacy-meira`
- `Portfólio Acadêmico` -> public, `/p/legacy-portfolio-academico`
- `Demo Imobiliária` -> link-only, `/p/legacy-demo-imobiliaria`

The link-only project is intentionally hidden from `/community` while remaining
available by direct URL. Seeded `project_views` rows match each project's
`public_views_count`, so the views UI has data immediately.
