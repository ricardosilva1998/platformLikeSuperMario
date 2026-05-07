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
