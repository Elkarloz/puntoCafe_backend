import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { UsersService } from './users/users.service';

function requiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Falta ${name} en backend/.env`);
  }
  return value;
}

/**
 * Crea (o actualiza) el único usuario administrador a partir de las
 * variables ADMIN_EMAIL, ADMIN_PASSWORD y ADMIN_NOMBRE.
 */
async function seed() {
  const email = requiredEnv('ADMIN_EMAIL');
  const password = requiredEnv('ADMIN_PASSWORD');
  const nombre = process.env.ADMIN_NOMBRE?.trim() || 'Administrador';

  const app = await NestFactory.createApplicationContext(AppModule);
  try {
    const users = app.get(UsersService);
    const result = await users.upsertAdmin({ email, password, nombre });
    const action = result.created ? 'creado' : 'actualizado';
    console.log(`Usuario administrador ${action}: ${result.email}`);
  } finally {
    await app.close();
  }
}

seed().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
