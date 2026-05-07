# Super Mario Modernization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate the 2021 vanilla-JS canvas platformer at `ricardosilva1998/platformLikeSuperMario` to a modern Phaser 3 + TypeScript + Vite frontend with an Express + Drizzle + Postgres backend, and deploy on Railway.

**Architecture:** Single Node.js service serves the Vite-built Phaser game from `/` and exposes `/api/scores` (GET top 10, POST submit) backed by Postgres via Drizzle. Per-level leaderboards. Anonymous, name-only score submissions. No auth.

**Tech Stack:** Phaser 3.80, TypeScript 5, Vite 5, Express 4, Drizzle ORM, Postgres 16, zod, vitest, Playwright, Railway (Nixpacks), Docker Compose for local dev.

**Reference:** see `docs/superpowers/specs/2026-05-07-super-mario-modernization-design.md` for full design rationale.

**Deferred from spec:** Texture atlas packing via `free-tex-packer-cli` (a perf optimization, not parity-critical). The plan loads PNG sprite sheets directly. Atlas packing can be added in a follow-up after the rewrite ships.

---

## File structure (created by this plan)

```
super-mario/
├── src/
│   ├── client/
│   │   ├── main.ts                    # T14 — Phaser.Game bootstrap
│   │   ├── scenes/
│   │   │   ├── BootScene.ts           # T15 — preload assets
│   │   │   ├── MenuScene.ts           # T16 — title + level select
│   │   │   ├── LevelScene.ts          # T17 — base class for level scenes
│   │   │   ├── ForestScene.ts         # T20 — Forest level
│   │   │   ├── DesertScene.ts         # T26 — Desert level
│   │   │   ├── GraveyardScene.ts      # T27 — Graveyard level
│   │   │   ├── HUDScene.ts            # T24 — timer + lives + score
│   │   │   └── GameOverScene.ts       # T25 — win/lose, score submit
│   │   ├── entities/
│   │   │   ├── Hero.ts                # T18, T19 — player
│   │   │   ├── Bullet.ts              # T19
│   │   │   ├── Fire.ts                # T27
│   │   │   └── enemies/
│   │   │       ├── Zombie.ts          # T21
│   │   │       ├── CowGirl.ts         # T26
│   │   │       └── Ninja.ts           # T27
│   │   ├── systems/
│   │   │   ├── input.ts               # T18 — keyboard map
│   │   │   ├── audio.ts               # T28 — sound manager
│   │   │   └── api.ts                 # T25 — typed fetch client
│   │   └── types.ts                   # T14 — shared client types
│   ├── server/
│   │   ├── index.ts                   # T4, T11 — Express bootstrap
│   │   ├── app.ts                     # T8 — Express app factory
│   │   ├── routes/
│   │   │   └── scores.ts              # T8, T9 — score endpoints
│   │   ├── db/
│   │   │   ├── client.ts              # T6 — drizzle + pg pool
│   │   │   └── schema.ts              # T6 — scores table
│   │   └── env.ts                     # T4 — zod-validated env
│   └── shared/
│       └── score.schema.ts            # T7 — shared zod schema
├── public/
│   ├── index.html                     # T3
│   └── assets/
│       ├── sprites/                   # T12
│       ├── tilemaps/                  # T12
│       ├── tilesets/                  # T12
│       └── audio/                     # T13
├── tests/
│   ├── server/
│   │   ├── score.schema.test.ts       # T7
│   │   └── scores.test.ts             # T8, T9, T10
│   └── e2e/
│       └── smoke.spec.ts              # T31
├── scripts/
│   └── normalize-audio.ts             # T13
├── drizzle/                           # T6 — generated migrations
├── drizzle.config.ts                  # T6
├── docker-compose.yml                 # T5
├── vite.config.ts                     # T3
├── vitest.config.ts                   # T7
├── playwright.config.ts               # T31
├── tsconfig.json                      # T2
├── tsconfig.client.json               # T2
├── tsconfig.server.json               # T2
├── package.json                       # T1
├── railway.json                       # T33
├── .env.example                       # T4
├── .gitignore                         # T1
└── README.md                          # T32 — replaces 2-line legacy
```

---

## Phase 1 — Foundation

### Task 1: Initialize project tree

**Files:**
- Create: `package.json`
- Create: `.gitignore`
- Move: legacy `*.js`, `Game.html`, `lib/`, `data/`, `sounds/` → `legacy/`

- [ ] **Step 1: Move legacy files to `legacy/` so they don't pollute the new tree but stay in git history**

```bash
mkdir -p legacy
git mv *.js legacy/
git mv Game.html legacy/
git mv lib data sounds legacy/
ls
```

Expected: only `legacy/`, `docs/`, `README.md` remain at root.

- [ ] **Step 2: Create `.gitignore`**

```gitignore
node_modules/
dist/
.env
.env.*.local
*.log
.DS_Store
playwright-report/
test-results/
```

- [ ] **Step 3: Create initial `package.json`**

```json
{
  "name": "super-mario",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "concurrently -n web,api \"vite\" \"tsx watch src/server/index.ts\"",
    "build": "vite build && tsc -p tsconfig.server.json",
    "start": "node dist/server/index.js",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test",
    "typecheck": "tsc --noEmit -p tsconfig.client.json && tsc --noEmit -p tsconfig.server.json",
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
    "db:studio": "drizzle-kit studio"
  },
  "dependencies": {
    "drizzle-orm": "^0.33.0",
    "express": "^4.21.0",
    "express-rate-limit": "^7.4.0",
    "phaser": "^3.80.1",
    "pg": "^8.13.0",
    "zod": "^3.23.8"
  },
  "devDependencies": {
    "@playwright/test": "^1.48.0",
    "@types/express": "^5.0.0",
    "@types/node": "^22.7.0",
    "@types/pg": "^8.11.0",
    "@types/supertest": "^6.0.2",
    "concurrently": "^9.0.1",
    "drizzle-kit": "^0.24.2",
    "supertest": "^7.0.0",
    "tsx": "^4.19.1",
    "typescript": "^5.6.0",
    "vite": "^5.4.8",
    "vitest": "^2.1.0"
  }
}
```

- [ ] **Step 4: Install deps**

Run: `npm install`
Expected: `node_modules/` populated, `package-lock.json` created, no errors.

- [ ] **Step 5: Commit**

```bash
git add .gitignore package.json package-lock.json legacy/
git commit -m "chore: scaffold modern project structure, archive legacy under legacy/"
```

---

### Task 2: TypeScript configs

**Files:**
- Create: `tsconfig.json`
- Create: `tsconfig.client.json`
- Create: `tsconfig.server.json`

- [ ] **Step 1: Create base `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noUncheckedIndexedAccess": true
  }
}
```

- [ ] **Step 2: Create `tsconfig.client.json`**

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "types": [],
    "noEmit": true,
    "baseUrl": ".",
    "paths": {
      "@shared/*": ["src/shared/*"]
    }
  },
  "include": ["src/client", "src/shared"]
}
```

- [ ] **Step 3: Create `tsconfig.server.json`**

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "outDir": "dist/server",
    "rootDir": "src",
    "lib": ["ES2022"],
    "types": ["node"],
    "declaration": false,
    "sourceMap": true
  },
  "include": ["src/server", "src/shared"]
}
```

- [ ] **Step 4: Verify configs parse**

Run: `npx tsc --noEmit -p tsconfig.client.json && npx tsc --noEmit -p tsconfig.server.json`
Expected: no errors (no source files yet, both configs return clean).

- [ ] **Step 5: Commit**

```bash
git add tsconfig*.json
git commit -m "chore: add TypeScript project references for client/server"
```

---

### Task 3: Vite + index.html shell

**Files:**
- Create: `vite.config.ts`
- Create: `public/index.html`

- [ ] **Step 1: Create `vite.config.ts`**

```ts
import { defineConfig } from 'vite';
import path from 'node:path';

export default defineConfig({
  root: 'public',
  publicDir: 'assets',
  build: {
    outDir: '../dist/client',
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, 'src/shared'),
    },
  },
});
```

- [ ] **Step 2: Create `public/index.html`**

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Super Mario — Modernized</title>
    <style>
      html, body { margin: 0; padding: 0; background: #1b1b1b; height: 100%; }
      body { display: flex; align-items: center; justify-content: center; }
      #game { box-shadow: 0 0 20px rgba(0,0,0,0.5); }
    </style>
  </head>
  <body>
    <div id="game"></div>
    <script type="module" src="/../src/client/main.ts"></script>
  </body>
</html>
```

Note: Vite's `root` is `public/`, so `/../src/client/main.ts` reaches up to project root. Confirmed working with Vite ≥ 5.

- [ ] **Step 3: Commit**

```bash
git add vite.config.ts public/index.html
git commit -m "chore: add Vite config and HTML shell"
```

---

### Task 4: Express server skeleton + env

**Files:**
- Create: `src/server/env.ts`
- Create: `src/server/index.ts`
- Create: `.env.example`

- [ ] **Step 1: Create `.env.example`**

```
NODE_ENV=development
PORT=3000
DATABASE_URL=postgres://postgres:postgres@localhost:5432/supermario
```

- [ ] **Step 2: Create `src/server/env.ts`**

```ts
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().url(),
});

export const env = envSchema.parse(process.env);
export type Env = typeof env;
```

- [ ] **Step 3: Create `src/server/index.ts`** (temporary version; T8 splits app/index, T11 adds migrations)

```ts
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { env } from './env.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
app.use(express.json({ limit: '10kb' }));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

