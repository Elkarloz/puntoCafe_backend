import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { AuthUser } from './auth.types';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async login(dto: LoginDto): Promise<{ accessToken: string; user: AuthUser }> {
    const user = await this.usersService.findByEmail(dto.email);
    const passwordOk = user
      ? await bcrypt.compare(dto.password, user.passwordHash)
      : false;

    if (!user || !passwordOk) {
      throw new UnauthorizedException('Correo o contraseña incorrectos');
    }

    const authUser: AuthUser = {
      id: user._id.toString(),
      email: user.email,
      nombre: user.nombre,
    };

    const accessToken = await this.jwtService.signAsync({
      sub: authUser.id,
      email: authUser.email,
    });

    return { accessToken, user: authUser };
  }
}
