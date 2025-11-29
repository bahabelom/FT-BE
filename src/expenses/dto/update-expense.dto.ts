import { PartialType } from '@nestjs/mapped-types';
import { CreateExpenseDto } from './create-expense.dto';
import { IsOptional, IsNumber, IsString, IsDateString, Min, IsIn } from 'class-validator';
import { Type } from 'class-transformer';
import { EXPENSE_CATEGORIES } from './create-expense.dto';

export class UpdateExpenseDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  @Type(() => Number)
  amount?: number;

  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsString()
  @IsIn(EXPENSE_CATEGORIES, {
    message: 'category must be one of: Food, Transport, Entertainment, Bills, Shopping, Health, Education, Other',
  })
  category?: string;

  @IsOptional()
  @IsString()
  description?: string;
}
