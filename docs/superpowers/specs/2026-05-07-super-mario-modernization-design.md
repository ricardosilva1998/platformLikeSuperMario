# platformLikeSuperMario → Modern Phaser 3 Rewrite

**Date:** 2026-05-07
**Status:** Approved
**Author:** Ricardo Silva (with Claude Code)

## Problem statement

The repository at https://github.com/ricardosilva1998/platformLikeSuperMario is a 2021 vanilla-JavaScript canvas-based platform game (~5000 LOC across 18 .js files, three layered `<canvas>` elements, Tiled-format maps, custom mini-libs for AJAX/keyboard/sound/extend, no module system, all globals). It has no build tooling, no type system, no tests, and is not deployed.

We want to:

1. Rewrite the game on a modern stack while preserving full gameplay parity (all 3 levels, all enemies, sounds, timer).
2. Add a small persistent high-score backend.
3. Deploy it on Railway.
4. Update the **same** GitHub repository — branch `modernize`, PR into a new `main`, archive `master`.

## Goals

- **Modern stack**: TypeScript + Phaser 3 + Vite for the game; Express + Drizzle + Postgres for the API.
- **Full gameplay parity** with the 2021 build: 3 levels (Forest / Desert / Graveyard), all enemy types, bullets, fire, platforms, timer, win/lose conditions.
- **Single deployable** on Railway (one `web` service + one Postgres service).
- **Type-safe end-to-end** (shared zod schema for the score submission).
- **Preserve all original assets** — sprites, tilemaps, audio.

## Non-goals

- No gameplay changes, rebalancing, new levels, new characters, or sprite redrawing.
- No mobile / touch controls (desktop keyboard only — matches original).
- No multiplayer, no auth, no user accounts.
- No CI/CD beyond Railway's auto-deploy from `main`.
- No internationalization.

## Architecture overview

A single Node.js service (Express + TypeScript) that:

- Serves the Vite-built Phaser game from `/` (static)
- Exposes `/api/scores` (GET top 10, POST submit) backed by Postgres via Drizzle
- Postgres provided by Railway as a separate service, accessed via `DATABASE_URL`

```
Browser ──HTTP──▶ Express :PORT
                    │
        ┌───────────┴────────────┐
        ▼                        ▼
   serves /dist/client       /api/scores
   (Phaser game)              │
                              ▼
                         Drizzle ORM ──▶ Postgres (Railway)
```

**Why one service?** Smallest moving pieces. No CORS. One deploy, one URL, one env. The frontend redeploying on backend changes is acceptable at this scale.

## Repo layout

Monorepo, single `package.json`. TypeScript project references separate client and server compilation.

```
super-mario/
├─ src/
│  ├─ client/                 # Phaser game source (TS)
│  │  ├─ main.ts              # Phaser.Game bootstrap
│  │  ├─ scenes/
│  │  │  ├─ BootScene.ts      # asset preload, splash
│  │  │  ├─ MenuScene.ts      # main menu, level select
│  │  │  ├─ LevelScene.ts     # base scene shared by 3 levels
│  │  │  ├─ ForestScene.ts    # extends LevelScene
│  │  │  ├─ DesertScene.ts    # extends LevelScene
│  │  │  ├─ GraveyardScene.ts # extends LevelScene
│  │  │  ├─ HUDScene.ts       # timer, lives, score (UI overlay)
│  │  │  └─ GameOverScene.ts  # win/lose, score submit form
│  │  ├─ entities/
│  │  │  ├─ Hero.ts
│  │  │  ├─ enemies/{Zombie,CowGirl,Ninja}.ts
│  │  │  ├─ Bullet.ts         # replaces BalaEsq/Drt
│  │  │  └─ Fire.ts           # replaces Fogo
│  │  ├─ systems/
│  │  │  ├─ input.ts          # keyboard map (single source)
│  │  │  └─ audio.ts          # sound manager wrapper
│  │  └─ types.ts
│  ├─ server/                 # Express API (TS)
│  │  ├─ index.ts             # bootstrap, mounts routes + static
│  │  ├─ routes/scores.ts     # GET /api/scores, POST /api/scores
│  │  ├─ db/
│  │  │  ├─ client.ts         # drizzle + pg pool
│  │  │  └─ schema.ts         # scores table
│  │  └─ env.ts               # zod-validated env
│  └─ shared/
│     └─ score.schema.ts      # zod ScoreSubmission shared FE/BE
├─ public/
│  ├─ assets/
│  │  ├─ sprites/             # migrated PNG sheets
│  │  ├─ tilemaps/            # ForestMap.json, DesertMap.json, GraveyardMap.json
│  │  ├─ tilesets/            # *TileSheet.png
│  │  └─ audio/               # migrated sounds (formats normalized to .mp3 + .ogg)
│  └─ favicon.svg
├─ drizzle/                   # generated migrations
├─ drizzle.config.ts
├─ vite.config.ts             # builds client → /dist/client
├─ tsconfig.json              # base config
├─ tsconfig.client.json       # client-specific (DOM, ESNext)
├─ tsconfig.server.json       # server-specific (Node, CommonJS)
├─ package.json
├─ railway.json               # Railway build config (or rely on Nixpacks defaults)
├─ docker-compose.yml         # local Postgres for dev
├─ .env.example
└─ README.md
```

