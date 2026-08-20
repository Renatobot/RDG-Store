const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://postgres.gvnfuindbwokvbacqksu:RDGstore2026@aws-0-ca-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true&sslmode=require'
    }
  }
});

async function checkUsers() {
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, walletBalance: true }
  });
  console.log('Users in DB:', users);
}

checkUsers().finally(() => prisma.$disconnect());
