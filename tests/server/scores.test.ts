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
