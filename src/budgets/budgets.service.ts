import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';

@Injectable()
export class BudgetsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Transform budget to API format
   */
  private transformBudget(budget: any) {
    return {
      id: budget.id.toString(),
      amount: Number(budget.amount),
      period: budget.period,
      userId: budget.userId.toString(),
      createdAt: budget.createdAt.toISOString(),
      updatedAt: budget.updatedAt.toISOString(),
    };
  }

  /**
   * Get budget for user (optionally filtered by period)
   * Returns the most recent budget if multiple exist
   */
  async findOne(userId: number, period?: string) {
    const where: any = { userId };

    if (period) {
      where.period = period;
    }

    const budget = await this.prisma.budget.findFirst({
      where,
      orderBy: { createdAt: 'desc' },
    });

    if (!budget) {
      return null;
    }

    return this.transformBudget(budget);
  }

  /**
   * Create or update budget
   * If budget exists for the period, update it; otherwise create new
   */
  async createOrUpdate(userId: number, createBudgetDto: CreateBudgetDto) {
    const period = createBudgetDto.period || 'monthly';

    // Check if budget exists for this user and period
    const existing = await this.prisma.budget.findUnique({
      where: {
        userId_period: {
          userId,
          period,
        },
      },
    });

    if (existing) {
      // Update existing budget
      const budget = await this.prisma.budget.update({
        where: { id: existing.id },
        data: {
          amount: createBudgetDto.amount,
        },
      });
      return this.transformBudget(budget);
    } else {
      // Create new budget
      const budget = await this.prisma.budget.create({
        data: {
          amount: createBudgetDto.amount,
          period,
          userId,
        },
      });
      return this.transformBudget(budget);
    }
  }

  /**
   * Update budget by ID
   */
  async update(id: number, userId: number, updateBudgetDto: UpdateBudgetDto) {
    // Verify budget exists and belongs to user
    const existing = await this.prisma.budget.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Budget not found');
    }

    if (existing.userId !== userId) {
      throw new NotFoundException('Budget not found');
    }

    const updateData: any = {};
    if (updateBudgetDto.amount !== undefined) updateData.amount = updateBudgetDto.amount;
    if (updateBudgetDto.period !== undefined) updateData.period = updateBudgetDto.period;

    const budget = await this.prisma.budget.update({
      where: { id },
      data: updateData,
    });

    return this.transformBudget(budget);
  }

  /**
   * Delete budget by ID
   */
  async remove(id: number, userId: number) {
    // Verify budget exists and belongs to user
    const existing = await this.prisma.budget.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Budget not found');
    }

    if (existing.userId !== userId) {
      throw new NotFoundException('Budget not found');
    }

    await this.prisma.budget.delete({
      where: { id },
    });

    return { message: 'Budget deleted successfully' };
  }
}




