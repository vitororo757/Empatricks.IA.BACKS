import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module.js';
import { DatabaseModule } from './database/database.module.js';
import { HealthController } from './health.controller.js';

@Module({
  imports: [AuthModule, DatabaseModule],
  controllers: [HealthController],
})
export class AppModule {}
