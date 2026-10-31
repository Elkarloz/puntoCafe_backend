import { Type } from 'class-transformer';
import { IsDateString, IsIn, IsInt, IsOptional, IsString, Min, MinLength } from 'class-validator';
import { PRODUCT_CATEGORIES, PRODUCT_PACKAGES, PRODUCT_SIZES } from '../product.schema';

export class ProductDto {
  @IsString()
  @MinLength(1, { message: 'El nombre es obligatorio' })
  nombre: string;

  @IsIn(PRODUCT_CATEGORIES, { message: 'Elige una categoría válida' })
  categoria: (typeof PRODUCT_CATEGORIES)[number];

  @IsOptional()
  @IsString()
  linea?: string;

  @IsOptional()
  @IsIn(['', ...PRODUCT_SIZES], { message: 'Elige un tamaño válido' })
  tamano?: '' | (typeof PRODUCT_SIZES)[number];

  @IsOptional()
  @IsIn(['', ...PRODUCT_PACKAGES], { message: 'Elige un envase válido' })
  envase?: '' | (typeof PRODUCT_PACKAGES)[number];

  @IsOptional()
  @IsDateString({}, { message: 'La fecha de vencimiento no es válida' })
  fechaVencimiento?: string;

  @Type(() => Number)
  @IsInt({ message: 'El costo debe ser un número entero' })
  @Min(0, { message: 'El costo no puede ser negativo' })
  costo: number;

  @Type(() => Number)
  @IsInt({ message: 'El precio de venta debe ser un número entero' })
  @Min(0, { message: 'El precio de venta no puede ser negativo' })
  precioVenta: number;

  @Type(() => Number)
  @IsInt({ message: 'El stock debe ser un número entero' })
  @Min(0, { message: 'El stock no puede ser negativo' })
  stock: number;

  @Type(() => Number)
  @IsInt({ message: 'El stock máximo debe ser un número entero' })
  @Min(1, { message: 'El stock máximo debe ser al menos 1' })
  stockMaximo: number;

  @Type(() => Number)
  @IsInt({ message: 'El stock mínimo debe ser un número entero' })
  @Min(0, { message: 'El stock mínimo no puede ser negativo' })
  stockMinimo: number;

  @IsOptional()
  @IsString()
  imagen?: string;
}

export class UpdateStockDto {
  @Type(() => Number)
  @IsInt({ message: 'La cantidad debe ser un número entero' })
  @Min(0, { message: 'La cantidad no puede ser negativa' })
  stock: number;
}
