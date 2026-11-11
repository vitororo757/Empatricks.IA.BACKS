import { describe, expect, jest, test } from '@jest/globals';
import { BadRequestException, ConflictException } from '@nestjs/common';
const { LoansController } = await import('../.nest-build/loans.controller.js');

const user = { id: '11111111-1111-4111-8111-111111111111', appMetadata: {} };
const id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1';
function setup(tx) {
  const db = { run: jest.fn(async (identity, work) => { expect(identity).toEqual(user); return work(tx); }) };
  return { controller: new LoansController(db), db };
}
describe('LoansController', () => {
  test('rejects malformed equipment IDs before the database', async () => {
    const { controller, db } = setup({});
    await expect(controller.create({ user }, { equipmentId: 'bad' })).rejects.toBeInstanceOf(BadRequestException);
    expect(db.run).not.toHaveBeenCalled();
  });
  test('requests only active loans belonging to the verified user', async () => {
    const findMany = jest.fn().mockResolvedValue([]);
    const { controller } = setup({ loan: { findMany } });
    await controller.loans({ user });
    expect(findMany.mock.calls[0][0].where).toEqual({ borrowerId: user.id, returnedAt: null });
  });
  test('reports a specific limit refusal and does not expose internal errors', async () => {
    const create = jest.fn().mockRejectedValue(new Error('A borrower cannot have more than five active loans'));
    const { controller } = setup({ loan: { create } });
    await expect(controller.create({ user }, { equipmentId: id })).rejects.toThrow('Você já possui cinco empréstimos em aberto.');
  });
  test('translates unavailable items into conflict responses', async () => {
    const create = jest.fn().mockRejectedValue(new Error('Equipment is not available'));
    const { controller } = setup({ loan: { create } });
    await expect(controller.create({ user }, { equipmentId: id })).rejects.toBeInstanceOf(ConflictException);
  });
});
