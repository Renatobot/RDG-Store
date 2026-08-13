const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash('admin123', 10);
  const updated = await prisma.user.updateMany({
    where: {
      email: {
        in: ['RenatoDEV@admin.com', 'admin@admin.com', 'renato@admin.com']
      }
    },
    data: {
      password: hash,
      role: 'ADMIN'
    }
  });
  console.log('Admin accounts updated:', updated);
}

main().finally(() => prisma.$disconnect());
