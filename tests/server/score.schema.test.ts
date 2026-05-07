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
