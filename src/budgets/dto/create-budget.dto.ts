import { IsNotEmpty, IsNumber, IsOptional, IsString, IsIn, Min } from 'class-validator';
import { Type } from 'class-transformer';

export const BUDGET_PERIODS = ['daily', 'weekly', 'monthly', 'yearly'] as const;
export type BudgetPeriod = typeof BUDGET_PERIODS[number];

export class CreateBudgetDto {
  @IsNotEmpty()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  @Type(() => Number)
  amount: number;

  @IsOptional()
  @IsString()
  @IsIn(BUDGET_PERIODS, {
    message: 'period must be one of: daily, weekly, monthly, yearly',
  })
  period?: BudgetPeriod;
}

