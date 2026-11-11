import { test, expect } from '@jest/globals';
import { NestFactory } from '@nestjs/core';

test('constructs the application and its authentication guard', async () => {
  const previous = process.env.DATABASE_URL;
  process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
  try {
    const { AppModule } = await import('../.nest-build/app.module.js');
    const app = await NestFactory.create(AppModule, { logger: false, abortOnError: false });
    expect(app).toBeDefined();
    await app.close();
  } finally {
    if (previous === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = previous;
  }
});
