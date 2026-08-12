const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const newProducts = [
  // Streamings
  { name: 'Netflix', category: 'Streaming', price: 1500, validity: '30 dias', description: 'Acesso Premium' },
  { name: 'HBO Max', category: 'Streaming', price: 1500, validity: '30 dias', description: 'Acesso Premium' },
  { name: 'Disney+', category: 'Streaming', price: 1500, validity: '30 dias', description: 'Acesso Premium' },
  { name: 'Prime Video', category: 'Streaming', price: 1000, validity: '30 dias', description: 'Acesso Premium' },
  { name: 'Crunchyroll', category: 'Streaming', price: 1500, validity: '30 dias', description: 'Acesso Premium' },
  { name: 'Globoplay', category: 'Streaming', price: 1500, validity: '30 dias', description: 'Acesso Premium' },

  // Inteligências artificiais
  { name: 'ChatGPT', category: 'Inteligência Artificial', price: 2000, validity: '30 dias', description: 'Acesso Premium' },
  { name: 'Google Gemini', category: 'Inteligência Artificial', price: 2000, validity: '30 dias', description: 'Acesso Premium' },
  { name: 'Leonardo AI', category: 'Inteligência Artificial', price: 2000, validity: '30 dias', description: 'Acesso Premium' },
  { name: 'Claude', category: 'Inteligência Artificial', price: 2000, validity: '30 dias', description: 'Acesso Premium' },

  // Ferramentas e produtividade
  { name: 'Canva', category: 'Ferramentas', price: 1000, validity: '30 dias', description: 'Acesso Premium' },
  { name: 'CapCut', category: 'Ferramentas', price: 1500, validity: '30 dias', description: 'Acesso Premium' },
  { name: 'Office 365', category: 'Ferramentas', price: 2500, validity: '30 dias', description: 'Acesso Premium' },
  { name: 'Gamma Pro', category: 'Ferramentas', price: 1500, validity: '30 dias', description: 'Acesso Premium' },
  { name: 'Lovable Ilimitado', category: 'Ferramentas', price: 3000, validity: '30 dias', description: 'Acesso Premium' },

  // Games
  { name: 'Xbox Game Pass — Console', category: 'Games', price: 3000, validity: '30 dias', description: 'Acesso Premium' },
  { name: 'Xbox Game Pass — PC', category: 'Games', price: 3000, validity: '30 dias', description: 'Acesso Premium' },
  { name: 'Xbox Game Pass — Cloud', category: 'Games', price: 3000, validity: '30 dias', description: 'Acesso Premium' },
  { name: 'PlayStation Plus — PS Plus', category: 'Games', price: 3500, validity: '30 dias', description: 'Acesso Premium' },
  { name: 'Steam', category: 'Games', price: 2000, validity: '30 dias', description: 'Acesso Premium' },
  { name: 'Roblox', category: 'Games', price: 1500, validity: '30 dias', description: 'Acesso Premium' },
  { name: 'Free Fire', category: 'Games', price: 1000, validity: '30 dias', description: 'Diamantes/Acesso' },

  // Conteúdo adulto — 18+
  { name: 'OnlyFans', category: 'Adultos', price: 2500, validity: '30 dias', description: 'Acesso Premium' },
  { name: 'Privacy', category: 'Adultos', price: 2500, validity: '30 dias', description: 'Acesso Premium' },
  { name: 'XVideos RED', category: 'Adultos', price: 2000, validity: '30 dias', description: 'Acesso Premium' },
  { name: 'TUFOS', category: 'Adultos', price: 2000, validity: '30 dias', description: 'Acesso Premium' },
  { name: 'Grupos VIP no Telegram', category: 'Adultos', price: 1500, validity: '30 dias', description: 'Acesso VIP' }
];

async function main() {
  for (const product of newProducts) {
    const existing = await prisma.product.findFirst({
      where: { name: product.name, category: product.category }
    });
    if (!existing) {
      await prisma.product.create({ data: product });
      console.log(`Criado: ${product.name}`);
    } else {
      console.log(`Já existe: ${product.name}`);
    }
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
