import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ProductDto, UpdateStockDto } from './dto/product.dto';
import { Product, ProductDocument } from './product.schema';

export interface ProductView {
  id: string;
  nombre: string;
  categoria: Product['categoria'];
  linea: string;
  tamano: Product['tamano'];
  envase: Product['envase'];
  fechaVencimiento: string;
  costo: number;
  precioVenta: number;
  stock: number;
  stockMaximo: number;
  stockMinimo: number;
  imagen: string;
  updatedAt: string;
}

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Product.name) private readonly productModel: Model<Product>,
  ) {}

  async findAll(): Promise<ProductView[]> {
    const products = await this.productModel
      .find()
      .collation({ locale: 'es', strength: 1 })
      .sort({ nombre: 1 })
      .exec();
    return products.map((product) => this.toView(product));
  }

  async create(dto: ProductDto): Promise<ProductView> {
    const product = await this.productModel.create(this.toDocument(dto));
    return this.toView(product);
  }

  async update(id: string, dto: ProductDto): Promise<ProductView> {
    const product = await this.productModel
      .findByIdAndUpdate(id, this.toDocument(dto), { new: true })
      .exec();
    if (!product) {
      throw new NotFoundException('Producto no encontrado');
    }
    return this.toView(product);
  }

  async updateStock(id: string, dto: UpdateStockDto): Promise<ProductView> {
    const product = await this.productModel
      .findByIdAndUpdate(id, { stock: dto.stock }, { new: true })
      .exec();
    if (!product) {
      throw new NotFoundException('Producto no encontrado');
    }
    return this.toView(product);
  }

  async remove(id: string): Promise<void> {
    const result = await this.productModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException('Producto no encontrado');
    }
  }

  private toDocument(dto: ProductDto) {
    if (dto.stockMinimo > dto.stockMaximo) {
      throw new BadRequestException('El stock mínimo no puede ser mayor que el máximo');
    }

    return {
      nombre: dto.nombre.trim(),
      categoria: dto.categoria,
      linea: dto.linea?.trim() ?? '',
      tamano: dto.tamano ?? '',
      envase: dto.envase ?? '',
      fechaVencimiento: dto.fechaVencimiento ?? '',
      costo: dto.costo,
      precioVenta: dto.precioVenta,
      stock: dto.stock,
      stockMaximo: dto.stockMaximo,
      stockMinimo: dto.stockMinimo,
      imagen: dto.imagen ?? '',
    };
  }

  private toView(product: ProductDocument): ProductView {
    const updatedAt = product.get('updatedAt') as Date;
    return {
      id: product._id.toString(),
      nombre: product.nombre,
      categoria: product.categoria,
      linea: product.linea,
      tamano: product.tamano ?? '',
      envase: product.envase ?? '',
      fechaVencimiento: product.fechaVencimiento ?? '',
      costo: product.costo,
      precioVenta: product.precioVenta,
      stock: product.stock,
      stockMaximo: product.stockMaximo,
      stockMinimo: product.stockMinimo,
      imagen: product.imagen,
      updatedAt: updatedAt.toISOString(),
    };
  }
}
