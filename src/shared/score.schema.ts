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
