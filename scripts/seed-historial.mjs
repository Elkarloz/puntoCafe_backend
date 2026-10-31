const base = process.env.API_URL || 'http://localhost:3000';

async function json(path, options = {}) {
  const response = await fetch(`${base}${path}`, options);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(`${options.method || 'GET'} ${path}: ${JSON.stringify(data)}`);
  }
  return data;
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

  const products = await json('/productos', { headers });
  if (!products.length) throw new Error('No hay productos. Crea algunos primero.');

  const byName = (name) => products.find((p) => p.nombre.toLowerCase() === name.toLowerCase());
  const pick = (...names) => {
    for (const name of names) {
      const found = byName(name);
      if (found) return found;
    }
    return products[0];
  };

  const a = pick('Capuchino', 'Coffee Latte', 'Café');
  const b = pick('Brownie', 'Cheesecake', 'Croissant');
  const c = pick('Jugo de naranja', 'Limonada', 'Cocacola');
  const d = pick('Latte', 'Coffee Latte', 'Chocolate');
  const e = pick('Agua 600ml', 'Croissant', 'Malteada');

  const sales = [
    {
      metodoPago: 'efectivo',
      items: [
        { productoId: a.id, cantidad: 2 },
        { productoId: b.id, cantidad: 1 },
      ],
    },
    {
      metodoPago: 'transferencia',
      items: [
        { productoId: d.id, cantidad: 1 },
        { productoId: c.id, cantidad: 1 },
      ],
    },
    {
      metodoPago: 'efectivo',
      items: [
        { productoId: e.id, cantidad: 2 },
        { productoId: a.id, cantidad: 1 },
      ],
    },
    {
      metodoPago: 'transferencia',
      items: [{ productoId: b.id, cantidad: 2 }],
    },
  ];

  let saleCount = 0;
  for (const sale of sales) {
    const total = sale.items.reduce((sum, item) => {
      const product = products.find((p) => p.id === item.productoId);
      return sum + (product?.precioVenta ?? 0) * item.cantidad;
    }, 0);
    const payload = {
      ...sale,
      ...(sale.metodoPago === 'efectivo' ? { montoRecibido: total + 5000 } : {}),
    };
    await json('/ventas', { method: 'POST', headers, body: JSON.stringify(payload) });
    saleCount += 1;
  }

  const expenses = [
    { categoria: 'materia-prima', concepto: 'Café molido', monto: 90000, nota: '5 Lb · $18.000/Lb' },
    { categoria: 'materia-prima', concepto: 'Azúcar', monto: 16000, nota: '5 Lb · $3.200/Lb' },
    { categoria: 'empaques', concepto: 'Vasos 12 oz', monto: 45000, nota: '250 uds · $180/uds' },
    { categoria: 'pago-empleados', concepto: 'Quincena barista', monto: 600000 },
    { categoria: 'servicios', concepto: 'Energía', monto: 180000 },
    { categoria: 'arriendo', concepto: 'Arriendo local', monto: 1500000 },
    {
      categoria: 'compra-productos',
      concepto: `Compra ${a.nombre}`,
      monto: a.costo * 10,
      productoId: a.id,
      nota: `10 uds · costo general $${(a.costo * 10).toLocaleString('es-CO')}`,
    },
    {
      categoria: 'compra-productos',
      concepto: `Compra ${e.nombre}`,
      monto: e.costo * 20,
      productoId: e.id,
      nota: `20 uds · costo general $${(e.costo * 20).toLocaleString('es-CO')}`,
    },
  ];

  let expenseCount = 0;
  for (const expense of expenses) {
    await json('/gastos', { method: 'POST', headers, body: JSON.stringify(expense) });
    expenseCount += 1;
  }

  const ventas = await json('/ventas', { headers });
  const gastos = await json('/gastos', { headers });
  console.log(`Listo: ${saleCount} ventas y ${expenseCount} gastos de prueba.`);
  console.log(`Totales actuales → ventas=${ventas.length} gastos=${gastos.length}`);
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
