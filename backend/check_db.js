const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const bcrypt = require('bcryptjs');

async function main() {
  const users = await prisma.user.findMany();
  for (const u of users) {
    const is123456 = await bcrypt.compare('123456', u.password);
    const isAdmin123 = await bcrypt.compare('admin123', u.password);
    const isRenato123 = await bcrypt.compare('renato123', u.password);
    console.log(`User ${u.id} (${u.email}, role: ${u.role}): 123456=${is123456}, admin123=${isAdmin123}, renato123=${isRenato123}`);
  }
}

main().finally(() => prisma.$disconnect());
