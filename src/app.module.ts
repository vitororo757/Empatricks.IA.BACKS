import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module.js';
import { HealthController } from './health.controller.js';
import { RootController } from './root.controller.js';

@Module({
  imports: [AuthModule],
  controllers: [RootController, HealthController],
})
export class AppModule {}
