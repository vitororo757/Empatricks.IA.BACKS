import { existsSync } from 'node:fs';
import { defineConfig } from 'prisma/config';

if (!process.env.DATABASE_URL && existsSync('.env.local')) {
  process.loadEnvFile('.env.local');
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: { path: 'prisma/migrations' },
  // Client generation does not connect to the database. Keep the URL empty
  // when DATABASE_URL is absent; database operations still require it at runtime.
  datasource: { url: process.env.DATABASE_URL ?? '' },
});
