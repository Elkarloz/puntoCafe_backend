import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { json, urlencoded } from 'express';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bodyParser: false });
  app.use(json({ limit: '2mb' }));
  app.use(urlencoded({ extended: true, limit: '2mb' }));
  const config = app.get(ConfigService);

  const extraOrigins = (config.get<string>('FRONTEND_ORIGIN') ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
  const origins = [
    'http://localhost:5173',
    'https://punto-cafe-frontend.vercel.app',
    ...extraOrigins,
  ];
  app.enableCors({
    origin: origins,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = Number(process.env.PORT ?? config.get<string>('PORT') ?? 2028);
  await app.listen(port);
  console.log(`API de Punto Caf� en http://localhost:${port}`);
}

bootstrap();
