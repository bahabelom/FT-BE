import { IsOptional, IsNumber, IsString, IsDateString, Min, IsInt, Min as MinValue } from 'class-validator';
import { Type } from 'class-transformer';

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
  @IsInt()
  @MinValue(1)
  @Type(() => Number)
  categoryId?: number;

  @IsOptional()
  @IsString()
  description?: string;
}
