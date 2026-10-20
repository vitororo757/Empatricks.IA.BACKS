import { afterAll, beforeAll, describe, expect, test } from '@jest/globals';
import { randomUUID } from 'node:crypto';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../.nest-build/generated/prisma/client.js';
import { PrismaService } from '../.nest-build/database/prisma.service.js';
import { RlsTransactionService } from '../.nest-build/database/rls-transaction.service.js';

const integrationEnabled = process.env.RUN_DATABASE_INTEGRATION === '1';
const integrationTest = integrationEnabled ? test : test.skip;
const userIds = [randomUUID(), randomUUID(), randomUUID()];
const equipmentIds = [randomUUID(), randomUUID()];
let prisma;
let rls;

describe('Prisma + Supabase RLS integration', () => {
  beforeAll(async () => {
    if (!integrationEnabled) return;
    if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required for this integration test.');

    const adapter = new PrismaPg({
      connectionString: process.env.DATABASE_URL,
      max: 1,
      connectionTimeoutMillis: 5_000,
    });
    prisma = new PrismaClient({ adapter });
    await prisma.$connect();
    rls = new RlsTransactionService(prisma);

    await prisma.$executeRaw`
      INSERT INTO auth.users (id, email)
      VALUES
        (${userIds[0]}, ${`${userIds[0]}@rls-test.invalid`}),
        (${userIds[1]}, ${`${userIds[1]}@rls-test.invalid`}),
        (${userIds[2]}, ${`${userIds[2]}@rls-test.invalid`})
      ON CONFLICT (id) DO NOTHING
    `;
    await prisma.$executeRaw`
      INSERT INTO public.equipment (id, asset_tag, name, category)
      VALUES
        (${equipmentIds[0]}, ${`RLS-${equipmentIds[0]}`}, 'RLS test device A', 'test'),
        (${equipmentIds[1]}, ${`RLS-${equipmentIds[1]}`}, 'RLS test device B', 'test')
      ON CONFLICT (id) DO NOTHING
    `;
  });

  afterAll(async () => {
    if (!prisma) return;
    try {
      await prisma.$executeRaw`
        DELETE FROM public.loans
        WHERE borrower_id IN (${userIds[0]}::uuid, ${userIds[1]}::uuid, ${userIds[2]}::uuid)
           OR equipment_id IN (${equipmentIds[0]}::uuid, ${equipmentIds[1]}::uuid)
      `;
      await prisma.$executeRaw`
        DELETE FROM public.equipment
        WHERE id IN (${equipmentIds[0]}::uuid, ${equipmentIds[1]}::uuid)
      `;
      await prisma.$executeRaw`
        DELETE FROM auth.users
        WHERE id IN (${userIds[0]}::uuid, ${userIds[1]}::uuid, ${userIds[2]}::uuid)
      `;
    } finally {
      await prisma.$disconnect();
    }
  });

  integrationTest('isolates borrowers and clears identity when the pooled connection is reused', async () => {
    for (let index = 0; index < 2; index += 1) {
      await rls.run({ id: userIds[index], appMetadata: {} }, (tx) => tx.$executeRaw`
        INSERT INTO public.loans (equipment_id) VALUES (${equipmentIds[index]})
      `);
    }

    for (let index = 0; index < userIds.length; index += 1) {
      const rows = await rls.run({ id: userIds[index], appMetadata: {} }, (tx) => tx.$queryRaw`
        SELECT auth.uid()::text AS user_id,
               current_user::text AS database_role,
               (SELECT count(*)::int FROM public.loans) AS visible_loans
      `);

      expect(rows[0]).toEqual({
        user_id: userIds[index],
        database_role: 'authenticated',
        visible_loans: index < 2 ? 1 : 0,
      });
    }

    const [connectionState] = await prisma.$queryRaw`
      SELECT current_user::text AS database_role,
             current_setting('request.jwt.claims', true) AS claims
    `;
    expect(connectionState.database_role).toBe('postgres');
    expect(connectionState.claims ?? '').toBe('');
  });
});
