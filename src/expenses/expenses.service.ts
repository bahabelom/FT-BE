import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { ExpenseQueryDto } from './dto/expense-query.dto';
import { Role } from '../common/enums/role.enum';

@Injectable()
export class ExpensesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new expense
   * Users can only create expenses for themselves
   * Owners can create expenses for themselves or their employees
   */
  async create(
    userId: number,
    userRole: Role,
    createExpenseDto: CreateExpenseDto,
    targetUserId?: number,
  ) {
    // Determine the actual user ID for the expense
    const expenseUserId = targetUserId || userId;

    // If trying to create for another user, verify permissions
    if (expenseUserId !== userId) {
      // Only OWNER or ADMIN can create expenses for other users
      if (userRole !== Role.OWNER && userRole !== Role.ADMIN) {
        throw new ForbiddenException('You can only create expenses for yourself');
      }
      // Verify the target user is an employee of the owner
      await this.verifyOwnership(userId, expenseUserId);
    }

    // Verify category exists
    const category = await this.prisma.expenseCategory.findUnique({
      where: { id: createExpenseDto.categoryId },
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${createExpenseDto.categoryId} not found`);
    }

    return await this.prisma.expense.create({
      data: {
        amount: createExpenseDto.amount,
        description: createExpenseDto.description,
        date: createExpenseDto.date ? new Date(createExpenseDto.date) : new Date(),
        categoryId: createExpenseDto.categoryId,
        receiptUrl: createExpenseDto.receiptUrl,
        userId: expenseUserId,
      },
      include: {
        category: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  /**
   * Find all expenses with filtering
   * Owners can see all expenses (their own + employees)
   * Regular users can only see their own expenses
   */
  async findAll(userId: number, userRole: Role, query: ExpenseQueryDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { 
        employees: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Build where clause based on user role
    const where: any = {};

    if (userRole === Role.OWNER || userRole === Role.ADMIN) {
      // Owners can see their own expenses + all employees' expenses
      const employeeIds = (user.employees || []).map((emp: { id: number }) => emp.id);
      where.userId = {
        in: [userId, ...employeeIds],
      };
    } else {
      // Regular users can only see their own expenses
      where.userId = userId;
    }

    // Apply filters
    if (query.categoryId) {
      where.categoryId = query.categoryId;
    }

    if (query.startDate || query.endDate) {
      where.date = {};
      if (query.startDate) {
        where.date.gte = new Date(query.startDate);
      }
      if (query.endDate) {
        where.date.lte = new Date(query.endDate);
      }
    }

    if (query.userId && (userRole === Role.OWNER || userRole === Role.ADMIN)) {
      // Verify the requested user is an employee
      const isEmployee = (user.employees || []).some((emp: { id: number }) => emp.id === query.userId);
      if (isEmployee || query.userId === userId) {
        where.userId = query.userId;
      } else {
        throw new ForbiddenException('You can only view expenses for yourself or your employees');
      }
    }

    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const [expenses, total] = await Promise.all([
      this.prisma.expense.findMany({
        where,
        include: {
          category: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { date: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.expense.count({ where }),
    ]);

    return {
      data: expenses,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Find a single expense by ID
   * Users can only view their own expenses
   * Owners can view their own expenses + employees' expenses
   */
  async findOne(id: number, userId: number, userRole: Role) {
    const expense = await this.prisma.expense.findUnique({
      where: { id },
      include: {
        category: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!expense) {
      throw new NotFoundException(`Expense with ID ${id} not found`);
    }

    // Check access permissions
    if (expense.userId !== userId) {
      if (userRole === Role.OWNER || userRole === Role.ADMIN) {
        // Verify ownership
        await this.verifyOwnership(userId, expense.userId);
      } else {
        throw new ForbiddenException('You can only view your own expenses');
      }
    }

    return expense;
  }

  /**
   * Update an expense
   * Users can only update their own expenses
   * Owners can update their own expenses + employees' expenses
   */
  async update(id: number, userId: number, userRole: Role, updateExpenseDto: UpdateExpenseDto) {
    const expense = await this.findOne(id, userId, userRole);

    // If category is being updated, verify it exists
    if (updateExpenseDto.categoryId) {
      const category = await this.prisma.expenseCategory.findUnique({
        where: { id: updateExpenseDto.categoryId },
      });

      if (!category) {
        throw new NotFoundException(`Category with ID ${updateExpenseDto.categoryId} not found`);
      }
    }

    return await this.prisma.expense.update({
      where: { id },
      data: {
        ...updateExpenseDto,
        date: updateExpenseDto.date ? new Date(updateExpenseDto.date) : undefined,
      },
      include: {
        category: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  /**
   * Delete an expense
   * Users can only delete their own expenses
   * Owners can delete their own expenses + employees' expenses
   */
  async remove(id: number, userId: number, userRole: Role) {
    await this.findOne(id, userId, userRole); // This will check permissions

    await this.prisma.expense.delete({
      where: { id },
    });
  }

  /**
   * Get expense statistics/summary
   * Owners get stats for themselves + all employees
   * Regular users get stats only for themselves
   */
  async getStatistics(userId: number, userRole: Role, startDate?: string, endDate?: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { 
        employees: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const where: any = {};

    if (userRole === Role.OWNER || userRole === Role.ADMIN) {
      const employeeIds = (user.employees || []).map((emp: { id: number }) => emp.id);
      where.userId = {
        in: [userId, ...employeeIds],
      };
    } else {
      where.userId = userId;
    }

    if (startDate || endDate) {
      where.date = {};
      if (startDate) {
        where.date.gte = new Date(startDate);
      }
      if (endDate) {
        where.date.lte = new Date(endDate);
      }
    }

    const expenses = await this.prisma.expense.findMany({
      where,
      include: {
        category: true,
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    const totalAmount = expenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
    const categoryBreakdown = expenses.reduce((acc, expense) => {
      const categoryName = expense.category.name;
      if (!acc[categoryName]) {
        acc[categoryName] = { category: categoryName, amount: 0, count: 0 };
      }
      acc[categoryName].amount += Number(expense.amount);
      acc[categoryName].count += 1;
      return acc;
    }, {} as Record<string, { category: string; amount: number; count: number }>);

    const userBreakdown = expenses.reduce((acc, expense) => {
      const userName = expense.user.name;
      if (!acc[userName]) {
        acc[userName] = { user: userName, amount: 0, count: 0 };
      }
      acc[userName].amount += Number(expense.amount);
      acc[userName].count += 1;
      return acc;
    }, {} as Record<string, { user: string; amount: number; count: number }>);

    return {
      totalAmount,
      totalCount: expenses.length,
      categoryBreakdown: Object.values(categoryBreakdown),
      userBreakdown: Object.values(userBreakdown),
      period: {
        startDate: startDate || null,
        endDate: endDate || null,
      },
    };
  }

  /**
   * Verify that a user is the owner of another user
   */
  private async verifyOwnership(ownerId: number, employeeId: number): Promise<void> {
    const employee = await this.prisma.user.findUnique({
      where: { id: employeeId },
    });

    if (!employee) {
      throw new NotFoundException(`User with ID ${employeeId} not found`);
    }

    // Type assertion: ownerId exists on User model but may not be in inferred type
    const employeeWithOwner = employee as typeof employee & { ownerId: number | null };
    if (employeeWithOwner.ownerId !== ownerId) {
      throw new ForbiddenException('You can only manage expenses for your own employees');
    }
  }
}

