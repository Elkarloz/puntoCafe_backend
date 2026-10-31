import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ProductDocument = HydratedDocument<Product>;

export const PRODUCT_CATEGORIES = [
  'Café',
  'Jugos naturales',
  'Bebidas',
  'Fritos',
  'Mecato',
  'Dulces',
  'Lácteos',
  'Papelería',
  'Aseo',
  'Medicamentos',
] as const;

export const PRODUCT_SIZES = [
  'Mini',
  'Pequeño',
  'Personal',
  'Litro',
  'Litro y medio',
  'Dos litros',
] as const;

export const PRODUCT_PACKAGES = ['Botella', 'Vidrio', 'Lata', 'Caja'] as const;

@Schema({ timestamps: true })
export class Product {
  @Prop({ required: true, trim: true })
  nombre: string;

  @Prop({ required: true, enum: PRODUCT_CATEGORIES, type: String })
  categoria: (typeof PRODUCT_CATEGORIES)[number];

  @Prop({ default: '', trim: true })
  linea: string;

  @Prop({ default: '', enum: ['', ...PRODUCT_SIZES], type: String })
  tamano: '' | (typeof PRODUCT_SIZES)[number];

  @Prop({ default: '', enum: ['', ...PRODUCT_PACKAGES], type: String })
  envase: '' | (typeof PRODUCT_PACKAGES)[number];

  @Prop({ default: '' })
  fechaVencimiento: string;

  @Prop({ required: true, min: 0 })
  costo: number;

  @Prop({ required: true, min: 0 })
  precioVenta: number;

  @Prop({ required: true, min: 0 })
  stock: number;

  @Prop({ required: true, min: 1 })
  stockMaximo: number;

  @Prop({ required: true, min: 0 })
  stockMinimo: number;

  @Prop({ default: '' })
  imagen: string;
}

export const ProductSchema = SchemaFactory.createForClass(Product);
