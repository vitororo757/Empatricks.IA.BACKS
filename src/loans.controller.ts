import { BadRequestException, Body, ConflictException, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { SupabaseAuthGuard, type AuthenticatedIdentity } from './auth/supabase-auth.guard.js';
import { RlsTransactionService } from './database/rls-transaction.service.js';

type UserRequest = { user: AuthenticatedIdentity };

@Controller()
@UseGuards(SupabaseAuthGuard)
export class LoansController {
  constructor(private readonly database: RlsTransactionService) {}

  @Get('equipment')
  equipment(@Req() request: UserRequest) {
    return this.database.run(request.user, tx => tx.equipment.findMany({
      select: { id: true, assetTag: true, name: true, category: true, status: true, imageUrl: true },
      orderBy: { assetTag: 'asc' },
    }));
  }

  @Get('loans')
  loans(@Req() request: UserRequest) {
    return this.database.run(request.user, tx => tx.loan.findMany({
      where: { borrowerId: request.user.id, returnedAt: null },
      select: { id: true, equipmentId: true, borrowedAt: true, dueAt: true,
        equipment: { select: { id: true, name: true, assetTag: true, imageUrl: true } } },
      orderBy: { borrowedAt: 'desc' },
    }));
  }

  @Post('loans')
  async create(@Req() request: UserRequest, @Body() body: unknown) {
    const equipmentId = typeof body === 'object' && body !== null && 'equipmentId' in body ? body.equipmentId : undefined;
    if (typeof equipmentId !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(equipmentId)) {
      throw new BadRequestException('Informe um equipamento válido.');
    }
    try {
      return await this.database.run(request.user, tx => tx.loan.create({ data: { equipmentId },
        select: { id: true, equipmentId: true, borrowedAt: true, dueAt: true } }));
    } catch (error) {
      const text = String(error);
      if (text.includes('overdue loan')) throw new ConflictException('Você possui empréstimo em atraso.');
      if (text.includes('five active loans')) throw new ConflictException('Você já possui cinco empréstimos em aberto.');
      if (text.includes('not available') || text.includes('does not exist') || text.includes('loans_one_active_per_equipment')) {
        throw new ConflictException('Equipamento indisponível para empréstimo.');
      }
      throw error;
    }
  }
}

