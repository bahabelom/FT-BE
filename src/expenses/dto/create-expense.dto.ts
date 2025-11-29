import { IsNotEmpty, IsNumber, IsString, IsOptional, IsDateString, Min, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

export const EXPENSE_CATEGORIES = [
  'Food',
  'Transport',
  'Entertainment',
  'Bills',
  'Shopping',
  'Health',
  'Education',
  'Other',
] as const;

export type ExpenseCategory = typeof EXPENSE_CATEGORIES[number];

export class CreateExpenseDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsNotEmpty()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  @Type(() => Number)
  amount: number;

  @IsNotEmpty()
  @IsDateString()
  date: string; // ISO 8601 format

  @IsString()
  @IsNotEmpty()
  @IsIn(EXPENSE_CATEGORIES, {
    message: 'category must be one of: Food, Transport, Entertainment, Bills, Shopping, Health, Education, Other',
  })
  category: ExpenseCategory;

  @IsOptional()
  @IsString()
  description?: string;
}
