const base = process.env.API_URL || 'http://localhost:3000';

/** Fotos de Unsplash que caracterizan cada producto (cuadradas, listas para cards). */
const IMAGES = {
  'Agua 600ml':
    'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?auto=format&fit=crop&w=800&h=800&q=80',
  Brownie:
    'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=800&h=800&q=80',
  Capuchino:
    'https://images.unsplash.com/photo-1572442388796-11668a67e53d?auto=format&fit=crop&w=800&h=800&q=80',
  'Caramel Frappuccino':
    'https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=800&h=800&q=80',
  Cheesecake:
    'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=800&h=800&q=80',
  Chocolate:
    'https://images.unsplash.com/photo-1542990253-0d0f5be5f0ed?auto=format&fit=crop&w=800&h=800&q=80',
  Cocacola:
    'https://images.unsplash.com/photo-1629203851122-3726ecdf080e?auto=format&fit=crop&w=800&h=800&q=80',
  'Coffee Latte':
    'https://images.unsplash.com/photo-1561882463-897a6223b392?auto=format&fit=crop&w=800&h=800&q=80',
  Croissant:
    'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=800&h=800&q=80',
  'Jugo de naranja':
    'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?auto=format&fit=crop&w=800&h=800&q=80',
  Latte:
    'https://images.unsplash.com/photo-1570968915860-54d0c808d5e8?auto=format&fit=crop&w=800&h=800&q=80',
  Limonada:
    'https://images.unsplash.com/photo-1621263764920-02733300ffa0?auto=format&fit=crop&w=800&h=800&q=80',
  Malteada:
    'https://images.unsplash.com/photo-1579954115545-a46596d57e90?auto=format&fit=crop&w=800&h=800&q=80',
  'Peppermint Macchiato':
    'https://images.unsplash.com/photo-1511920170033-f8396924c348?auto=format&fit=crop&w=800&h=800&q=80',
};

const FALLBACK_BY_CATEGORY = {
  Café: IMAGES.Capuchino,
  Jugos: IMAGES['Jugo de naranja'],
  Lácteos: IMAGES.Chocolate,
  Snacks: IMAGES.Croissant,
  Postres: IMAGES.Brownie,
};

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
  let updated = 0;

  for (const product of products) {
    const imagen =
      IMAGES[product.nombre] ||
      FALLBACK_BY_CATEGORY[product.categoria] ||
      IMAGES.Capuchino;

    const payload = {
      nombre: product.nombre,
      categoria: product.categoria,
      linea: product.linea || '',
      ...(product.fechaVencimiento ? { fechaVencimiento: product.fechaVencimiento } : {}),
      costo: product.costo,
      precioVenta: product.precioVenta,
      stock: product.stock,
      stockMaximo: product.stockMaximo,
      stockMinimo: product.stockMinimo,
      imagen,
    };

    await json(`/productos/${product.id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(payload),
    });
    updated += 1;
    console.log(`OK ${product.nombre}`);
  }

  console.log(`Fotos asignadas a ${updated} productos.`);
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
