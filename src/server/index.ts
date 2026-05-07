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
