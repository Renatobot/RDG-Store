const { PrismaClient } = require('@prisma/client');
const Database = require('better-sqlite3');

const prisma = new PrismaClient();
const sqlite = new Database('./prisma/dev.db');

async function migrate() {
  console.log('Limpando banco em nuvem...');
  await prisma.credential.deleteMany();
  await prisma.review.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.productVariation.deleteMany();
  await prisma.product.deleteMany();
  await prisma.banner.deleteMany();
  await prisma.coupon.deleteMany();
  await prisma.setting.deleteMany();
  await prisma.user.deleteMany();

  console.log('Migrando dados do SQLite (dev.db) para o PostgreSQL (Supabase)...');

  // 1. Migrate Users
  const users = sqlite.prepare('SELECT * FROM User').all();
  for (const user of users) {
    const exists = await prisma.user.findUnique({ where: { email: user.email } });
    if (!exists) {
      await prisma.user.create({ data: {
        id: user.id,
        name: user.name,
        email: user.email,
        password: user.password,
        walletBalance: user.walletBalance,
        role: user.role,
        avatarUrl: user.avatarUrl,
        affiliateCode: user.affiliateCode,
        referredBy: user.referredBy,
        isVip: user.isVip ? true : false,
        createdAt: new Date(user.createdAt),
        updatedAt: new Date(user.updatedAt)
      } });
    }
  }
  console.log(`Migrados ${users.length} usuários.`);

  // 2. Migrate Products
  const products = sqlite.prepare('SELECT * FROM Product').all();
  for (const p of products) {
    const exists = await prisma.product.findUnique({ where: { id: p.id } });
    if (!exists) {
       await prisma.product.create({ data: {
         id: p.id,
         name: p.name,
         description: p.description,
         price: p.price,
         originalPrice: p.originalPrice,
         validity: p.validity,
         imageUrl: p.imageUrl,
         category: p.category,
         badge: p.badge,
         isVip: p.isVip ? true : false,
         hasVariations: p.hasVariations ? true : false,
         createdAt: new Date(p.createdAt),
         updatedAt: new Date(p.updatedAt)
       }});
    }
  }
  console.log(`Migrados ${products.length} produtos.`);

  // 3. Migrate Product Variations
  const variations = sqlite.prepare('SELECT * FROM ProductVariation').all();
  for (const v of variations) {
    const exists = await prisma.productVariation.findUnique({ where: { id: v.id } });
    if (!exists) {
      await prisma.productVariation.create({ data: {
        id: v.id,
        productId: v.productId,
        name: v.name,
        price: v.price,
        originalPrice: v.originalPrice,
        validity: v.validity
      }});
    }
  }
  console.log(`Migradas ${variations.length} variações.`);

  // 3.5. Migrate Orders
  const orders = sqlite.prepare('SELECT * FROM "Order"').all();
  for (const o of orders) {
    const exists = await prisma.order.findUnique({ where: { id: o.id } });
    if (!exists) {
      await prisma.order.create({ data: {
        id: o.id,
        userId: o.userId,
        customerName: o.customerName,
        customerWhatsapp: o.customerWhatsapp,
        pricePaid: o.pricePaid,
        walletUsed: o.walletUsed,
        status: o.status,
        transactionNsu: o.transactionNsu,
        createdAt: new Date(o.createdAt),
        paidAt: o.paidAt ? new Date(o.paidAt) : null,
        deliveredAt: o.deliveredAt ? new Date(o.deliveredAt) : null
      }});
    }
  }
  console.log(`Migradas ${orders.length} ordens.`);

  // 3.6. Migrate Order Items
  const orderItems = sqlite.prepare('SELECT * FROM OrderItem').all();
  for (const oi of orderItems) {
    const exists = await prisma.orderItem.findUnique({ where: { id: oi.id } });
    if (!exists) {
      await prisma.orderItem.create({ data: {
        id: oi.id,
        orderId: oi.orderId,
        productId: oi.productId,
        variationId: oi.variationId,
        price: oi.price,
        quantity: oi.quantity
      }});
    }
  }
  console.log(`Migrados ${orderItems.length} itens de ordem.`);

  // 4. Migrate Credentials
  const credentials = sqlite.prepare('SELECT * FROM Credential').all();
  for (const c of credentials) {
    const exists = await prisma.credential.findUnique({ where: { id: c.id } });
    if (!exists) {
      await prisma.credential.create({ data: {
        id: c.id,
        content: c.content,
        isUsed: c.isUsed ? true : false,
        productId: c.productId,
        variationId: c.variationId,
        orderId: c.orderId,
        createdAt: new Date(c.createdAt)
      }});
    }
  }
  console.log(`Migradas ${credentials.length} credenciais.`);

  // 5. Migrate Banners
  const banners = sqlite.prepare('SELECT * FROM Banner').all();
  for (const b of banners) {
    const exists = await prisma.banner.findUnique({ where: { id: b.id } });
    if (!exists) {
      await prisma.banner.create({ data: {
        id: b.id,
        imageUrl: b.imageUrl,
        mobileImageUrl: b.mobileImageUrl,
        category: b.category,
        isActive: b.isActive ? true : false,
        createdAt: new Date(b.createdAt)
      }});
    }
  }
  console.log(`Migrados ${banners.length} banners.`);

  // 6. Migrate Coupons
  const coupons = sqlite.prepare('SELECT * FROM Coupon').all();
  for (const c of coupons) {
    const exists = await prisma.coupon.findUnique({ where: { id: c.id } });
    if (!exists) {
      await prisma.coupon.create({ data: {
        id: c.id,
        code: c.code,
        type: c.type,
        value: c.value,
        isActive: c.isActive ? true : false,
        createdAt: new Date(c.createdAt)
      }});
    }
  }
  console.log(`Migrados ${coupons.length} cupons.`);

  // 7. Migrate Settings
  const settings = sqlite.prepare('SELECT * FROM Setting').all();
  for (const s of settings) {
    const exists = await prisma.setting.findUnique({ where: { key: s.key } });
    if (!exists) {
      await prisma.setting.create({ data: s });
    }
  }
  console.log(`Migradas ${settings.length} configurações.`);

  // 7.5. Migrate Reviews
  const reviews = sqlite.prepare('SELECT * FROM Review').all();
  for (const r of reviews) {
    const exists = await prisma.review.findUnique({ where: { id: r.id } });
    if (!exists) {
      await prisma.review.create({ data: {
        id: r.id,
        userId: r.userId,
        productId: r.productId,
        rating: r.rating,
        comment: r.comment,
        createdAt: new Date(r.createdAt)
      }});
    }
  }
  console.log(`Migradas ${reviews.length} avaliações.`);

  // Reset Sequences for Postgres so it auto-increments from the highest ID
  const tables = ['User', 'Product', 'ProductVariation', 'Order', 'OrderItem', 'Credential', 'Banner', 'Coupon', 'Review'];
  for (const table of tables) {
    try {
      await prisma.$executeRawUnsafe(`SELECT setval('"${table}_id_seq"', (SELECT MAX(id) FROM "${table}"));`);
    } catch(e) {}
  }
  
  console.log('TUDO FINALIZADO COM SUCESSO!');
}

migrate().catch(console.error).finally(() => prisma.$disconnect());
