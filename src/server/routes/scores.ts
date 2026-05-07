import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { desc, eq } from 'drizzle-orm';
import { db } from '../db/client.js';
import { scores } from '../db/schema.js';
import { LevelEnum, ScoreSubmissionSchema } from '../../shared/score.schema.js';

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

export const postLimiter = rateLimit({
  windowMs: 60_000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
});

scoresRouter.post('/', postLimiter, async (req, res, next) => {
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
