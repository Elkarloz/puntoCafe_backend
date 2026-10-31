import { config } from 'dotenv';
import mongoose from 'mongoose';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env') });

const base = process.env.API_URL || 'http://localhost:3000';
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/cafeteria';

async function json(path, options = {}) {
  const response = await fetch(`${base}${path}`, options);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(`${options.method || 'GET'} ${path}: ${JSON.stringify(data)}`);
  }
  return data;
}

function atHour(hour, minute = 10) {
  const date = new Date();
  date.setHours(hour, minute, 0, 0);
  return date;
}

async function main() {
  const login = await json('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: process.env.ADMIN_EMAIL || 'admin@puntocafe.local',
      password: process.env.ADMIN_PASSWORD || 'CafeAdmin2026',
    }),
  });

  const headers = {
    Authorization: `Bearer ${login.accessToken}`,
    'Content-Type': 'application/json',
  };

  let products = await json('/productos', { headers });
  if (!products.length) throw new Error('No hay productos. Crea algunos primero.');

  await mongoose.connect(mongoUri);
  const db = mongoose.connection.db;

  // Reponer stock para poder vender datos de prueba.
  await db.collection('products').updateMany({}, { $set: { stock: 40 } });
  products = await json('/productos', { headers });

  const byName = (name) => products.find((p) => p.nombre.toLowerCase() === name.toLowerCase());
  const pick = (...names) => {
    for (const name of names) {
      const found = byName(name);
      if (found) return found;
    }
    return products[Math.floor(Math.random() * products.length)];
  };

  const capuchino = pick('Capuchino', 'Coffee Latte', 'Café');
  const brownie = pick('Brownie', 'Cheesecake', 'Croissant');
  const jugo = pick('Jugo de naranja', 'Limonada', 'Cocacola');
  const latte = pick('Latte', 'Coffee Latte', 'Chocolate');
  const agua = pick('Agua 600ml', 'Croissant', 'Malteada');
  const caramel = pick('Caramel Frappuccino', 'Frappé', 'Malteada', latte.nombre);

  const catalog = [capuchino, brownie, jugo, latte, agua, caramel];
  const salePlans = [];
  for (let hour = 8; hour <= 18; hour += 1) {
    for (const minute of [5, 20, 40]) {
      const productA = catalog[(hour + minute) % catalog.length];
      const productB = catalog[(hour + minute + 2) % catalog.length];
      salePlans.push({
        hour,
        minute,
        metodoPago: minute === 20 ? 'transferencia' : 'efectivo',
        items: [
          { productoId: productA.id, cantidad: 1 + ((hour + minute) % 3) },
          ...(minute === 40 ? [{ productoId: productB.id, cantidad: 1 }] : []),
        ],
      });
    }
  }

  const saleIds = [];
  for (const plan of salePlans) {
    const total = plan.items.reduce((sum, item) => {
      const product = products.find((p) => p.id === item.productoId);
      return sum + (product?.precioVenta ?? 0) * item.cantidad;
    }, 0);
    const payload = {
      metodoPago: plan.metodoPago,
      items: plan.items,
      ...(plan.metodoPago === 'efectivo' ? { montoRecibido: total + 2000 } : {}),
    };
    const created = await json('/ventas', { method: 'POST', headers, body: JSON.stringify(payload) });
    saleIds.push({ id: created.id, hour: plan.hour, minute: plan.minute });
  }

  const expensePlans = [
    { hour: 8, minute: 50, categoria: 'materia-prima', concepto: 'Leche entera', monto: 48000, nota: '12 Lt' },
    { hour: 9, minute: 30, categoria: 'empaques', concepto: 'Tapas vasos', monto: 22000, nota: '200 uds' },
    { hour: 10, minute: 15, categoria: 'materia-prima', concepto: 'Café molido', monto: 65000, nota: '3 Lb' },
    { hour: 11, minute: 45, categoria: 'servicios', concepto: 'Gas natural', monto: 38000 },
    { hour: 12, minute: 20, categoria: 'pago-empleados', concepto: 'Turno mañana', monto: 85000 },
    { hour: 13, minute: 40, categoria: 'servicios', concepto: 'Internet local', monto: 95000 },
    { hour: 14, minute: 10, categoria: 'empaques', concepto: 'Servilletas', monto: 18000 },
    { hour: 15, minute: 25, categoria: 'materia-prima', concepto: 'Azúcar', monto: 21000 },
    { hour: 16, minute: 50, categoria: 'arriendo', concepto: 'Abono arriendo', monto: 250000 },
    { hour: 17, minute: 35, categoria: 'pago-empleados', concepto: 'Turno tarde', monto: 90000 },
  ];

  const expenseIds = [];
  for (const plan of expensePlans) {
    const created = await json('/gastos', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        categoria: plan.categoria,
        concepto: plan.concepto,
        monto: plan.monto,
        ...(plan.nota ? { nota: plan.nota } : {}),
      }),
    });
    expenseIds.push({ id: created.id, hour: plan.hour, minute: plan.minute });
  }

  for (const sale of saleIds) {
    await db.collection('sales').updateOne(
      { _id: new mongoose.Types.ObjectId(sale.id) },
      { $set: { createdAt: atHour(sale.hour, sale.minute), updatedAt: atHour(sale.hour, sale.minute) } },
    );
  }

  for (const expense of expenseIds) {
    await db.collection('expenses').updateOne(
      { _id: new mongoose.Types.ObjectId(expense.id) },
      {
        $set: {
          createdAt: atHour(expense.hour, expense.minute),
          updatedAt: atHour(expense.hour, expense.minute),
        },
      },
    );
  }

  // Asegura un par de productos en stock bajo para la gráfica de reponer.
  const lowTargets = [brownie, caramel].filter(Boolean);
  for (const product of lowTargets) {
    await db.collection('products').updateOne(
      { _id: new mongoose.Types.ObjectId(product.id) },
      { $set: { stock: Math.min(product.stockMinimo ?? 2, 1) } },
    );
  }

  await mongoose.disconnect();

  console.log(`Listo: ${saleIds.length} ventas y ${expenseIds.length} gastos de HOY (repartidos por horas).`);
  console.log('Recarga el dashboard con filtro "Hoy" para ver las gráficas.');
}

main().catch(async (error) => {
  console.error(error.message || error);
  try {
    await mongoose.disconnect();
  } catch {
    // ignore
  }
  process.exit(1);
});
