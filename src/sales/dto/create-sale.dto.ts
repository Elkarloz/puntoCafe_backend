import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsIn,
  IsInt,
  IsMongoId,
  IsNumber,
  IsOptional,
  Min,
  ValidateNested,
} from 'class-validator';
import { PAYMENT_METHODS } from '../sale.schema';

export class SaleItemDto {
  @IsMongoId({ message: 'El producto no es válido' })
  productoId: string;

  @Type(() => Number)
  @IsInt({ message: 'La cantidad debe ser un número entero' })
  @Min(1, { message: 'La cantidad debe ser al menos 1' })
  cantidad: number;
}

export class CreateSaleDto {
  @IsIn(PAYMENT_METHODS, { message: 'Elige efectivo o transferencia' })
  metodoPago: (typeof PAYMENT_METHODS)[number];

  @IsArray()
  @ArrayMinSize(1, { message: 'Agrega al menos un producto' })
  @ValidateNested({ each: true })
  @Type(() => SaleItemDto)
  items: SaleItemDto[];

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'El monto recibido no es válido' })
  @Min(0, { message: 'El monto recibido no puede ser negativo' })
  montoRecibido?: number;
}
