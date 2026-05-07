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
