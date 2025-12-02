import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { ExpenseQueryDto } from './dto/expense-query.dto';

@Injectable()
export class ExpensesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get date range for period filtering
   */
  private getPeriodDateRange(period: string): { start: Date; end: Date } {
    const now = new Date();
    let start: Date;
    let end: Date;

    switch (period) {
      case 'daily':
        start = new Date(now);
        start.setHours(0, 0, 0, 0);
        end = new Date(now);
        end.setHours(23, 59, 59, 999);
        break;
      case 'weekly':
        // Get Monday of current week
        const day = now.getDay();
        const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
        start = new Date(now);
        start.setDate(diff);
        start.setHours(0, 0, 0, 0);
        // Get Sunday of current week
        end = new Date(start);
        end.setDate(start.getDate() + 6);
        end.setHours(23, 59, 59, 999);
        break;
      case 'monthly':
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        start.setHours(0, 0, 0, 0);
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case 'yearly':
        start = new Date(now.getFullYear(), 0, 1);
        start.setHours(0, 0, 0, 0);
        end = new Date(now.getFullYear(), 11, 31);
        end.setHours(23, 59, 59, 999);
        break;
      default:
        start = new Date(0); // Beginning of time
        end = new Date(); // Now
    }

    return { start, end };
  }

  /**
   * Transform expense to API format
   */
  private transformExpense(expense: any) {
    return {
      id: expense.id,
      title: expense.title || 'Untitled Expense',
      amount: Number(expense.amount),
      date: expense.date.toISOString(),
      category: expense.category?.name || 'Other',
      description: expense.description || null,
      userId: expense.userId.toString(),
      createdAt: expense.createdAt.toISOString(),
      updatedAt: expense.updatedAt.toISOString(),
    };
  }

  /**
   * Create a new expense for the authenticated user
   */
  async create(userId: number, createExpenseDto: CreateExpenseDto) {
    // Verify category exists
    const category = await this.prisma.expenseCategory.findUnique({
      where: { id: createExpenseDto.categoryId },
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${createExpenseDto.categoryId} not found`);
    }

    const expense = await this.prisma.expense.create({
      data: {
        title: createExpenseDto.title,
        amount: createExpenseDto.amount,
        description: createExpenseDto.description,
        date: new Date(createExpenseDto.date),
        categoryId: createExpenseDto.categoryId,
        userId: userId,
      },
      include: {
        category: true,
      },
    });

    return this.transformExpense(expense);
  }

  /**
   * Find all expenses for the authenticated user with optional period filtering
   */
  async findAll(userId: number, query: ExpenseQueryDto) {
    const where: any = {
      userId: userId,
    };

    // Apply period filter if provided
    if (query.period) {
      const { start, end } = this.getPeriodDateRange(query.period);
      where.date = {
        gte: start,
        lte: end,
      };
    }

    const expenses = await this.prisma.expense.findMany({
      where,
      include: {
        category: true,
      },
      orderBy: { date: 'desc' },
    });

    const transformedExpenses = expenses.map((exp) => this.transformExpense(exp));

    // Calculate total and count
    const total = expenses.reduce((sum, exp) => sum + Number(exp.amount), 0);
    const count = expenses.length;

    return {
      expenses: transformedExpenses,
      total: Number(total.toFixed(2)),
      count,
    };
  }

  /**
   * Find a single expense by ID
   */
  async findOne(id: number, userId: number) {
    const expense = await this.prisma.expense.findUnique({
      where: { id },
      include: {
        category: true,
      },
    });

    if (!expense) {
      throw new NotFoundException('Expense not found');
    }

    // Verify expense belongs to user
    if (expense.userId !== userId) {
      throw new NotFoundException('Expense not found');
    }

    return this.transformExpense(expense);
  }

  /**
   * Update an expense
   */
  async update(id: number, userId: number, updateExpenseDto: UpdateExpenseDto) {
    // Verify expense exists and belongs to user
    await this.findOne(id, userId);

    // Verify category exists if categoryId is being updated
    if (updateExpenseDto.categoryId !== undefined) {
      const category = await this.prisma.expenseCategory.findUnique({
        where: { id: updateExpenseDto.categoryId },
      });

      if (!category) {
        throw new NotFoundException(`Category with ID ${updateExpenseDto.categoryId} not found`);
      }
    }

    const updateData: any = {};
    if (updateExpenseDto.title !== undefined) updateData.title = updateExpenseDto.title;
    if (updateExpenseDto.amount !== undefined) updateData.amount = updateExpenseDto.amount;
    if (updateExpenseDto.description !== undefined) updateData.description = updateExpenseDto.description;
    if (updateExpenseDto.date !== undefined) updateData.date = new Date(updateExpenseDto.date);
    if (updateExpenseDto.categoryId !== undefined) updateData.categoryId = updateExpenseDto.categoryId;

    const expense = await this.prisma.expense.update({
      where: { id },
      data: updateData,
      include: {
        category: true,
      },
    });

    return this.transformExpense(expense);
  }

  /**
   * Delete an expense
   */
  async remove(id: number, userId: number) {
    // Verify expense exists and belongs to user
    await this.findOne(id, userId);

    await this.prisma.expense.delete({
      where: { id },
    });

    return { message: 'Expense deleted successfully' };
  }
}
