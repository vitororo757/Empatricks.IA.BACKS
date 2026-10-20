import { Injectable, UnauthorizedException } from '@nestjs/common';
import type { AuthenticatedIdentity } from '../auth/supabase-auth.guard.js';
import type { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from './prisma.service.js';

@Injectable()
export class RlsTransactionService {
  constructor(private readonly prisma: PrismaService) {}

  run<T>(identity: AuthenticatedIdentity, work: (transaction: Prisma.TransactionClient) => Promise<T>): Promise<T> {
    if (!identity.id) throw new UnauthorizedException();

    const claims = JSON.stringify({
      sub: identity.id,
      role: 'authenticated',
      app_metadata: identity.appMetadata,
    });

    return this.prisma.$transaction(async (transaction) => {
      await transaction.$executeRaw`SET LOCAL ROLE authenticated`;
      await transaction.$queryRaw`SELECT set_config('request.jwt.claims', ${claims}, true)`;
      return work(transaction);
    });
  }
}