if (env.NODE_ENV === 'production') {
  const clientDist = path.resolve(__dirname, '../client');
  app.use(express.static(clientDist));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

app.listen(env.PORT, () => {
  console.log(`server listening on :${env.PORT} (${env.NODE_ENV})`);
});
```

- [ ] **Step 4: Verify it starts**

```bash
cp .env.example .env
npx tsx src/server/index.ts
```

In another terminal:

```bash
curl http://localhost:3000/api/health
```

Expected: `{"ok":true}`. Kill the server.

- [ ] **Step 5: Commit**

```bash
git add src/server/env.ts src/server/index.ts .env.example
git commit -m "feat(server): Express skeleton with /api/health and zod-validated env"
```

---

### Task 5: Local Postgres via docker-compose

**Files:**
- Create: `docker-compose.yml`

- [ ] **Step 1: Create `docker-compose.yml`**

```yaml
services:
  postgres:
    image: postgres:16-alpine
    restart: unless-stopped
    ports:
      - "5432:5432"
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: supermario
    volumes:
      - pgdata:/var/lib/postgresql/data

volumes:
  pgdata:
```

- [ ] **Step 2: Start Postgres and verify**

```bash
docker compose up -d
docker compose ps
docker compose exec postgres psql -U postgres -d supermario -c 'SELECT 1;'
```

Expected: container `Up`; psql returns `1`.

- [ ] **Step 3: Commit**

```bash
git add docker-compose.yml
git commit -m "chore: docker-compose for local Postgres"
```

---

### Task 6: Drizzle schema + client + config

**Files:**
- Create: `src/server/db/schema.ts`
- Create: `src/server/db/client.ts`
- Create: `drizzle.config.ts`

- [ ] **Step 1: Create `src/server/db/schema.ts`**

```ts
import { pgTable, serial, varchar, integer, timestamp, index } from 'drizzle-orm/pg-core';

export const scores = pgTable(
  'scores',
  {
    id: serial('id').primaryKey(),
    playerName: varchar('player_name', { length: 16 }).notNull(),
    level: varchar('level', { length: 16 }).notNull(),
    timeMs: integer('time_ms').notNull(),
    score: integer('score').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    levelScoreIdx: index('scores_level_score_idx').on(t.level, t.score),
  }),
);

export type Score = typeof scores.$inferSelect;
export type NewScore = typeof scores.$inferInsert;
```

- [ ] **Step 2: Create `src/server/db/client.ts`**

```ts
import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import { env } from '../env.js';
import * as schema from './schema.js';

export const pool = new pg.Pool({ connectionString: env.DATABASE_URL });
export const db = drizzle(pool, { schema });
export type DB = typeof db;
```

- [ ] **Step 3: Create `drizzle.config.ts`**

```ts
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/server/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? 'postgres://postgres:postgres@localhost:5432/supermario',
  },
});
```

- [ ] **Step 4: Generate the initial migration**

```bash
npm run db:generate
```

Expected: `drizzle/0000_<random_name>.sql` containing `CREATE TABLE scores …`.

- [ ] **Step 5: Apply migration to local Postgres**

```bash
npm run db:migrate
docker compose exec postgres psql -U postgres -d supermario -c '\d scores'
```

Expected: table description with `id`, `player_name`, `level`, `time_ms`, `score`, `created_at` columns.

- [ ] **Step 6: Commit**

```bash
git add src/server/db/ drizzle.config.ts drizzle/
git commit -m "feat(db): drizzle schema for scores + initial migration"
```

---

### Task 7: Shared score zod schema + first test

**Files:**
- Create: `src/shared/score.schema.ts`
- Create: `tests/server/score.schema.test.ts`
- Create: `vitest.config.ts`

- [ ] **Step 1: Create `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    exclude: ['tests/e2e/**'],
  },
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, 'src/shared'),
    },
  },
});
```

- [ ] **Step 2: Create the failing test `tests/server/score.schema.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { ScoreSubmissionSchema, LevelEnum } from '@shared/score.schema';

describe('ScoreSubmissionSchema', () => {
  it('accepts a valid submission', () => {
    const ok = ScoreSubmissionSchema.parse({
      playerName: 'RIK',
      level: 'forest',
      timeMs: 12345,
      score: 100,
    });
    expect(ok.playerName).toBe('RIK');
  });

  it('uppercases playerName', () => {
    const ok = ScoreSubmissionSchema.parse({
      playerName: 'rik',
      level: 'forest',
      timeMs: 100,
      score: 1,
    });
    expect(ok.playerName).toBe('RIK');
  });

  it('rejects invalid level', () => {
    expect(() =>
      ScoreSubmissionSchema.parse({ playerName: 'A', level: 'volcano', timeMs: 1, score: 1 }),
    ).toThrow();
  });

  it('rejects out-of-bounds timeMs', () => {
    expect(() =>
      ScoreSubmissionSchema.parse({
        playerName: 'A',
        level: 'forest',
        timeMs: 60 * 60 * 1000 + 1,
        score: 1,
      }),
    ).toThrow();
  });

  it('rejects non-alphanumeric playerName', () => {
    expect(() =>
      ScoreSubmissionSchema.parse({ playerName: 'r!k', level: 'forest', timeMs: 1, score: 1 }),
    ).toThrow();
  });

  it('exposes LevelEnum values', () => {
    expect(LevelEnum.options).toEqual(['forest', 'desert', 'graveyard']);
  });
});
```

- [ ] **Step 3: Run test, verify it fails**

```bash
npm test
```

Expected: FAIL — module `@shared/score.schema` not found.

- [ ] **Step 4: Create `src/shared/score.schema.ts`**

```ts
import { z } from 'zod';

export const LevelEnum = z.enum(['forest', 'desert', 'graveyard']);
export type Level = z.infer<typeof LevelEnum>;

export const ScoreSubmissionSchema = z.object({
  playerName: z
    .string()
    .regex(/^[A-Za-z0-9]{1,16}$/, 'playerName must be 1-16 alphanumeric')
    .transform((v) => v.toUpperCase()),
  level: LevelEnum,
  timeMs: z.number().int().min(0).max(60 * 60 * 1000),
  score: z.number().int().min(0).max(1_000_000),
});

export type ScoreSubmission = z.infer<typeof ScoreSubmissionSchema>;

export const ScoreRowSchema = ScoreSubmissionSchema.extend({
  id: z.number().int(),
  createdAt: z.string().datetime(),
});
export type ScoreRow = z.infer<typeof ScoreRowSchema>;
```

- [ ] **Step 5: Re-run test, verify pass**

```bash
npm test
```

Expected: 6 passed.

- [ ] **Step 6: Commit**

```bash
git add vitest.config.ts src/shared/ tests/server/score.schema.test.ts
git commit -m "feat(shared): score zod schema with FE/BE validation"
```

---

## Phase 2 — Backend API

### Task 8: GET /api/scores route

**Files:**
- Create: `src/server/app.ts`
- Modify: `src/server/index.ts`
- Create: `src/server/routes/scores.ts`
- Create: `tests/server/scores.test.ts`

- [ ] **Step 1: Write the failing test `tests/server/scores.test.ts`**

```ts
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/server/app.js';
import { db, pool } from '../../src/server/db/client.js';
import { scores } from '../../src/server/db/schema.js';

const app = createApp();

beforeEach(async () => {
  await db.delete(scores);
});

afterAll(async () => {
  await pool.end();
});

describe('GET /api/scores', () => {
  it('returns empty array when no scores exist', async () => {
    const res = await request(app).get('/api/scores');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('returns top scores ordered by score DESC', async () => {
    await db.insert(scores).values([
      { playerName: 'AAA', level: 'forest', timeMs: 1000, score: 10 },
      { playerName: 'BBB', level: 'forest', timeMs: 2000, score: 50 },
      { playerName: 'CCC', level: 'forest', timeMs: 1500, score: 30 },
    ]);
    const res = await request(app).get('/api/scores?level=forest');
    expect(res.status).toBe(200);
    expect(res.body.map((r: { playerName: string }) => r.playerName)).toEqual(['BBB', 'CCC', 'AAA']);
  });

  it('filters by level when provided', async () => {
    await db.insert(scores).values([
      { playerName: 'AAA', level: 'forest', timeMs: 1, score: 10 },
      { playerName: 'BBB', level: 'desert', timeMs: 1, score: 100 },
    ]);
    const res = await request(app).get('/api/scores?level=forest');
    expect(res.body).toHaveLength(1);
    expect(res.body[0].playerName).toBe('AAA');
  });

  it('returns global top across levels when no level filter', async () => {
    await db.insert(scores).values([
      { playerName: 'AAA', level: 'forest', timeMs: 1, score: 10 },
      { playerName: 'BBB', level: 'desert', timeMs: 1, score: 100 },
    ]);
    const res = await request(app).get('/api/scores');
    expect(res.body).toHaveLength(2);
    expect(res.body[0].playerName).toBe('BBB');
  });

  it('caps limit at 50', async () => {
    const res = await request(app).get('/api/scores?limit=999');
    expect(res.status).toBe(400);
  });

  it('rejects invalid level', async () => {
    const res = await request(app).get('/api/scores?level=volcano');
    expect(res.status).toBe(400);
  });
});
```

- [ ] **Step 2: Create `src/server/app.ts` (factor out from index)**

```ts
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { env } from './env.js';
import { scoresRouter } from './routes/scores.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function createApp() {
  const app = express();
  app.use(express.json({ limit: '10kb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
  });

  app.use('/api/scores', scoresRouter);

  if (env.NODE_ENV === 'production') {
    const clientDist = path.resolve(__dirname, '../client');
    app.use(express.static(clientDist));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(clientDist, 'index.html'));
    });
  }

  return app;
}
```

- [ ] **Step 3: Replace `src/server/index.ts`**

```ts
import { createApp } from './app.js';
import { env } from './env.js';

const app = createApp();
app.listen(env.PORT, () => {
  console.log(`server listening on :${env.PORT} (${env.NODE_ENV})`);
});
```

- [ ] **Step 4: Create `src/server/routes/scores.ts` with GET only**

```ts
import { Router } from 'express';
import { z } from 'zod';
import { desc, eq } from 'drizzle-orm';
import { db } from '../db/client.js';
import { scores } from '../db/schema.js';
import { LevelEnum } from '../../shared/score.schema.js';

export const scoresRouter = Router();

