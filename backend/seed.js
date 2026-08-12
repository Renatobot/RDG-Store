const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.product.create({
    data: {
      name: 'Netflix Premium',
      description: 'Acesso 4K para 1 Tela. Conta exclusiva e privada.',
      price: 1500, // R$ 15,00 (em centavos)
      validity: '30 dias',
    }
  });

  await prisma.product.create({
    data: {
      name: 'Max (Antigo HBO)',
      description: 'Filmes e Séries recém saídos do cinema. Tela 4K.',
      price: 1250, // R$ 12,50
      validity: '30 dias',
    }
  });

  console.log('✅ Produtos de teste criados no banco de dados!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