## Frontend architecture (Phaser 3)

- **Phaser ^3.80**, scene-based, `Phaser.Physics.Arcade` (replaces hand-rolled AABB collisions in the original `Entity.js` / `Plataforma.js`).
- **Tiled maps reused as-is**: Phaser's `make.tilemap({ key })` consumes the existing JSON exports directly. PNG tilesheets reused.
- **`LevelScene` (base class)**: one shared implementation of tilemap load, hero spawn, platform layer collision, win/lose conditions, HUD launch. Each concrete level (`ForestScene`, `DesertScene`, `GraveyardScene`) only declares: tilemap key, enemy spawn config, music key, level id.
- **Texture atlases**: existing per-character PNG sprite sheets repackaged into Phaser texture atlases using a `npm run pack-sprites` build step (`free-tex-packer-cli`). Smaller download, fewer requests.
- **Audio**: original WAV/MP3/FLAC normalized to `.mp3 + .ogg` (broad browser compatibility) by a one-time `scripts/normalize-audio.ts` using `ffmpeg`. Original files preserved under `public/assets/audio/source/` for reference.
- **Input**: keyboard via `scene.input.keyboard.createCursorKeys()` plus WASD bindings (jump on Space, shoot on Z).
- **Camera**: `scene.cameras.main.startFollow(hero)` (replaces custom `Camera.js`).
- **Score flow**: on level-complete, `GameOverScene` shows time + score, prompts for a 3-letter arcade-style name, POSTs to `/api/scores`, then displays the top 10 for that level.

## Backend architecture (Express + Drizzle + Postgres)

### Schema

```sql
CREATE TABLE scores (
  id           SERIAL PRIMARY KEY,
  player_name  VARCHAR(16) NOT NULL,
  level        VARCHAR(16) NOT NULL,   -- 'forest' | 'desert' | 'graveyard'
  time_ms      INTEGER     NOT NULL,
  score        INTEGER     NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX scores_level_score_idx ON scores (level, score DESC);
```

Single table — KISS. The `level` column accepts a discriminated set of literal strings, validated server-side via zod.

### Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET`  | `/api/scores?level=forest&limit=10` | Top scores. `level` is optional — omit it for a global top across all levels merged. Default `limit=10`, max `limit=50`. |
| `POST` | `/api/scores` | Body `{ playerName, level, timeMs, score }`, validated with shared zod schema. Inserts a row. |
| `GET`  | `/api/health` | `{ ok: true }` for Railway health checks. |

### Validation & abuse mitigation

