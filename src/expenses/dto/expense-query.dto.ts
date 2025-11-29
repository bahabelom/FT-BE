import { IsOptional, IsIn } from 'class-validator';

export class ExpenseQueryDto {
  @IsOptional()
  @IsIn(['daily', 'weekly', 'monthly', 'yearly'], {
    message: 'period must be one of: daily, weekly, monthly, yearly',
  })
  period?: 'daily' | 'weekly' | 'monthly' | 'yearly';
}
