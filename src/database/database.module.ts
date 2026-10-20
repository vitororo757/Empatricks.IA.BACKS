import { Module } from '@nestjs/common';
import { PrismaService } from './prisma.service.js';
import { RlsTransactionService } from './rls-transaction.service.js';

@Module({
  providers: [PrismaService, RlsTransactionService],
  exports: [RlsTransactionService],
})
export class DatabaseModule {}
