import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { createApp } from './app.js';
import { db } from './db/client.js';
import { env } from './env.js';

async function main() {
  console.log('running migrations…');
  await migrate(db, { migrationsFolder: './drizzle' });
  console.log('migrations done');

  const app = createApp();
  app.listen(env.PORT, () => {
    console.log(`server listening on :${env.PORT} (${env.NODE_ENV})`);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
