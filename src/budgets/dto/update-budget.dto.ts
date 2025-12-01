import { IsOptional, IsNumber, IsString, IsIn, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { BUDGET_PERIODS } from './create-budget.dto';

export class UpdateBudgetDto {
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  @Type(() => Number)
  amount?: number;

  @IsOptional()
  @IsString()
  @IsIn(BUDGET_PERIODS, {
    message: 'period must be one of: daily, weekly, monthly, yearly',
  })
  period?: string;
}




