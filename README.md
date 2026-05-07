# Super Mario — Modernized

A 2D platform game built with Phaser 3 + TypeScript + Vite, with an Express + Drizzle + Postgres backend serving anonymous high-score leaderboards. Originally a 2021 vanilla-JS canvas project; rewritten in 2026.

Three levels: Forest (zombies), Desert (cowgirls), Graveyard (ninjas + fire). Per-level top-10 leaderboards.

## Run locally

Prereqs: Node ≥ 20, Docker (or OrbStack), `ffmpeg`.

```bash
cp .env.example .env
docker-compose up -d         # Postgres on host port 5433 (5432 left for any local pg you have)
npm install
# audio source files are git-ignored; restore them with the legacy clone if you need to re-run the script:
#   npx tsx scripts/normalize-audio.ts
npm run db:migrate
npm run dev                  # client http://localhost:5173, api http://localhost:3000
```

## Build & run prod

```bash
npm run build
npm start                    # http://localhost:3000
```

## Tests

```bash
npm test                     # vitest unit + integration (16 tests)
npm run test:e2e             # Playwright smoke (boots prod build, asserts canvas + API)
npm run typecheck            # tsc --noEmit on client + server projects
```

## Architecture

Single Node.js service (Express + TypeScript) serves the Vite-built Phaser game from `/` and exposes `/api/scores` (GET top 10, POST submit) backed by Postgres via Drizzle.

- Frontend: Phaser 3.80 scenes in `src/client/scenes/` (Boot → Menu → LevelScene base + Forest/Desert/Graveyard concrete + HUD + GameOver)
- Backend: Express in `src/server/` with shared zod validation in `src/shared/score.schema.ts`
- DB: Postgres 16 with one `scores` table; migrations under `drizzle/`
- Deploy: Railway (Nixpacks); see `railway.json`

Full design: `docs/superpowers/specs/2026-05-07-super-mario-modernization-design.md`.

## Credits

Original 2021 implementation: see commits prior to the `legacy-2021` tag and the `legacy/` directory.
