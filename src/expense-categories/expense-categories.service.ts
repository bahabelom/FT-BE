import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateExpenseCategoryDto } from './dto/create-expense-category.dto';
import { UpdateExpenseCategoryDto } from './dto/update-expense-category.dto';

@Injectable()
export class ExpenseCategoriesService {
  constructor(private prisma: PrismaService) {}

  async create(createExpenseCategoryDto: CreateExpenseCategoryDto) {
    // Check if category with same name already exists
    const existing = await this.prisma.expenseCategory.findUnique({
      where: { name: createExpenseCategoryDto.name },
    });

    if (existing) {
      throw new ConflictException(`Category with name "${createExpenseCategoryDto.name}" already exists`);
    }

    return await this.prisma.expenseCategory.create({
      data: createExpenseCategoryDto,
    });
  }

  async findAll() {
    return await this.prisma.expenseCategory.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: {
            expenses: true,
          },
        },
      },
    });
  }

  async findOne(id: number) {
    const category = await this.prisma.expenseCategory.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            expenses: true,
          },
        },
      },
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    return category;
  }

  async update(id: number, updateExpenseCategoryDto: UpdateExpenseCategoryDto) {
    await this.findOne(id); // Verify category exists

    // If name is being updated, check for conflicts
    if (updateExpenseCategoryDto.name) {
      const existing = await this.prisma.expenseCategory.findUnique({
        where: { name: updateExpenseCategoryDto.name },
      });

      if (existing && existing.id !== id) {
        throw new ConflictException(`Category with name "${updateExpenseCategoryDto.name}" already exists`);
      }
    }

    return await this.prisma.expenseCategory.update({
      where: { id },
      data: updateExpenseCategoryDto,
    });
  }

  async remove(id: number) {
    const category = await this.findOne(id);

    // Check if category is being used by any expenses
    const expenseCount = await this.prisma.expense.count({
      where: { categoryId: id },
    });

    if (expenseCount > 0) {
      throw new ConflictException(
        `Cannot delete category. It is being used by ${expenseCount} expense(s). Please reassign or delete those expenses first.`,
      );
    }

    await this.prisma.expenseCategory.delete({
      where: { id },
    });
  }
}


