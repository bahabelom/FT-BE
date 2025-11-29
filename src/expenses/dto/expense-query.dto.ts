import { IsOptional, IsInt, IsDateString, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class ExpenseQueryDto {
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  categoryId?: number;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  userId?: number; // For owners to filter by employee

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  limit?: number = 10;
}



