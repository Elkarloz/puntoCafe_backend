import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './auth/auth.module';
import { ExpensesModule } from './expenses/expenses.module';
import { ProductsModule } from './products/products.module';
import { SalesModule } from './sales/sales.module';
import { StatusController } from './status.controller';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const uri =
          config.get<string>('MONGODB_URI') ??
          (process.env.VERCEL ? undefined : 'mongodb://localhost:27017/cafeteria');
        if (!uri) {
          throw new Error('Falta MONGODB_URI en las variables de entorno de Vercel');
        }
        return {
          uri,
          serverSelectionTimeoutMS: 5000,
        };
      },
    }),
    UsersModule,
    AuthModule,
    ProductsModule,
    SalesModule,
    ExpensesModule,
  ],
  controllers: [StatusController],
})
export class AppModule {}
