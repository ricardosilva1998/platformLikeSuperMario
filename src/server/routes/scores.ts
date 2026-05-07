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
