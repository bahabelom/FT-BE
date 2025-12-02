import { IsNotEmpty, IsNumber, IsString, IsOptional, IsDateString, Min, IsInt, Min as MinValue } from 'class-validator';
import { Type } from 'class-transformer';

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

  @IsNotEmpty()
  @IsInt()
  @MinValue(1)
  @Type(() => Number)
  categoryId: number;

  @IsOptional()
  @IsString()
  description?: string;
}