- Shared zod schema in `src/shared/score.schema.ts`. Frontend uses it to validate before submit; backend uses it as request middleware.
- `playerName`: regex `/^[A-Z0-9]{1,16}$/`, server-side uppercase.
- `level`: literal union — `'forest' | 'desert' | 'graveyard'`.
- `timeMs` and `score`: integers within sanity-check bounds (e.g. `0 <= timeMs <= 60*60*1000`, `0 <= score <= 1_000_000`).
- Per-IP rate limit on POST: 10/min via `express-rate-limit`.
- No auth — anonymous submissions are fine for an arcade leaderboard. Cheating is not a concern for a single-player game.

### ORM choice

**Drizzle** (over Prisma / raw `pg`):

- Type-safe, lightweight, no codegen step needed at runtime.
- Migrations via `drizzle-kit generate` + `drizzle-kit migrate`.
- Better DX for a small schema; Prisma's heavier engine is overkill here.
- `pg` connection pool underneath (one shared pool).

## Deployment (Railway)

**One Railway project** with two services:

1. `web` — this repo. Public, Railway-generated domain.
2. `postgres` — Railway's managed Postgres plugin.

**Configuration**

- **Build**: Nixpacks default detection. `npm ci && npm run build`. The `build` npm script runs `vite build` (client → `/dist/client`) then `tsc -p tsconfig.server.json` (server → `/dist/server`).
- **Start**: `node dist/server/index.js`. Server listens on `process.env.PORT` (Railway-provided).
- **Migrations**: applied at boot (not at build time), via `drizzle-kit migrate` invoked by the server before the listen call. Idempotent.
- **Env vars on `web`**:
  - `DATABASE_URL` — auto-injected by Railway via service reference (`${{Postgres.DATABASE_URL}}`)
  - `NODE_ENV=production`
- **Health check**: `/api/health` for Railway's health probe.

## Migration & rewrite plan (high level)

The work happens on the `modernize` branch off `master`.

1. Scaffold new structure (preserve old code in git history)
2. Move and normalize assets into `public/assets/` (audio format conversion)
3. Frontend skeleton — BootScene, MenuScene, ForestScene playable with Hero only
4. Port enemies + bullets/fire to Phaser
5. Add Desert + Graveyard scenes (extend LevelScene)
6. HUD + GameOver + score submission flow
7. Backend — Express + zod + Drizzle + Postgres locally via docker-compose
8. Polish — audio, win/lose, restart, level select
9. Provision Railway (Postgres + web), deploy, smoke-test
10. Open PR `modernize → main`. After merge, rename default branch from `master` to `main`, archive old code by tagging `legacy-2021`.

The implementation plan (next document) breaks each of these into concrete reviewable steps.

## Testing strategy

- **Unit (vitest)**:
  - Backend score validation (zod schema, name normalization, bounds).
  - Backend route handlers via supertest against an in-memory Drizzle setup or testcontainers Postgres.
- **Type checks**: `tsc --noEmit` for both client and server in CI.
- **Smoke (Playwright)**: a single test that boots the game in headless Chromium, asserts the canvas renders past the splash, hits the menu, and confirms the leaderboard endpoint responds. Not full gameplay E2E — Phaser canvas is too brittle to assert against pixel-by-pixel.

## Risks & mitigations

| Risk | Mitigation |
|------|------------|
| Tiled JSON format incompatibility with Phaser version | Tested early in step 3; Phaser 3.80+ supports current Tiled exports. Convert if needed. |
| Original audio formats (FLAC) unsupported in Safari | Normalize to `.mp3 + .ogg` in step 2. |
| Original physics behaviour subtly different from Arcade physics | Tune gravity / drag / jump impulse to match feel during step 3. Acceptable to differ slightly. |
| Repo size (397MB) makes clones slow | Don't migrate the old `lib/` and old `.js` files to the new tree — keep them only in legacy branch tag. New branch ships only what's used. |
| Railway free-tier cold starts | Acceptable for a portfolio game. Add a tiny `/api/health` so Railway can keep it warm if upgraded. |

## Open questions

None at the time of writing. All decisions captured above.

## References

- Original repo: https://github.com/ricardosilva1998/platformLikeSuperMario
- Phaser 3 docs: https://newdocs.phaser.io/docs/3.80
- Drizzle: https://orm.drizzle.team
- Railway: https://docs.railway.app
