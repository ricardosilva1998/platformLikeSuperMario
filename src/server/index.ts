import { createApp } from './app.js';
import { env } from './env.js';

const app = createApp();
app.listen(env.PORT, () => {
  console.log(`server listening on :${env.PORT} (${env.NODE_ENV})`);
});
