import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ExpenseDto } from './dto/expense.dto';
import { Expense, ExpenseDocument } from './expense.schema';

@Injectable()
export class ExpensesService {
  constructor(@InjectModel(Expense.name) private readonly expenseModel: Model<Expense>) {}

  async findAll() {
    const expenses = await this.expenseModel.find().sort({ createdAt: -1 }).exec();
    return expenses.map((expense) => this.toResponse(expense as ExpenseDocument));
  }

  async create(dto: ExpenseDto) {
    const expense = await this.expenseModel.create({
      categoria: dto.categoria,
      concepto: dto.concepto.trim(),
      monto: dto.monto,
      ...(dto.productoId ? { productoId: dto.productoId } : {}),
      ...(dto.nota?.trim() ? { nota: dto.nota.trim() } : {}),
    });
    return this.toResponse(expense as ExpenseDocument);
  }

  async update(id: string, dto: ExpenseDto) {
    const expense = await this.expenseModel
      .findByIdAndUpdate(
        id,
        {
          categoria: dto.categoria,
          concepto: dto.concepto.trim(),
          monto: dto.monto,
          productoId: dto.productoId || undefined,
          nota: dto.nota?.trim() || undefined,
        },
        { new: true },
      )
      .exec();
    if (!expense) throw new NotFoundException('El gasto no existe');
    return this.toResponse(expense as ExpenseDocument);
  }

  async remove(id: string) {
    const result = await this.expenseModel.findByIdAndDelete(id).exec();
    if (!result) throw new NotFoundException('El gasto no existe');
    return { id };
  }

  private toResponse(expense: ExpenseDocument) {
    return {
      id: expense.id as string,
      categoria: expense.categoria,
      concepto: expense.concepto,
      monto: expense.monto,
      productoId: expense.productoId ? String(expense.productoId) : undefined,
      nota: expense.nota,
      createdAt: (expense as ExpenseDocument & { createdAt: Date }).createdAt,
      updatedAt: (expense as ExpenseDocument & { updatedAt: Date }).updatedAt,
    };
  }
}