const ListQuerySchema = z.object({
  level: LevelEnum.optional(),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

scoresRouter.get('/', async (req, res, next) => {
  try {
    const parsed = ListQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }
    const { level, limit } = parsed.data;

    const rows = await db.query.scores.findMany({
      where: level ? eq(scores.level, level) : undefined,
      orderBy: [desc(scores.score)],
      limit,
    });

    res.json(rows);
  } catch (err) {
    next(err);
  }
});
```

- [ ] **Step 5: Run tests, verify they pass against local Postgres**

```bash
docker compose up -d
DATABASE_URL=postgres://postgres:postgres@localhost:5432/supermario npm test
```

Expected: 6 schema + 6 GET = 12 passed.

- [ ] **Step 6: Commit**

```bash
git add src/server/app.ts src/server/index.ts src/server/routes/ tests/server/scores.test.ts
git commit -m "feat(api): GET /api/scores with optional level filter"
```

---

### Task 9: POST /api/scores route

**Files:**
- Modify: `src/server/routes/scores.ts`
- Modify: `tests/server/scores.test.ts`

- [ ] **Step 1: Add failing tests at the bottom of `tests/server/scores.test.ts`**

```ts
describe('POST /api/scores', () => {
  it('inserts a valid score and returns the row', async () => {
    const res = await request(app)
      .post('/api/scores')
      .send({ playerName: 'rik', level: 'forest', timeMs: 12345, score: 99 });
    expect(res.status).toBe(201);
    expect(res.body.playerName).toBe('RIK');
    expect(res.body.id).toBeTypeOf('number');
  });

  it('rejects invalid body with 400', async () => {
    const res = await request(app)
      .post('/api/scores')
      .send({ playerName: 'rik', level: 'volcano', timeMs: 1, score: 1 });
    expect(res.status).toBe(400);
  });

  it('strips unknown fields silently', async () => {
    const res = await request(app)
      .post('/api/scores')
      .send({ playerName: 'rik', level: 'forest', timeMs: 1, score: 1, ghost: true });
    expect(res.status).toBe(201);
    expect(res.body.ghost).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run tests, verify they fail**

```bash
npm test
```

Expected: 3 new POST tests fail with 404 (route not defined yet).

- [ ] **Step 3: Add POST handler to `src/server/routes/scores.ts`**

Add to imports at top:

```ts
import { ScoreSubmissionSchema } from '../../shared/score.schema.js';
```

Append at end of file:

```ts
scoresRouter.post('/', async (req, res, next) => {
  try {
    const parsed = ScoreSubmissionSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }
    const [row] = await db.insert(scores).values(parsed.data).returning();
    res.status(201).json(row);
  } catch (err) {
    next(err);
  }
});
```

- [ ] **Step 4: Run tests, verify all pass**

```bash
npm test
```

Expected: 15 passed (6 schema + 6 GET + 3 POST).

- [ ] **Step 5: Commit**

```bash
git add src/server/routes/scores.ts tests/server/scores.test.ts
git commit -m "feat(api): POST /api/scores with shared zod validation"
```

---

### Task 10: Per-IP rate limiter on POST

**Files:**
- Modify: `src/server/routes/scores.ts`
- Modify: `tests/server/scores.test.ts`

- [ ] **Step 1: Add failing test for rate limiting**

Append to `tests/server/scores.test.ts`:

```ts
describe('POST /api/scores rate limit', () => {
  it('rate-limits after 10 requests in a minute', async () => {
    const body = { playerName: 'A', level: 'forest', timeMs: 1, score: 1 };
    for (let i = 0; i < 10; i++) {
      const res = await request(app).post('/api/scores').send(body);
      expect(res.status).toBe(201);
    }
    const blocked = await request(app).post('/api/scores').send(body);
    expect(blocked.status).toBe(429);
  });
});
```

- [ ] **Step 2: Run, verify failure**

```bash
npm test
```

Expected: rate-limit test fails (11th still 201).

- [ ] **Step 3: Add limiter to `src/server/routes/scores.ts`**

Add import: `import rateLimit from 'express-rate-limit';`

Add immediately above the `scoresRouter.post(...)` registration:

```ts
const postLimiter = rateLimit({
  windowMs: 60_000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
});
```

Change the post registration to:

```ts
scoresRouter.post('/', postLimiter, async (req, res, next) => {
  // existing handler body unchanged
});
```

- [ ] **Step 4: Run, verify pass**

```bash
npm test
```

Expected: 16 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/server/routes/scores.ts tests/server/scores.test.ts
git commit -m "feat(api): rate limit POST /api/scores to 10/min per IP"
```

---

### Task 11: Run migrations on server boot

**Files:**
- Modify: `src/server/index.ts`

- [ ] **Step 1: Update `src/server/index.ts` to run migrations before listen**

```ts
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { createApp } from './app.js';
import { db } from './db/client.js';
import { env } from './env.js';

async function main() {
  console.log('running migrations…');
  await migrate(db, { migrationsFolder: './drizzle' });
  console.log('migrations done');

  const app = createApp();
  app.listen(env.PORT, () => {
    console.log(`server listening on :${env.PORT} (${env.NODE_ENV})`);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

- [ ] **Step 2: Verify boot still works**

```bash
npx tsx src/server/index.ts
```

Expected:
```
running migrations…
migrations done
server listening on :3000 (development)
```

In another terminal: `curl http://localhost:3000/api/health` → `{"ok":true}`. Kill the server.

- [ ] **Step 3: Commit**

```bash
git add src/server/index.ts
git commit -m "feat(server): run drizzle migrations on boot"
```

---

## Phase 3 — Asset migration

### Task 12: Move legacy assets into public/

**Files:**
- Create: `public/assets/sprites/`, `public/assets/tilemaps/`, `public/assets/tilesets/`, `public/assets/audio/source/`

- [ ] **Step 1: Create directories**

```bash
mkdir -p public/assets/sprites public/assets/tilemaps public/assets/tilesets public/assets/audio/source
```

- [ ] **Step 2: Inspect legacy data folder**

```bash
ls legacy/data && ls legacy/sounds | head -20
```

Expected: ForestMap.json/tmx + ForestMapTileSheet.png and similar for Desert/Graveyard, plus a list of audio files.

- [ ] **Step 3: Copy tilemaps and tilesets**

```bash
cp legacy/data/*Map.json public/assets/tilemaps/
cp legacy/data/*TileSheet.png public/assets/tilesets/
```

- [ ] **Step 4: Identify and copy sprite sheets**

```bash
find legacy -name "*.png" -not -path "*/data/*"
grep -ho "[a-zA-Z0-9_]*\.png" legacy/*.js | sort -u
```

For each unique sprite png referenced from a `.js` file, locate it in the legacy tree and copy:

```bash
cp legacy/<wherever>/<name>.png public/assets/sprites/
```

If a referenced png cannot be found (some original projects depended on assets that weren't checked in), record it as a known missing asset in a `public/assets/sprites/MISSING.md` file with one line per missing path. The plan continues — sprites can be replaced with simple coloured rectangles in T20 if the originals are missing.

- [ ] **Step 5: Copy audio source files**

```bash
cp legacy/sounds/* public/assets/audio/source/
ls public/assets/audio/source/
```

Expected: WAV/MP3/FLAC files all present.

- [ ] **Step 6: Commit**

```bash
git add public/
git commit -m "chore: migrate sprites, tilemaps, tilesets, and source audio to public/assets"
```

---

### Task 13: Audio normalization script

**Files:**
- Create: `scripts/normalize-audio.ts`

- [ ] **Step 1: Verify ffmpeg is installed**

```bash
which ffmpeg || brew install ffmpeg
```

Expected: a path printed.

- [ ] **Step 2: Create `scripts/normalize-audio.ts`**

```ts
import { execSync } from 'node:child_process';
import { readdirSync, mkdirSync, existsSync } from 'node:fs';
import path from 'node:path';

const SRC = 'public/assets/audio/source';
const OUT = 'public/assets/audio';

if (!existsSync(SRC)) {
  console.error(`missing ${SRC}`);
  process.exit(1);
}

mkdirSync(OUT, { recursive: true });

for (const file of readdirSync(SRC)) {
  const ext = path.extname(file).toLowerCase();
  if (!['.wav', '.mp3', '.flac', '.ogg'].includes(ext)) continue;
  const stem = path.basename(file, ext);
  const inFile = path.join(SRC, file);
  const mp3 = path.join(OUT, `${stem}.mp3`);
  const ogg = path.join(OUT, `${stem}.ogg`);

  if (!existsSync(mp3)) {
    console.log(`-> ${mp3}`);
    execSync(`ffmpeg -y -i "${inFile}" -codec:a libmp3lame -qscale:a 4 "${mp3}"`, { stdio: 'inherit' });
  }
  if (!existsSync(ogg)) {
    console.log(`-> ${ogg}`);
    execSync(`ffmpeg -y -i "${inFile}" -codec:a libvorbis -qscale:a 4 "${ogg}"`, { stdio: 'inherit' });
  }
}

console.log('audio normalization complete');
```

- [ ] **Step 3: Run the normalize script**

```bash
npx tsx scripts/normalize-audio.ts
```

Expected: matching `.mp3` and `.ogg` for every source file in `public/assets/audio/`.

- [ ] **Step 4: Commit**

```bash
git add scripts/normalize-audio.ts public/assets/audio/
git commit -m "feat(assets): normalize audio to .mp3 + .ogg via ffmpeg script"
```

---

## Phase 4 — Frontend skeleton

### Task 14: Phaser bootstrap

**Files:**
- Create: `src/client/main.ts`
- Create: `src/client/types.ts`

- [ ] **Step 1: Create `src/client/types.ts`**

```ts
export const GAME_WIDTH = 800;
export const GAME_HEIGHT = 480;
export const GRAVITY_Y = 800;

export type LevelKey = 'forest' | 'desert' | 'graveyard';
```

- [ ] **Step 2: Create `src/client/main.ts` with a placeholder scene**

```ts
import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, GRAVITY_Y } from './types';

class HelloScene extends Phaser.Scene {
  constructor() {
    super('HelloScene');
  }
  create() {
    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'Loading…', {
        fontFamily: 'monospace',
        fontSize: '32px',
        color: '#ffffff',
      })
      .setOrigin(0.5);
  }
}

new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  pixelArt: true,
  physics: {
    default: 'arcade',
    arcade: { gravity: { x: 0, y: GRAVITY_Y }, debug: false },
  },
  scene: [HelloScene],
});
```

- [ ] **Step 3: Run dev server and verify**

```bash
npm run dev
```

Expected: Vite logs `Local: http://localhost:5173/`. Open it in a browser. Expected: dark page with white "Loading…" text in a 800×480 canvas. Kill the dev server.

- [ ] **Step 4: Commit**

```bash
git add src/client/main.ts src/client/types.ts
git commit -m "feat(client): Phaser bootstrap with placeholder scene"
```

---

### Task 15: BootScene preloads tilemaps and tilesets

**Files:**
- Create: `src/client/scenes/BootScene.ts`
- Modify: `src/client/main.ts`

- [ ] **Step 1: Create `src/client/scenes/BootScene.ts`**

```ts
import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../types';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload() {
    const w = GAME_WIDTH;
    const h = GAME_HEIGHT;

    const bg = this.add.rectangle(w / 2, h / 2, 400, 24, 0x222222);
    const bar = this.add.rectangle(w / 2 - 198, h / 2, 4, 20, 0x66ff66).setOrigin(0, 0.5);
    this.load.on('progress', (p: number) => bar.setSize(396 * p, 20));

    this.add
      .text(w / 2, h / 2 - 32, 'Super Mario — Loading', {
        fontFamily: 'monospace',
        fontSize: '20px',
        color: '#ffffff',
      })
      .setOrigin(0.5);

    // Tilemaps
    this.load.tilemapTiledJSON('forest-map', 'assets/tilemaps/ForestMap.json');
    this.load.tilemapTiledJSON('desert-map', 'assets/tilemaps/DesertMap.json');
    this.load.tilemapTiledJSON('graveyard-map', 'assets/tilemaps/GraveyardMap.json');

    // Tilesets
    this.load.image('forest-tiles', 'assets/tilesets/ForestMapTileSheet.png');
    this.load.image('desert-tiles', 'assets/tilesets/DesertMapTileSheet.png');
    this.load.image('graveyard-tiles', 'assets/tilesets/GraveyardMapTileSheet.png');

    // Sprite + audio loads added in T20, T21, T26, T27, T28 as each is needed.
  }

  create() {
    this.scene.start('MenuScene');
  }
}
```

- [ ] **Step 2: Update `src/client/main.ts`**

```ts
import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, GRAVITY_Y } from './types';
import { BootScene } from './scenes/BootScene';

new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  pixelArt: true,
  physics: {
    default: 'arcade',
    arcade: { gravity: { x: 0, y: GRAVITY_Y }, debug: false },
  },
  scene: [BootScene /* MenuScene added next task */],
});
```

- [ ] **Step 3: Verify in browser**

```bash
npm run dev
```

Expected: progress bar fills, then crashes because MenuScene doesn't exist yet — that's fine for this step. Kill dev server.

- [ ] **Step 4: Commit**

```bash
git add src/client/scenes/BootScene.ts src/client/main.ts
git commit -m "feat(client): BootScene loads tilemaps and tilesets"
```

---

### Task 16: MenuScene with level select

**Files:**
- Create: `src/client/scenes/MenuScene.ts`
- Modify: `src/client/main.ts`

- [ ] **Step 1: Create `src/client/scenes/MenuScene.ts`**

```ts
import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, type LevelKey } from '../types';

const LEVELS: { key: LevelKey; label: string; sceneKey: string }[] = [
  { key: 'forest', label: '1. Forest', sceneKey: 'ForestScene' },
  { key: 'desert', label: '2. Desert', sceneKey: 'DesertScene' },
  { key: 'graveyard', label: '3. Graveyard', sceneKey: 'GraveyardScene' },
];

export class MenuScene extends Phaser.Scene {
  constructor() {
    super('MenuScene');
  }

  create() {
    this.add
      .text(GAME_WIDTH / 2, 80, 'SUPER MARIO', {
        fontFamily: 'monospace',
        fontSize: '48px',
        color: '#ffcc00',
      })
      .setOrigin(0.5);

    this.add
      .text(GAME_WIDTH / 2, 130, '— Select a level —', {
        fontFamily: 'monospace',
        fontSize: '16px',
        color: '#aaaaaa',
      })
      .setOrigin(0.5);

    LEVELS.forEach((lv, idx) => {
      const txt = this.add
        .text(GAME_WIDTH / 2, 200 + idx * 50, lv.label, {
          fontFamily: 'monospace',
          fontSize: '24px',
          color: '#ffffff',
          backgroundColor: '#333333',
          padding: { x: 16, y: 8 },
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true });

      txt.on('pointerover', () => txt.setColor('#ffcc00'));
      txt.on('pointerout', () => txt.setColor('#ffffff'));
      txt.on('pointerdown', () => {
        this.scene.start(lv.sceneKey, { levelKey: lv.key });
      });
    });

    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT - 20, 'Arrows / WASD to move · Space jump · Z shoot', {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#888888',
      })
      .setOrigin(0.5);
  }
}
```

- [ ] **Step 2: Register MenuScene in `src/client/main.ts`**

Replace the scene array:

```ts
import { MenuScene } from './scenes/MenuScene';
// scene: [BootScene, MenuScene],
```

- [ ] **Step 3: Verify**

```bash
npm run dev
```

Expected: Boot progress bar → Menu screen with title and 3 buttons. Hovering changes color. Clicking will fail (level scenes not implemented) — fine for now. Kill dev server.

- [ ] **Step 4: Commit**

```bash
git add src/client/scenes/MenuScene.ts src/client/main.ts
git commit -m "feat(client): MenuScene with level select"
```

---

## Phase 5 — Forest level: Hero

### Task 17: LevelScene base class

**Files:**
- Create: `src/client/scenes/LevelScene.ts`

- [ ] **Step 1: Create `src/client/scenes/LevelScene.ts`**

```ts
import Phaser from 'phaser';
import { type LevelKey } from '../types';

export interface LevelConfig {
  levelKey: LevelKey;
  tilemapKey: string;
  tilesetKey: string;
  tilesetNameInTiled: string; // the name the tileset was given inside Tiled
  groundLayerName: string; // the Tiled tile layer with collidable tiles
  musicKey?: string;
}

export abstract class LevelScene extends Phaser.Scene {
  protected map!: Phaser.Tilemaps.Tilemap;
  protected groundLayer!: Phaser.Tilemaps.TilemapLayer;
  protected config!: LevelConfig;
  protected startedAt = 0;

  constructor(key: string) {
    super(key);
  }

  protected abstract getConfig(): LevelConfig;

  create() {
    this.config = this.getConfig();

    this.map = this.make.tilemap({ key: this.config.tilemapKey });
    const tileset = this.map.addTilesetImage(this.config.tilesetNameInTiled, this.config.tilesetKey);
    if (!tileset) throw new Error(`tileset ${this.config.tilesetKey} failed to load`);

    const ground = this.map.createLayer(this.config.groundLayerName, tileset, 0, 0);
    if (!ground) throw new Error(`ground layer ${this.config.groundLayerName} not found`);
    this.groundLayer = ground;
    this.groundLayer.setCollisionByExclusion([-1]);

    this.physics.world.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
    this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);

    this.scene.launch('HUDScene', { levelKey: this.config.levelKey });
    this.startedAt = this.time.now;
  }

  protected createGoalAt(x: number, y: number, w = 32, h = 64) {
    const goal = this.add.zone(x, y, w, h);
    this.physics.add.existing(goal, true);
    return goal;
  }

  protected onLevelWin() {
    const elapsed = Math.round(this.time.now - this.startedAt);
    this.scene.stop('HUDScene');
    this.scene.start('GameOverScene', {
      result: 'win',
      levelKey: this.config.levelKey,
      timeMs: elapsed,
      score: this.computeScore(elapsed),
    });
  }

  protected onHeroDeath() {
    this.scene.stop('HUDScene');
    this.scene.start('GameOverScene', { result: 'lose', levelKey: this.config.levelKey });
  }

  protected computeScore(elapsedMs: number): number {
    return Math.max(0, Math.round(100000 - (elapsedMs / 1000) * 100));
  }
}
```

Note: `tilesetNameInTiled` and `groundLayerName` come from inspecting the JSON. T20 step 1 inspects them.

- [ ] **Step 2: Commit**

```bash
git add src/client/scenes/LevelScene.ts
git commit -m "feat(client): LevelScene abstract base for tilemap-driven levels"
```

---

### Task 18: Hero entity + input system

**Files:**
- Create: `src/client/systems/input.ts`
- Create: `src/client/entities/Hero.ts`

- [ ] **Step 1: Create `src/client/systems/input.ts`**

```ts
import Phaser from 'phaser';

export type InputState = {
  left: boolean;
  right: boolean;
  jump: boolean;
  shoot: boolean;
};

export function createInput(scene: Phaser.Scene) {
  const cursors = scene.input.keyboard!.createCursorKeys();
  const keys = scene.input.keyboard!.addKeys('A,D,W,SPACE,Z') as Record<
    'A' | 'D' | 'W' | 'SPACE' | 'Z',
    Phaser.Input.Keyboard.Key
  >;

  return (): InputState => ({
    left: cursors.left?.isDown || keys.A.isDown,
    right: cursors.right?.isDown || keys.D.isDown,
    jump:
      Phaser.Input.Keyboard.JustDown(cursors.up!) ||
      Phaser.Input.Keyboard.JustDown(keys.W) ||
      Phaser.Input.Keyboard.JustDown(keys.SPACE),
    shoot: Phaser.Input.Keyboard.JustDown(keys.Z),
  });
}
```

- [ ] **Step 2: Create `src/client/entities/Hero.ts`** (without bullets — added in T19)

```ts
import Phaser from 'phaser';

const RUN_SPEED = 180;
const JUMP_VELOCITY = -380;

export class Hero extends Phaser.Physics.Arcade.Sprite {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'hero');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setCollideWorldBounds(true);
    this.setMaxVelocity(RUN_SPEED, 1000);
  }

  applyInput(state: { left: boolean; right: boolean; jump: boolean; shoot: boolean }) {
    if (state.left) {
      this.setVelocityX(-RUN_SPEED);
      this.setFlipX(true);
    } else if (state.right) {
      this.setVelocityX(RUN_SPEED);
      this.setFlipX(false);
    } else {
      this.setVelocityX(0);
    }

    if (state.jump && this.body!.blocked.down) {
      this.setVelocityY(JUMP_VELOCITY);
    }
    // shoot wired in T19
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/client/systems/input.ts src/client/entities/Hero.ts
git commit -m "feat(client): Hero entity + keyboard input system"
```

---

### Task 19: Bullet entity (hero shooting)

**Files:**
- Create: `src/client/entities/Bullet.ts`
- Modify: `src/client/entities/Hero.ts`

- [ ] **Step 1: Create `src/client/entities/Bullet.ts`**

```ts
import Phaser from 'phaser';

const BULLET_SPEED = 500;
const BULLET_LIFE_MS = 1500;

export class Bullet extends Phaser.Physics.Arcade.Sprite {
  constructor(scene: Phaser.Scene, x: number, y: number, direction: -1 | 1) {
    super(scene, x, y, 'bullet');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setVelocityX(BULLET_SPEED * direction);
    (this.body as Phaser.Physics.Arcade.Body).allowGravity = false;
    scene.time.delayedCall(BULLET_LIFE_MS, () => this.destroy());
  }
}
```

- [ ] **Step 2: Replace `src/client/entities/Hero.ts` with the bullet-aware version**

```ts
import Phaser from 'phaser';
import { Bullet } from './Bullet';

const RUN_SPEED = 180;
const JUMP_VELOCITY = -380;

export class Hero extends Phaser.Physics.Arcade.Sprite {
  public bullets: Phaser.Physics.Arcade.Group;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'hero');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setCollideWorldBounds(true);
    this.setMaxVelocity(RUN_SPEED, 1000);
    this.bullets = scene.physics.add.group({ classType: Bullet, runChildUpdate: true });
  }

  applyInput(state: { left: boolean; right: boolean; jump: boolean; shoot: boolean }) {
    if (state.left) {
      this.setVelocityX(-RUN_SPEED);
      this.setFlipX(true);
    } else if (state.right) {
      this.setVelocityX(RUN_SPEED);
      this.setFlipX(false);
    } else {
      this.setVelocityX(0);
    }

    if (state.jump && this.body!.blocked.down) {
      this.setVelocityY(JUMP_VELOCITY);
    }

    if (state.shoot) this.shoot();
  }

  shoot() {
    const dir: -1 | 1 = this.flipX ? -1 : 1;
    this.bullets.add(new Bullet(this.scene, this.x + dir * 16, this.y, dir));
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/client/entities/Bullet.ts src/client/entities/Hero.ts
git commit -m "feat(client): Bullet entity + hero shoot"
```

---

## Phase 6 — Forest level: enemies + win/lose

### Task 20: ForestScene wires Hero, tilemap, camera

**Files:**
- Create: `src/client/scenes/ForestScene.ts`
- Modify: `src/client/main.ts`
- Modify: `src/client/scenes/BootScene.ts` (add hero+bullet sprite preload)

- [ ] **Step 1: Inspect Forest tilemap to find layer + tileset names**

```bash
node -e "const m=require('./public/assets/tilemaps/ForestMap.json');console.log({tilesets:m.tilesets.map(t=>t.name),layers:m.layers.map(l=>({name:l.name,type:l.type}))});"
```

Note the `tilesets[0].name` (e.g. `ForestMapTileSheet`) and the tile-layer name (likely `Tile Layer 1` or `Ground`). Use those values in step 3.

- [ ] **Step 2: Add hero+bullet sprite loads to `BootScene.preload()`**

Append:

```ts
this.load.spritesheet('hero', 'assets/sprites/hero.png', { frameWidth: 32, frameHeight: 48 });
this.load.image('bullet', 'assets/sprites/bullet.png');
```

If migrated sprite filenames differ, update the paths to match what was copied in T12. If a sprite is missing entirely, swap the `load.spritesheet`/`load.image` for a `Phaser.GameObjects.Rectangle` placeholder created at runtime in T20 step 4.

- [ ] **Step 3: Create `src/client/scenes/ForestScene.ts`** (Hero + tilemap only — zombies wired in T21)

```ts
import Phaser from 'phaser';
import { LevelScene, type LevelConfig } from './LevelScene';
import { Hero } from '../entities/Hero';
import { createInput } from '../systems/input';

export class ForestScene extends LevelScene {
  protected hero!: Hero;
  protected inputSampler!: ReturnType<typeof createInput>;

  constructor() {
    super('ForestScene');
  }

  protected getConfig(): LevelConfig {
    return {
      levelKey: 'forest',
      tilemapKey: 'forest-map',
      tilesetKey: 'forest-tiles',
      tilesetNameInTiled: 'ForestMapTileSheet', // VERIFY against step 1 output
      groundLayerName: 'Ground', // VERIFY against step 1 output
    };
  }

  create() {
    super.create();

    this.inputSampler = createInput(this);

    this.hero = new Hero(this, 64, this.map.heightInPixels - 100);
    this.physics.add.collider(this.hero, this.groundLayer);
    this.physics.add.collider(this.hero.bullets, this.groundLayer, (b) =>
      (b as Phaser.GameObjects.GameObject).destroy(),
    );

    this.cameras.main.startFollow(this.hero, true, 0.1, 0.1);

    const goal = this.createGoalAt(this.map.widthInPixels - 64, this.map.heightInPixels - 64);
    this.physics.add.overlap(this.hero, goal, () => this.onLevelWin());
  }

  update() {
    if (!this.hero) return;
    this.hero.applyInput(this.inputSampler());
  }
}
```

Note: T21 will add a `zombies` field, spawns, and colliders to this scene.

- [ ] **Step 4: Add HUDScene + GameOverScene placeholders so the scene chain doesn't crash**

In `src/client/main.ts`, add temporary stub scenes for HUDScene and GameOverScene that we'll replace in T24/T25:

```ts
import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, GRAVITY_Y } from './types';
import { BootScene } from './scenes/BootScene';
import { MenuScene } from './scenes/MenuScene';
import { ForestScene } from './scenes/ForestScene';

class HUDScene extends Phaser.Scene {
  constructor() { super('HUDScene'); }
}
class GameOverScene extends Phaser.Scene {
  constructor() { super('GameOverScene'); }
  create(data: { result?: string }) {
    this.add.text(400, 240, `${(data.result ?? '?').toUpperCase()}!`, { fontSize: '48px', color: '#fff' }).setOrigin(0.5);
  }
}

new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  pixelArt: true,
  physics: { default: 'arcade', arcade: { gravity: { x: 0, y: GRAVITY_Y }, debug: false } },
  scene: [BootScene, MenuScene, ForestScene, HUDScene, GameOverScene],
});
```

- [ ] **Step 5: Verify in browser**

```bash
npm run dev
```

Click "1. Forest" from menu. Expected: hero spawns on the ground, can run with arrows/WASD, jump with Space/W/Up, shoot with Z. Camera follows. Reaching the right edge triggers a "WIN!" placeholder.

If the tileset name or layer name from step 1 was wrong, the scene will throw — fix and re-run.

- [ ] **Step 6: Commit**

```bash
git add src/client/scenes/ForestScene.ts src/client/main.ts src/client/scenes/BootScene.ts
git commit -m "feat(client): ForestScene playable with Hero, tilemap, camera"
```

---

### Task 21: Zombie enemy

**Files:**
- Create: `src/client/entities/enemies/Zombie.ts`
- Modify: `src/client/scenes/ForestScene.ts`
- Modify: `src/client/scenes/BootScene.ts`

- [ ] **Step 1: Add zombie sprite preload to BootScene**

```ts
this.load.spritesheet('zombie', 'assets/sprites/zombie.png', { frameWidth: 32, frameHeight: 48 });
```

(Adjust path/frame size to actual asset.)

- [ ] **Step 2: Create `src/client/entities/enemies/Zombie.ts`**

```ts
import Phaser from 'phaser';

const PATROL_SPEED = 60;

export class Zombie extends Phaser.Physics.Arcade.Sprite {
  private dir: -1 | 1 = -1;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'zombie');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setCollideWorldBounds(true);
    this.setVelocityX(this.dir * PATROL_SPEED);
  }

  flip() {
    this.dir = (this.dir * -1) as -1 | 1;
    this.setVelocityX(this.dir * PATROL_SPEED);
    this.setFlipX(this.dir === 1);
  }

  preUpdate(time: number, delta: number) {
    super.preUpdate(time, delta);
    if (this.body!.blocked.left || this.body!.blocked.right) this.flip();
  }
}
```

- [ ] **Step 3: Wire zombies into ForestScene**

Add `import { Zombie } from '../entities/enemies/Zombie';` to the top of `src/client/scenes/ForestScene.ts`.

Add a private field to the class:

```ts
private zombies!: Phaser.Physics.Arcade.Group;
```

In `ForestScene.create()`, after the hero+bullet colliders and before `cameras.main.startFollow`, add:

```ts
this.zombies = this.physics.add.group({ classType: Zombie, runChildUpdate: true });
this.zombies.add(new Zombie(this, 400, this.map.heightInPixels - 100));
this.zombies.add(new Zombie(this, 700, this.map.heightInPixels - 100));

this.physics.add.collider(this.zombies, this.groundLayer);
this.physics.add.collider(this.hero.bullets, this.zombies, (bullet, zombie) => {
  (bullet as Phaser.GameObjects.GameObject).destroy();
  (zombie as Phaser.GameObjects.GameObject).destroy();
});
this.physics.add.collider(this.hero, this.zombies, () => this.onHeroDeath());
```

- [ ] **Step 4: Verify**

```bash
npm run dev
```

Click Forest. Expected: 2 zombies patrol the floor. Shooting them with Z destroys them. Walking into one ends the level with "LOSE!".

- [ ] **Step 5: Commit**

```bash
git add src/client/entities/enemies/Zombie.ts src/client/scenes/ForestScene.ts src/client/scenes/BootScene.ts
git commit -m "feat(client): Zombie enemy with patrol + collision in ForestScene"
```

---

### Task 22: Verify win/lose flow

Already implemented across T20 (goal zone + onLevelWin) and T21 (zombie kill → onHeroDeath via LevelScene base). This task is a verification step, not a code task.

- [ ] **Step 1: Verify win**

Run dev, walk hero to right edge → "WIN!" placeholder appears.

- [ ] **Step 2: Verify lose**

Run dev, walk into a zombie → "LOSE!" placeholder appears.

- [ ] **Step 3: No commit needed — verification only.**

---

## Phase 7 — HUD + GameOver + score submit

### Task 24: HUDScene

**Files:**
- Create: `src/client/scenes/HUDScene.ts`
- Modify: `src/client/main.ts` (replace placeholder HUDScene)

- [ ] **Step 1: Create `src/client/scenes/HUDScene.ts`**

```ts
import Phaser from 'phaser';
import { type LevelKey } from '../types';

export class HUDScene extends Phaser.Scene {
  private timerText!: Phaser.GameObjects.Text;
  private startTime = 0;
  private levelKey: LevelKey = 'forest';

  constructor() {
    super('HUDScene');
  }

  init(data: { levelKey: LevelKey }) {
    this.levelKey = data.levelKey;
    this.startTime = this.time.now;
  }

  create() {
    this.timerText = this.add.text(8, 8, 'Time: 0.00', {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: '#ffffff',
      backgroundColor: '#00000080',
      padding: { x: 6, y: 2 },
    });

    this.add
      .text(this.cameras.main.width - 8, 8, this.levelKey.toUpperCase(), {
        fontFamily: 'monospace',
        fontSize: '16px',
        color: '#ffcc00',
      })
      .setOrigin(1, 0);
  }

  update() {
    const elapsed = (this.time.now - this.startTime) / 1000;
    this.timerText.setText(`Time: ${elapsed.toFixed(2)}`);
  }
}
```

- [ ] **Step 2: Replace placeholder HUDScene in `main.ts`**

Remove the inline `class HUDScene extends Phaser.Scene { ... }` placeholder and add:

```ts
import { HUDScene } from './scenes/HUDScene';
```

Scene array stays the same shape: `[BootScene, MenuScene, ForestScene, HUDScene, GameOverScene]`.

- [ ] **Step 3: Verify**

Run dev, enter Forest. Expected: top-left timer counts up, top-right shows "FOREST".

- [ ] **Step 4: Commit**

```bash
git add src/client/scenes/HUDScene.ts src/client/main.ts
git commit -m "feat(client): HUDScene with running timer"
```

---

### Task 25: GameOverScene with score submit

**Files:**
- Create: `src/client/scenes/GameOverScene.ts`
- Create: `src/client/systems/api.ts`
- Modify: `src/client/main.ts` (replace placeholder)

- [ ] **Step 1: Create `src/client/systems/api.ts`**

```ts
import {
  ScoreSubmissionSchema,
  ScoreRowSchema,
  type ScoreSubmission,
  type ScoreRow,
} from '@shared/score.schema';
import { z } from 'zod';

export async function postScore(payload: ScoreSubmission): Promise<ScoreRow> {
  const parsed = ScoreSubmissionSchema.parse(payload);
  const res = await fetch('/api/scores', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(parsed),
  });
  if (!res.ok) throw new Error(`POST /api/scores failed: ${res.status}`);
  return ScoreRowSchema.parse(await res.json());
}

export async function getTopScores(level: string, limit = 10): Promise<ScoreRow[]> {
  const res = await fetch(`/api/scores?level=${encodeURIComponent(level)}&limit=${limit}`);
  if (!res.ok) throw new Error(`GET /api/scores failed: ${res.status}`);
  return z.array(ScoreRowSchema).parse(await res.json());
}
```

- [ ] **Step 2: Create `src/client/scenes/GameOverScene.ts`**

```ts
import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, type LevelKey } from '../types';
import { postScore, getTopScores } from '../systems/api';

interface Data {
  result: 'win' | 'lose';
  levelKey: LevelKey;
  timeMs?: number;
  score?: number;
}

export class GameOverScene extends Phaser.Scene {
  private data!: Data;

  constructor() {
    super('GameOverScene');
  }

  init(data: Data) {
    this.data = data;
  }

  create() {
    const w = GAME_WIDTH;
    const h = GAME_HEIGHT;
    const title = this.data.result === 'win' ? 'YOU WIN!' : 'GAME OVER';
    const color = this.data.result === 'win' ? '#66ff66' : '#ff6666';

    this.add
      .text(w / 2, 80, title, { fontFamily: 'monospace', fontSize: '48px', color })
      .setOrigin(0.5);

    if (this.data.result === 'win' && typeof this.data.timeMs === 'number') {
      this.add
        .text(w / 2, 140, `Time: ${(this.data.timeMs / 1000).toFixed(2)}s`, {
          fontFamily: 'monospace',
          fontSize: '20px',
          color: '#ffffff',
        })
        .setOrigin(0.5);

      this.promptName().then(async (name) => {
        if (name) {
          try {
            await postScore({
              playerName: name,
              level: this.data.levelKey,
              timeMs: this.data.timeMs!,
              score: this.data.score ?? 0,
            });
          } catch (e) {
            console.error(e);
          }
        }
        await this.renderLeaderboard();
      });
    } else {
      this.renderLeaderboard();
    }

    const replay = this.add
      .text(w / 2, h - 60, 'Play again', {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: '#66ff66',
        backgroundColor: '#222222',
        padding: { x: 10, y: 4 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    replay.on('pointerdown', () => {
      const sceneKey =
        this.data.levelKey === 'forest'
          ? 'ForestScene'
          : this.data.levelKey === 'desert'
            ? 'DesertScene'
            : 'GraveyardScene';
      this.scene.start(sceneKey);
    });

    const menu = this.add
      .text(w / 2, h - 30, 'Back to menu', {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: '#aaaaaa',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    menu.on('pointerdown', () => this.scene.start('MenuScene'));
  }

  private promptName(): Promise<string | null> {
    return new Promise((resolve) => {
      const raw = window.prompt('Enter name (max 16 alphanumerics):', 'AAA');
      if (raw === null) return resolve(null);
      const cleaned = raw.replace(/[^A-Za-z0-9]/g, '').slice(0, 16).toUpperCase();
      resolve(cleaned || null);
    });
  }

  private async renderLeaderboard() {
    try {
      const rows = await getTopScores(this.data.levelKey, 10);
      this.add
        .text(GAME_WIDTH / 2, 200, `TOP 10 — ${this.data.levelKey.toUpperCase()}`, {
          fontFamily: 'monospace',
          fontSize: '18px',
          color: '#ffcc00',
        })
        .setOrigin(0.5);
      rows.forEach((r, i) => {
        this.add
          .text(
            GAME_WIDTH / 2,
            230 + i * 18,
            `${String(i + 1).padStart(2)} ${r.playerName.padEnd(16)} ${(r.timeMs / 1000)
              .toFixed(2)
              .padStart(8)}s`,
            { fontFamily: 'monospace', fontSize: '14px', color: '#ffffff' },
          )
          .setOrigin(0.5);
      });
    } catch (err) {
      this.add
        .text(GAME_WIDTH / 2, 230, '(leaderboard unavailable)', {
          fontFamily: 'monospace',
          fontSize: '14px',
          color: '#888888',
        })
        .setOrigin(0.5);
    }
  }
}
```

- [ ] **Step 3: Replace placeholder GameOverScene in `main.ts`**

Remove the inline `class GameOverScene extends Phaser.Scene { ... }` placeholder. Add:

```ts
import { GameOverScene } from './scenes/GameOverScene';
```

- [ ] **Step 4: Verify end-to-end with backend running**

In one terminal:
```bash
docker compose up -d
npx tsx src/server/index.ts
```

In another:
```bash
npm run dev
```

Open the game, win Forest, type a name in the prompt. Expected: GameOver screen renders Top 10 with the just-submitted score visible.

- [ ] **Step 5: Commit**

```bash
git add src/client/systems/api.ts src/client/scenes/GameOverScene.ts src/client/main.ts
git commit -m "feat(client): GameOverScene posts score and renders leaderboard"
```

---

## Phase 8 — Desert + Graveyard

### Task 26: DesertScene + CowGirl enemy

**Files:**
- Create: `src/client/entities/enemies/CowGirl.ts`
- Create: `src/client/scenes/DesertScene.ts`
- Modify: `src/client/scenes/BootScene.ts`
- Modify: `src/client/main.ts`

- [ ] **Step 1: Inspect Desert tilemap names**

```bash
node -e "const m=require('./public/assets/tilemaps/DesertMap.json');console.log({tilesets:m.tilesets.map(t=>t.name),layers:m.layers.map(l=>({name:l.name,type:l.type}))});"
```

Note tileset name + ground layer name for step 4.

- [ ] **Step 2: Add CowGirl sprite preload to BootScene**

```ts
this.load.spritesheet('cowgirl', 'assets/sprites/cowgirl.png', { frameWidth: 32, frameHeight: 48 });
```

- [ ] **Step 3: Create `src/client/entities/enemies/CowGirl.ts`**

```ts
import Phaser from 'phaser';

const PATROL_SPEED = 50;
const SHOOT_COOLDOWN_MS = 2000;

export class CowGirl extends Phaser.Physics.Arcade.Sprite {
  private dir: -1 | 1 = -1;
  private lastShot = 0;
  public bullets: Phaser.Physics.Arcade.Group;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'cowgirl');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setCollideWorldBounds(true);
    this.setVelocityX(this.dir * PATROL_SPEED);
    this.bullets = scene.physics.add.group();
  }

  preUpdate(time: number, delta: number) {
    super.preUpdate(time, delta);
    if (this.body!.blocked.left || this.body!.blocked.right) {
      this.dir = (this.dir * -1) as -1 | 1;
      this.setVelocityX(this.dir * PATROL_SPEED);
      this.setFlipX(this.dir === 1);
    }
    if (time - this.lastShot > SHOOT_COOLDOWN_MS) {
      this.lastShot = time;
      const b = this.scene.physics.add.image(this.x + this.dir * 16, this.y, 'bullet');
      (b.body as Phaser.Physics.Arcade.Body).allowGravity = false;
      b.setVelocityX(this.dir * 300);
      this.bullets.add(b);
      this.scene.time.delayedCall(1500, () => b.destroy());
    }
  }
}
```

- [ ] **Step 4: Create `src/client/scenes/DesertScene.ts`**

```ts
import Phaser from 'phaser';
import { LevelScene, type LevelConfig } from './LevelScene';
import { Hero } from '../entities/Hero';
import { CowGirl } from '../entities/enemies/CowGirl';
import { createInput } from '../systems/input';

export class DesertScene extends LevelScene {
  private hero!: Hero;
  private inputSampler!: ReturnType<typeof createInput>;
  private enemies!: Phaser.Physics.Arcade.Group;

  constructor() {
    super('DesertScene');
  }

  protected getConfig(): LevelConfig {
    return {
      levelKey: 'desert',
      tilemapKey: 'desert-map',
      tilesetKey: 'desert-tiles',
      tilesetNameInTiled: 'DesertMapTileSheet', // VERIFY against step 1
      groundLayerName: 'Ground', // VERIFY against step 1
    };
  }

  create() {
    super.create();
    this.inputSampler = createInput(this);

    this.hero = new Hero(this, 64, this.map.heightInPixels - 100);
    this.physics.add.collider(this.hero, this.groundLayer);
    this.physics.add.collider(this.hero.bullets, this.groundLayer, (b) =>
      (b as Phaser.GameObjects.GameObject).destroy(),
    );

    this.enemies = this.physics.add.group({ classType: CowGirl, runChildUpdate: true });
    this.enemies.add(new CowGirl(this, 400, this.map.heightInPixels - 100));
    this.enemies.add(new CowGirl(this, 700, this.map.heightInPixels - 100));

    this.physics.add.collider(this.enemies, this.groundLayer);
    this.physics.add.collider(this.hero.bullets, this.enemies, (b, e) => {
      (b as Phaser.GameObjects.GameObject).destroy();
      (e as Phaser.GameObjects.GameObject).destroy();
    });
    this.physics.add.collider(this.hero, this.enemies, () => this.onHeroDeath());

    this.enemies.children.each((cg) => {
      const cow = cg as CowGirl;
      this.physics.add.collider(cow.bullets, this.groundLayer, (b) =>
        (b as Phaser.GameObjects.GameObject).destroy(),
      );
      this.physics.add.overlap(this.hero, cow.bullets, () => this.onHeroDeath());
      return true;
    });

    this.cameras.main.startFollow(this.hero, true, 0.1, 0.1);

    const goal = this.createGoalAt(this.map.widthInPixels - 64, this.map.heightInPixels - 64);
    this.physics.add.overlap(this.hero, goal, () => this.onLevelWin());
  }

  update() {
    if (this.hero) this.hero.applyInput(this.inputSampler());
  }
}
```

- [ ] **Step 5: Register DesertScene + verify**

In `src/client/main.ts`:

```ts
import { DesertScene } from './scenes/DesertScene';
// scene: [BootScene, MenuScene, ForestScene, DesertScene, HUDScene, GameOverScene],
```

Run dev, click Desert. Expected: cowgirls patrol and shoot bullets.

- [ ] **Step 6: Commit**

```bash
git add src/client/entities/enemies/CowGirl.ts src/client/scenes/DesertScene.ts src/client/scenes/BootScene.ts src/client/main.ts
git commit -m "feat(client): DesertScene with CowGirl enemy"
```

---

### Task 27: GraveyardScene + Ninja enemy + Fire entity

**Files:**
- Create: `src/client/entities/Fire.ts`
- Create: `src/client/entities/enemies/Ninja.ts`
- Create: `src/client/scenes/GraveyardScene.ts`
- Modify: `src/client/scenes/BootScene.ts`
- Modify: `src/client/main.ts`

- [ ] **Step 1: Create `src/client/entities/Fire.ts`** (stationary hazard from original)

```ts
import Phaser from 'phaser';

export class Fire extends Phaser.Physics.Arcade.Sprite {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'fire');
    scene.add.existing(this);
    scene.physics.add.existing(this, true); // static body
  }
}
```

- [ ] **Step 2: Create `src/client/entities/enemies/Ninja.ts`**

```ts
import Phaser from 'phaser';

const PATROL_SPEED = 80;

export class Ninja extends Phaser.Physics.Arcade.Sprite {
  private dir: -1 | 1 = -1;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'ninja');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setCollideWorldBounds(true);
    this.setVelocityX(this.dir * PATROL_SPEED);
  }

  preUpdate(time: number, delta: number) {
    super.preUpdate(time, delta);
    if (this.body!.blocked.left || this.body!.blocked.right) {
      this.dir = (this.dir * -1) as -1 | 1;
      this.setVelocityX(this.dir * PATROL_SPEED);
      this.setFlipX(this.dir === 1);
    }
  }
}
```

- [ ] **Step 3: Add ninja+fire preloads to BootScene**

```ts
this.load.spritesheet('ninja', 'assets/sprites/ninja.png', { frameWidth: 32, frameHeight: 48 });
this.load.image('fire', 'assets/sprites/fire.png');
```

- [ ] **Step 4: Inspect Graveyard tilemap names**

```bash
node -e "const m=require('./public/assets/tilemaps/GraveyardMap.json');console.log({tilesets:m.tilesets.map(t=>t.name),layers:m.layers.map(l=>({name:l.name,type:l.type}))});"
```

- [ ] **Step 5: Create `src/client/scenes/GraveyardScene.ts`**

```ts
import Phaser from 'phaser';
import { LevelScene, type LevelConfig } from './LevelScene';
import { Hero } from '../entities/Hero';
import { Ninja } from '../entities/enemies/Ninja';
import { Fire } from '../entities/Fire';
import { createInput } from '../systems/input';

export class GraveyardScene extends LevelScene {
  private hero!: Hero;
  private inputSampler!: ReturnType<typeof createInput>;
  private enemies!: Phaser.Physics.Arcade.Group;
  private fires!: Phaser.Physics.Arcade.StaticGroup;

  constructor() {
    super('GraveyardScene');
  }

  protected getConfig(): LevelConfig {
    return {
      levelKey: 'graveyard',
      tilemapKey: 'graveyard-map',
      tilesetKey: 'graveyard-tiles',
      tilesetNameInTiled: 'GraveyardMapTileSheet', // VERIFY
      groundLayerName: 'Ground', // VERIFY
    };
  }

  create() {
    super.create();
    this.inputSampler = createInput(this);

    this.hero = new Hero(this, 64, this.map.heightInPixels - 100);
    this.physics.add.collider(this.hero, this.groundLayer);
    this.physics.add.collider(this.hero.bullets, this.groundLayer, (b) =>
      (b as Phaser.GameObjects.GameObject).destroy(),
    );

    this.enemies = this.physics.add.group({ classType: Ninja, runChildUpdate: true });
    this.enemies.add(new Ninja(this, 400, this.map.heightInPixels - 100));
    this.enemies.add(new Ninja(this, 700, this.map.heightInPixels - 100));
    this.physics.add.collider(this.enemies, this.groundLayer);
    this.physics.add.collider(this.hero.bullets, this.enemies, (b, e) => {
      (b as Phaser.GameObjects.GameObject).destroy();
      (e as Phaser.GameObjects.GameObject).destroy();
    });
    this.physics.add.collider(this.hero, this.enemies, () => this.onHeroDeath());

    this.fires = this.physics.add.staticGroup({ classType: Fire });
    this.fires.add(new Fire(this, 500, this.map.heightInPixels - 80));
    this.fires.add(new Fire(this, 800, this.map.heightInPixels - 80));
    this.physics.add.overlap(this.hero, this.fires, () => this.onHeroDeath());

    this.cameras.main.startFollow(this.hero, true, 0.1, 0.1);

    const goal = this.createGoalAt(this.map.widthInPixels - 64, this.map.heightInPixels - 64);
    this.physics.add.overlap(this.hero, goal, () => this.onLevelWin());
  }

  update() {
    if (this.hero) this.hero.applyInput(this.inputSampler());
  }
}
```

- [ ] **Step 6: Register GraveyardScene + verify**

In `src/client/main.ts`:

```ts
import { GraveyardScene } from './scenes/GraveyardScene';
// scene: [BootScene, MenuScene, ForestScene, DesertScene, GraveyardScene, HUDScene, GameOverScene],
```

Run dev, click Graveyard. Expected: ninjas patrol, fires kill on contact, goal works.

- [ ] **Step 7: Commit**

```bash
git add src/client/entities/Fire.ts src/client/entities/enemies/Ninja.ts src/client/scenes/GraveyardScene.ts src/client/scenes/BootScene.ts src/client/main.ts
git commit -m "feat(client): GraveyardScene with Ninja enemy + Fire hazards"
```

---

## Phase 9 — Audio polish

### Task 28: Audio integration

**Files:**
- Create: `src/client/systems/audio.ts`
- Modify: `src/client/scenes/BootScene.ts`
- Modify: `src/client/scenes/ForestScene.ts`, `DesertScene.ts`, `GraveyardScene.ts`
- Modify: `src/client/entities/Hero.ts`
- Modify: `src/client/scenes/LevelScene.ts`

- [ ] **Step 1: Create `src/client/systems/audio.ts`**

```ts
import Phaser from 'phaser';

export type SoundKey = string;

export class Audio {
  private music?: Phaser.Sound.BaseSound;
  constructor(private scene: Phaser.Scene) {}

  playMusic(key: SoundKey, volume = 0.4) {
    this.music?.stop();
    this.music = this.scene.sound.add(key, { loop: true, volume });
    this.music.play();
  }

  stopMusic() {
    this.music?.stop();
  }

  sfx(key: SoundKey, volume = 0.6) {
    this.scene.sound.play(key, { volume });
  }
}
```

- [ ] **Step 2: Add audio loads to BootScene**

```ts
const audioPairs: [string, string][] = [
  ['music-forest', 'forest-at-dawn'],
  ['music-desert', 'western-themetune'],
  ['music-graveyard', 'scary-background-4'],
  ['sfx-shoot', 'laser-one-shot-2'],
  ['sfx-hit', 'zombie-attack'],
  ['sfx-win', 'you-win'],
  ['sfx-lose', 'you-lose-evil'],
];
for (const [key, file] of audioPairs) {
  this.load.audio(key, [`assets/audio/${file}.mp3`, `assets/audio/${file}.ogg`]);
}
```

(Adjust filenames to actual ones produced by T13 — `ls public/assets/audio/` to confirm.)

- [ ] **Step 3: Wire music into each LevelScene subclass**

In each of `ForestScene`, `DesertScene`, `GraveyardScene`, add a private `audio` field and start music in `create()` after `super.create()`:

```ts
import { Audio } from '../systems/audio';
// in class:
private audio!: Audio;
// in create() after super.create():
this.audio = new Audio(this);
this.audio.playMusic('music-forest'); // or 'music-desert' / 'music-graveyard'
```

- [ ] **Step 4: Wire SFX into Hero.shoot**

In `src/client/entities/Hero.ts` `shoot()`:

```ts
shoot() {
  const dir: -1 | 1 = this.flipX ? -1 : 1;
  this.bullets.add(new Bullet(this.scene, this.x + dir * 16, this.y, dir));
  this.scene.sound.play('sfx-shoot', { volume: 0.4 });
}
```

- [ ] **Step 5: Wire SFX into LevelScene win/lose**

In `src/client/scenes/LevelScene.ts`, before `this.scene.start('GameOverScene', …)` in both `onLevelWin` and `onHeroDeath`:

```ts
// inside onLevelWin:
this.sound.play('sfx-win', { volume: 0.6 });

// inside onHeroDeath:
this.sound.play('sfx-lose', { volume: 0.6 });
```

- [ ] **Step 6: Verify**

Run dev, play through. Music + SFX play.

- [ ] **Step 7: Commit**

```bash
git add src/client/systems/audio.ts src/client/scenes/ src/client/entities/Hero.ts
git commit -m "feat(client): integrate background music + SFX"
```

---

## Phase 10 — Tests + smoke

### Task 30: Vitest CI sanity

**Files:**
- (no source changes — verify tests run cleanly)

- [ ] **Step 1: Run all unit tests with the local DB**

```bash
docker compose up -d
DATABASE_URL=postgres://postgres:postgres@localhost:5432/supermario npm test
```

Expected: all server tests pass.

- [ ] **Step 2: Add typecheck verify**

```bash
npm run typecheck
```

Expected: no TS errors. If any errors are found, fix them and commit:

```bash
git add -p
git commit -m "fix: typecheck errors"
```

---

### Task 31: Playwright smoke test

**Files:**
- Create: `playwright.config.ts`
- Create: `tests/e2e/smoke.spec.ts`

- [ ] **Step 1: Install browser**

```bash
npx playwright install chromium
```

- [ ] **Step 2: Create `playwright.config.ts`**

```ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e',
  use: {
    baseURL: 'http://localhost:3000',
    headless: true,
  },
  webServer: {
    command: 'npm run build && npm run start',
    url: 'http://localhost:3000/api/health',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      NODE_ENV: 'production',
      DATABASE_URL: 'postgres://postgres:postgres@localhost:5432/supermario',
      PORT: '3000',
    },
  },
});
```

- [ ] **Step 3: Create `tests/e2e/smoke.spec.ts`**

```ts
import { test, expect } from '@playwright/test';

test('game shell loads and health is OK', async ({ page, request }) => {
  await page.goto('/');
  await expect(page.locator('canvas').first()).toBeVisible({ timeout: 15_000 });

  const health = await request.get('/api/health');
  expect(health.ok()).toBe(true);
  expect(await health.json()).toEqual({ ok: true });

  const scores = await request.get('/api/scores');
  expect(scores.ok()).toBe(true);
});
```

- [ ] **Step 4: Run**

Ensure docker-compose Postgres is running, then:

```bash
npm run test:e2e
```

Expected: 1 passed.

- [ ] **Step 5: Commit**

```bash
git add playwright.config.ts tests/e2e/
git commit -m "test(e2e): Playwright smoke for canvas + API health"
```

---

## Phase 11 — Docs + Deploy

### Task 32: README finalize

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Replace `README.md` with the new contents**

```markdown
# Super Mario — Modernized

A 2D platform game built with Phaser 3 + TypeScript + Vite, with an Express + Drizzle + Postgres backend serving anonymous high-score leaderboards. Originally a 2021 vanilla-JS project; rewritten in 2026.

## Run locally

Prereqs: Node ≥ 20, Docker, ffmpeg.

\`\`\`bash
cp .env.example .env
docker compose up -d
npm install
npm run db:migrate
npm run dev          # client http://localhost:5173, api http://localhost:3000
\`\`\`

## Build & run prod

\`\`\`bash
npm run build
npm start            # http://localhost:3000
\`\`\`

## Tests

\`\`\`bash
npm test             # vitest unit + integration
npm run test:e2e     # Playwright smoke
npm run typecheck    # tsc --noEmit
\`\`\`

## Architecture

See `docs/superpowers/specs/2026-05-07-super-mario-modernization-design.md`.

## Credits

Original 2021 implementation: see commits prior to the `legacy-2021` tag and the `legacy/` directory.
```

(When applying the Step 1 content as a real file, remove the leading `\` from each fence — they're escapes purely for inclusion inside this plan doc.)

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: README for modernized project"
```

---

### Task 33: Railway config

**Files:**
- Create: `railway.json`

- [ ] **Step 1: Create `railway.json`**

```json
{
  "$schema": "https://railway.com/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm start",
    "healthcheckPath": "/api/health",
    "healthcheckTimeout": 30,
    "restartPolicyType": "ON_FAILURE"
  }
}
```

- [ ] **Step 2: Verify build works locally**

```bash
rm -rf dist
npm run build
ls dist/
ls dist/client/
ls dist/server/
```

Expected: `dist/client/index.html` and `dist/server/index.js` exist.

Test the prod path:

```bash
NODE_ENV=production DATABASE_URL=postgres://postgres:postgres@localhost:5432/supermario PORT=3001 node dist/server/index.js &
sleep 2
curl -i http://localhost:3001/api/health
curl -I http://localhost:3001/
kill %1
```

Expected: `/api/health` returns 200 JSON; `/` returns 200 with HTML.

- [ ] **Step 3: Commit**

```bash
git add railway.json
git commit -m "chore: Railway Nixpacks config + healthcheck"
```

---

### Task 34: Provision Railway and deploy

This task uses the `railway:use-railway` skill — invoke it for the Railway operations.

- [ ] **Step 1: Push the modernize branch**

```bash
git push -u origin modernize
```

- [ ] **Step 2: Provision Railway project + Postgres + web service**

Use the Railway skill to:
- Create a project named `super-mario`
- Add the Postgres plugin
- Connect this GitHub repo, branch `modernize`, as a `web` service
- Reference the Postgres service's `DATABASE_URL` in `web` env (`${{Postgres.DATABASE_URL}}`)
- Set `NODE_ENV=production` on `web`
- Trigger the first deploy

- [ ] **Step 3: Watch deploy logs and smoke-test**

Once deploy is `SUCCESS`, retrieve the public URL.

```bash
curl https://<railway-url>/api/health
curl -I https://<railway-url>/
```

Expected: `/api/health` returns 200 `{"ok":true}`; `/` returns 200 with HTML.

Open the public URL in a browser, play Forest, submit a score, confirm leaderboard renders.

- [ ] **Step 4: No commit needed** — Railway deploy state lives in their dashboard.

---

## Phase 12 — Repo cleanup

### Task 35: Open PR, rename master → main, tag legacy

**Files:**
- (no source changes — Git/GitHub operations only)

- [ ] **Step 1: Open PR `modernize → master`**

```bash
gh pr create --base master --head modernize \
  --title "Modernize: Phaser 3 + TS + Vite + Express + Drizzle + Postgres" \
  --body "$(cat <<'EOF'
## Summary
- Full rewrite from vanilla-JS canvas to Phaser 3 + TS
- Adds Express+Drizzle+Postgres backend with /api/scores
- Deploys on Railway

## Test plan
- [x] vitest unit + integration
- [x] Playwright smoke
- [x] Local prod build runs
- [x] Railway deploy green

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

- [ ] **Step 2: After review, merge PR (squash) and rename branch**

```bash
gh pr merge --squash
git checkout master
git pull
git branch -m master main
git push -u origin main
gh repo edit --default-branch main
git push origin --delete master
```

- [ ] **Step 3: Tag the legacy snapshot**

The `legacy/` folder still contains the 2021 source. Tag the merge commit so it can be found later:

```bash
git tag -a legacy-2021 -m "Pre-modernization snapshot of original 2021 source under legacy/" HEAD
git push origin legacy-2021
```

- [ ] **Step 4: Confirm Railway is auto-deploying from `main`**

Check Railway dashboard → web service → settings → branch is `main`. If not, switch it. Push a no-op commit if needed to trigger deploy:

```bash
git commit --allow-empty -m "chore: trigger deploy from main"
git push
```

- [ ] **Step 5: Done.**

---

## Self-review checklist (engineer running this plan)

Before merging:

- All tasks above committed and pushed
- `npm run typecheck` passes
- `npm test` passes (with local Postgres up)
- `npm run test:e2e` passes
- Manual play-through: each level wins and loses correctly, leaderboard updates, restart works
- Railway URL responds 200 on `/`, `/api/health`, `/api/scores`

If any check fails, do **not** merge. Fix on the modernize branch first.
