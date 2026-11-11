import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module.js';
import { HealthController } from './health.controller.js';
import { RootController } from './root.controller.js';
import { DatabaseModule } from './database/database.module.js';
import { LoansController } from './loans.controller.js';

@Module({
  imports: [AuthModule, DatabaseModule],
  controllers: [RootController, HealthController, LoansController],
})
export class AppModule {}
