import 'dotenv/config';
import { PrismaClient, Role } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();
const slug = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

async function main() {
  await prisma.payment.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.cafeTable.deleteMany();
  await prisma.user.deleteMany();
  await prisma.branch.deleteMany();

  const branchesData = [
    {
      name: 'Altura Café Centro',
      address: 'Cra. 5 #8-30, Centro, Neiva',
      phone: '608 871 0001',
      openTime: '07:00',
      closeTime: '20:00',
      imageUrl: '/images/branches/centro.jpg',
    },
    {
      name: 'Altura Café Norte',
      address: 'Calle 26 #5-45, Neiva',
      phone: '608 871 0002',
      openTime: '08:00',
      closeTime: '21:00',
      imageUrl: '/images/branches/norte.jpg',
    },
    {
      name: 'Altura Café Sur',
      address: 'Cra. 16 #9-12, Neiva',
      phone: '608 871 0003',
      openTime: '08:00',
      closeTime: '19:00',
      imageUrl: '/images/branches/sur.jpg',
    },
  ];
  const branches = [];
  for (const b of branchesData) {
    branches.push(await prisma.branch.create({ data: b }));
  }
  const main = branches[0];

  for (const b of branches) {
    await prisma.cafeTable.createMany({
      data: Array.from({ length: 20 }, (_, i) => ({
        number: i + 1,
        branchId: b.id,
      })),
    });
  }
  const users: { name: string; email: string; password: string; role: Role }[] =
    [
      {
        name: 'Administrador',
        email: 'admin@alturacafe.com',
        password: 'Admin123*',
        role: Role.ADMIN,
      },
      {
        name: 'Laura Mesera',
        email: 'mesero@alturacafe.com',
        password: 'Mesero123*',
        role: Role.WAITER,
      },
      {
        name: 'Carlos Barista',
        email: 'barista@alturacafe.com',
        password: 'Barista123*',
        role: Role.BARISTA,
      },
    ];
  for (const u of users) {
    await prisma.user.create({
      data: {
        name: u.name,
        email: u.email,
        passwordHash: await hash(u.password, 10),
        role: u.role,
        branchId: main.id,
      },
    });
  }

  // Mmenu
  const menu = [
    {
      nameEs: 'Cafés calientes',
      nameEn: 'Hot coffees',
      sortOrder: 1,
      products: [
        [
          'Espresso',
          'Espresso',
          'Shot intenso de café de origen huilense.',
          'Intense shot of coffee from Huila.',
          4500,
        ],
        [
          'Americano',
          'Americano',
          'Espresso largo con agua caliente.',
          'Espresso lengthened with hot water.',
          5500,
        ],
        [
          'Capuchino',
          'Cappuccino',
          'Espresso con leche vaporizada y espuma cremosa.',
          'Espresso with steamed milk and creamy foam.',
          9000,
        ],
        [
          'Latte',
          'Latte',
          'Espresso suave con abundante leche.',
          'Smooth espresso with plenty of milk.',
          9500,
        ],
        [
          'Mocaccino',
          'Mocha',
          'Café con chocolate y leche vaporizada.',
          'Coffee with chocolate and steamed milk.',
          10500,
        ],
      ],
    },
    {
      nameEs: 'Bebidas frías',
      nameEn: 'Cold drinks',
      sortOrder: 2,
      products: [
        [
          'Cold Brew',
          'Cold Brew',
          'Café extraído en frío durante 12 horas.',
          'Coffee cold-brewed for 12 hours.',
          10000,
        ],
        [
          'Frappé de café',
          'Coffee frappé',
          'Café helado batido con crema.',
          'Blended iced coffee with cream.',
          12500,
        ],
        [
          'Limonada de coco',
          'Coconut lemonade',
          'Limón fresco con crema de coco.',
          'Fresh lime with coconut cream.',
          9500,
        ],
        [
          'Té helado de maracuyá',
          'Passion fruit iced tea',
          'Té verde con pulpa de maracuyá.',
          'Green tea with passion fruit pulp.',
          8500,
        ],
      ],
    },
    {
      nameEs: 'Malteadas',
      nameEn: 'Milkshakes',
      sortOrder: 3,
      products: [
        [
          'Malteada de chocolate',
          'Chocolate milkshake',
          'Helado de vainilla con chocolate oscuro.',
          'Vanilla ice cream with dark chocolate.',
          13000,
        ],
        [
          'Malteada de arequipe',
          'Dulce de leche milkshake',
          'Helado cremoso con arequipe artesanal.',
          'Creamy ice cream with homemade dulce de leche.',
          13500,
        ],
      ],
    },
    {
      nameEs: 'Postres y panadería',
      nameEn: 'Desserts & bakery',
      sortOrder: 4,
      products: [
        [
          'Croissant de queso',
          'Cheese croissant',
          'Croissant horneado con queso fundido.',
          'Baked croissant with melted cheese.',
          7500,
        ],
        [
          'Brownie con helado',
          'Brownie with ice cream',
          'Brownie tibio con bola de helado.',
          'Warm brownie with a scoop of ice cream.',
          11000,
        ],
        [
          'Torta de zanahoria',
          'Carrot cake',
          'Porción de torta húmeda con crema de queso.',
          'Moist cake slice with cream cheese frosting.',
          9500,
        ],
      ],
    },
  ];

  for (const c of menu) {
    await prisma.category.create({
      data: {
        nameEs: c.nameEs,
        nameEn: c.nameEn,
        sortOrder: c.sortOrder,
        products: {
          create: c.products.map(
            ([nameEs, nameEn, descriptionEs, descriptionEn, price]) => ({
              nameEs: nameEs as string,
              nameEn: nameEn as string,
              descriptionEs: descriptionEs as string,
              descriptionEn: descriptionEn as string,
              price: price as number,
              imageUrl: `/images/products/${slug(nameEs as string)}.jpg`,
            }),
          ),
        },
      },
    });
  }

  console.log('✅ Seed completado');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
