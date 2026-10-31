import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ExpenseDocument = HydratedDocument<Expense>;

export const EXPENSE_CATEGORIES = [
  'compra-productos',
  'retiro-dinero',
  'materia-prima',
  'caja-menor',
  'pago-empleados',
  'empaques',
  'arriendo',
  'servicios',
] as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

@Schema({ timestamps: true })
export class Expense {
  @Prop({ required: true, enum: EXPENSE_CATEGORIES, type: String })
  categoria: ExpenseCategory;

  @Prop({ required: true, trim: true })
  concepto: string;

  @Prop({ required: true, min: 0 })
  monto: number;

  @Prop({ type: Types.ObjectId, ref: 'Product' })
  productoId?: Types.ObjectId;

  @Prop({ trim: true })
  nota?: string;
}

export const ExpenseSchema = SchemaFactory.createForClass(Expense);
