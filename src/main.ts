import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  app.enableShutdownHooks();
  if (process.env.FRONTEND_ORIGIN) app.enableCors({ origin: process.env.FRONTEND_ORIGIN });
  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
}

void bootstrap();
