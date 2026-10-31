import { Type } from 'class-transformer';
import {
  IsIn,
  IsMongoId,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';
import { EXPENSE_CATEGORIES } from '../expense.schema';

export class ExpenseDto {
  @IsIn(EXPENSE_CATEGORIES, { message: 'Elige un tipo de gasto válido' })
  categoria: (typeof EXPENSE_CATEGORIES)[number];

  @IsString()
  @MinLength(2, { message: 'El concepto es muy corto' })
  concepto: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'El monto no es válido' })
  @Min(0, { message: 'El monto no puede ser negativo' })
  monto: number;

  @IsOptional()
  @IsMongoId({ message: 'El producto no es válido' })
  productoId?: string;

  @IsOptional()
  @IsString()
  nota?: string;
}
