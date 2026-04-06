# Playwright E2E

## Run

```bash
npx playwright install chromium   # once per machine
npm run test:e2e
```

The config runs **`npm run build`** and **`next start -p 3100`** so tests do not conflict with a separate `next dev` on port 3000 (Next only allows one dev server per project directory). The first run is slower (~15s+ for the build).

Screenshots are written to `test-results/about-full.png` (gitignored).

## Dummy author name for `/about`

The About page loads the first profile with `role = 'author'`. To set the displayed name to **Dummy User**, run `e2e/seed-dummy-author.sql` in the Supabase SQL editor (see file header).
