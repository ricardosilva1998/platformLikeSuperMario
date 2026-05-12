# super-mario — CLAUDE.md

## Stack
- Frontend: Phaser 3 + TypeScript + Vite
- Backend: Express + Drizzle ORM + PostgreSQL
- Build: Nixpacks (Railway)
- Start command: `npm start` → `node dist/server/server/index.js`

## Deployment
- Platform: Railway (default)
- Service URL: https://web-production-10ba1.up.railway.app/
- Healthcheck: GET /api/health → 200
- Note: `railway up` sometimes reports "operation timed out" even when the upload succeeded. Always run `railway deployment list` before retrying to avoid duplicate uploads. Cap retries at 2 total.

## Team Activity Log

### 2026-05-12 08:02 — team-deployment
**Task:** Commit and deploy fix for map not fitting inside canvas (bump internal resolution 800x480 → 1600x960, adjust UI scenes)
**Commits:** afdb561 — fix(game): bump internal resolution to 1600x960 and adjust UI scenes
**Pushed to:** origin/main @ afdb561
**PR:** n/a
**Deploy:** railway up → 5d49dc58-0272-4b5f-b04a-b573eb4b02bd → success
**Build time:** ~75s
**Healthcheck:** pass (200 OK on /api/health; root HTML serves /assets/index-DMX-XNEd.js confirming new build)
**Logs after deploy (60s window):** clean — server started, migrations ran, no errors
**Open:** DATABASE_URL is supplied by Railway env (local dev logs a missing-env warning — expected, not a deploy issue). No other open items.
