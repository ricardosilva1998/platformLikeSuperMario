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
