import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { Model } from 'mongoose';
import { User, UserDocument } from './user.schema';

export interface AdminInput {
  email: string;
  password: string;
  nombre: string;
}

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private readonly userModel: Model<User>) {}

  findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel
      .findOne({ email: email.trim().toLowerCase() })
      .select('+passwordHash')
      .exec();
  }

  findById(id: string): Promise<UserDocument | null> {
    return this.userModel.findById(id).exec();
  }

  /**
   * Deja un solo administrador: borra el resto y crea o actualiza el indicado.
   * Así `npm run seed` se puede volver a ejecutar sin cuentas viejas.
   */
  async upsertAdmin(input: AdminInput): Promise<{ email: string; created: boolean }> {
    const email = input.email.trim().toLowerCase();
    const nombre = input.nombre.trim();
    const passwordHash = await bcrypt.hash(input.password, 10);

    await this.userModel.deleteMany({ email: { $ne: email } }).exec();

    const existing = await this.userModel.findOne({ email }).select('+passwordHash').exec();
    if (existing) {
      existing.passwordHash = passwordHash;
      existing.nombre = nombre;
      await existing.save();
      return { email, created: false };
    }

    await this.userModel.create({ email, passwordHash, nombre });
    return { email, created: true };
  }
}
