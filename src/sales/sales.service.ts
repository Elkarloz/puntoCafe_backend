import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Product } from '../products/product.schema';
import { CreateSaleDto } from './dto/create-sale.dto';
import { Sale, SaleDocument } from './sale.schema';

@Injectable()
export class SalesService {
  constructor(
    @InjectModel(Sale.name) private readonly saleModel: Model<Sale>,
    @InjectModel(Product.name) private readonly productModel: Model<Product>,
  ) {}

  async create(dto: CreateSaleDto) {
    const quantities = new Map<string, number>();
    for (const item of dto.items) {
      quantities.set(item.productoId, (quantities.get(item.productoId) ?? 0) + item.cantidad);
    }

    const products = await this.productModel
      .find({ _id: { $in: [...quantities.keys()] } })
      .exec();
    if (products.length !== quantities.size) {
      throw new BadRequestException('Hay un producto que ya no existe');
    }

    const lines = products.map((product) => {
      const cantidad = quantities.get(product.id) ?? 0;
      if (cantidad > product.stock) {
        throw new BadRequestException(`No hay suficiente stock de ${product.nombre}`);
      }
      return {
        productoId: product._id,
        nombre: product.nombre,
        cantidad,
        precioUnitario: product.precioVenta,
        subtotal: product.precioVenta * cantidad,
      };
    });

    const applied: { id: string; cantidad: number }[] = [];
    try {
      for (const line of lines) {
        const result = await this.productModel
          .updateOne(
            { _id: line.productoId, stock: { $gte: line.cantidad } },
            { $inc: { stock: -line.cantidad } },
          )
          .exec();
        if (result.modifiedCount !== 1) {
          throw new BadRequestException(`No hay suficiente stock de ${line.nombre}`);
        }
        applied.push({ id: String(line.productoId), cantidad: line.cantidad });
      }

      const total = lines.reduce((sum, line) => sum + line.subtotal, 0);
      const montoRecibido =
        dto.metodoPago === 'efectivo' && dto.montoRecibido != null
          ? dto.montoRecibido
          : undefined;
      if (dto.metodoPago === 'efectivo' && (montoRecibido == null || montoRecibido < total)) {
        throw new BadRequestException('El monto recibido no cubre el total');
      }
      const cambio = montoRecibido != null ? Math.max(0, montoRecibido - total) : undefined;

      const sale = await this.saleModel.create({
        metodoPago: dto.metodoPago,
        items: lines,
        total,
        ...(montoRecibido != null ? { montoRecibido, cambio } : {}),
      });

      return this.toResponse(sale as SaleDocument);
    } catch (error) {
      for (const item of applied) {
        await this.productModel.updateOne({ _id: item.id }, { $inc: { stock: item.cantidad } }).exec();
      }
      throw error;
    }
  }

  async findAll() {
    const sales = await this.saleModel.find().sort({ createdAt: -1 }).exec();
    return sales.map((sale) => this.toResponse(sale as SaleDocument));
  }

  async remove(id: string) {
    const sale = await this.saleModel.findById(id).exec();
    if (!sale) {
      throw new NotFoundException('La venta no existe');
    }

    for (const item of sale.items) {
      await this.productModel
        .updateOne({ _id: item.productoId }, { $inc: { stock: item.cantidad } })
        .exec();
    }

    await this.saleModel.deleteOne({ _id: id }).exec();
    return { id };
  }

  private toResponse(sale: SaleDocument) {
    return {
      id: sale.id as string,
      metodoPago: sale.metodoPago,
      total: sale.total,
      montoRecibido: sale.montoRecibido,
      cambio: sale.cambio,
      items: sale.items.map((item) => ({
        productoId: String(item.productoId),
        nombre: item.nombre,
        cantidad: item.cantidad,
        precioUnitario: item.precioUnitario,
        subtotal: item.subtotal,
      })),
      createdAt: (sale as SaleDocument & { createdAt: Date }).createdAt,
    };
  }
}
