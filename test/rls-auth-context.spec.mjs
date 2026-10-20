import { describe, expect, jest, test } from '@jest/globals';
import { UnauthorizedException } from '@nestjs/common';
const buildDirectory = process.env.TEST_BUILD_DIR ?? '.nest-build';
const { SupabaseAuthGuard } = await import(`../${buildDirectory}/auth/supabase-auth.guard.js`);
const { RlsTransactionService } = await import(`../${buildDirectory}/database/rls-transaction.service.js`);

function executionContext(request) {
  return { switchToHttp: () => ({ getRequest: () => request }) };
}

describe('SupabaseAuthGuard', () => {
  test('rejects missing and invalid bearer tokens', async () => {
    const guard = new SupabaseAuthGuard('https://example.supabase.co', 'public-key', jest.fn());
    await expect(guard.canActivate(executionContext({ headers: {} }))).rejects.toBeInstanceOf(UnauthorizedException);

    const fetcher = jest.fn().mockResolvedValue({ ok: false });
    const invalidGuard = new SupabaseAuthGuard('https://example.supabase.co', 'public-key', fetcher);
    await expect(invalidGuard.canActivate(executionContext({ headers: { authorization: 'Bearer invalid' } })))
      .rejects.toBeInstanceOf(UnauthorizedException);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  test('attaches only the identity and trusted app metadata returned by Auth', async () => {
    const fetcher = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: 'user-1', app_metadata: { role: 'operations' }, user_metadata: { role: 'operations' } }),
    });
    const request = { headers: { authorization: 'Bearer valid-token' }, body: { role: 'operations' } };
    const guard = new SupabaseAuthGuard('https://example.supabase.co/', 'public-key', fetcher);

    await expect(guard.canActivate(executionContext(request))).resolves.toBe(true);
    expect(request.user).toEqual({ id: 'user-1', appMetadata: { role: 'operations' } });
    expect(fetcher.mock.calls[0][0]).toBe('https://example.supabase.co/auth/v1/user');
    expect(fetcher.mock.calls[0][1].headers).toEqual({
      apikey: 'public-key',
      authorization: 'Bearer valid-token',
    });
  });
});

describe('RlsTransactionService', () => {
  test('sets role and transaction-local claims before business queries', async () => {
    const calls = [];
    const transaction = {
      $executeRaw: jest.fn(async (strings, ...values) => { calls.push(['execute', strings.join('?'), values]); return 0; }),
      $queryRaw: jest.fn(async (strings, ...values) => { calls.push(['query', strings.join('?'), values]); return []; }),
    };
    const prisma = { $transaction: jest.fn(async (callback) => callback(transaction)) };
    const service = new RlsTransactionService(prisma);
    const result = await service.run(
      { id: 'user-1', appMetadata: { role: 'operations' } },
      async (tx) => { calls.push(['business']); return tx === transaction ? 'ok' : 'wrong transaction'; },
    );

    expect(result).toBe('ok');
    expect(calls.map(([kind]) => kind)).toEqual(['execute', 'query', 'business']);
    expect(calls[0][1]).toBe('SET LOCAL ROLE authenticated');
    expect(JSON.parse(calls[1][2][0])).toEqual({
      sub: 'user-1', role: 'authenticated', app_metadata: { role: 'operations' },
    });
  });

  test('does not run business work if role setup fails', async () => {
    const work = jest.fn();
    const transaction = {
      $executeRaw: jest.fn().mockRejectedValue(new Error('role denied')),
      $queryRaw: jest.fn(),
    };
    const service = new RlsTransactionService({ $transaction: (callback) => callback(transaction) });

    await expect(service.run({ id: 'user-1', appMetadata: {} }, work)).rejects.toThrow('role denied');
    expect(work).not.toHaveBeenCalled();
    expect(transaction.$queryRaw).not.toHaveBeenCalled();
  });
});
