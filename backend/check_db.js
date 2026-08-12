const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.count();
  const products = await prisma.product.count();
  console.log(`Users: ${users}`);
  console.log(`Products: ${products}`);
}

main().finally(() => prisma.$disconnect());
