import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type SaleDocument = HydratedDocument<Sale>;

export const PAYMENT_METHODS = ['efectivo', 'transferencia'] as const;

@Schema({ _id: false })
export class SaleItem {
  @Prop({ type: Types.ObjectId, ref: 'Product', required: true })
  productoId: Types.ObjectId;

  @Prop({ required: true })
  nombre: string;

  @Prop({ required: true, min: 1 })
  cantidad: number;

  @Prop({ required: true, min: 0 })
  precioUnitario: number;

  @Prop({ required: true, min: 0 })
  subtotal: number;
}

@Schema({ timestamps: true })
export class Sale {
  @Prop({ required: true, enum: PAYMENT_METHODS, type: String })
  metodoPago: (typeof PAYMENT_METHODS)[number];

  @Prop({ type: [SchemaFactory.createForClass(SaleItem)], required: true })
  items: SaleItem[];

  @Prop({ required: true, min: 0 })
  total: number;

  @Prop({ min: 0 })
  montoRecibido?: number;

  @Prop({ min: 0 })
  cambio?: number;
}

export const SaleSchema = SchemaFactory.createForClass(Sale);
