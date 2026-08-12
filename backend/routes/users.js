const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { verifyToken } = require('./auth');

// Ranking de maiores compradores
router.get('/ranking', async (req, res) => {
  try {
    // Busca usuários ordenados por quantidade de compras (vamos simplificar usando pedidos pagos)
    const users = await prisma.user.findMany({
      include: {
        orders: {
          where: { status: { in: ['PAGO', 'ENTREGUE'] } }
        }
      }
    });

    // Calcula o total gasto por cada usuário
    const ranking = users.map(u => {
      const totalSpent = u.orders.reduce((acc, order) => acc + order.pricePaid + order.walletUsed, 0);
      return {
        id: u.id,
        name: u.name,
        totalSpent
      };
    }).sort((a, b) => b.totalSpent - a.totalSpent).slice(0, 10);

    // Se tiver poucos, adicionamos uns fictícios
    if (ranking.length < 5) {
      ranking.push(
        { id: 9991, name: "Lucas M.", totalSpent: 215000 },
        { id: 9992, name: "Fernanda Silva", totalSpent: 185000 },
        { id: 9993, name: "Thiago B.", totalSpent: 154000 }
      );
      ranking.sort((a, b) => b.totalSpent - a.totalSpent);
    }

    res.json(ranking.slice(0, 10));
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar ranking' });
  }
});

// Histórico de pedidos do usuário logado
router.get('/me/orders', verifyToken, async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      where: { userId: req.userId },
      include: {
        items: {
          include: { 
            product: true,
            variation: true,
            credentials: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar pedidos do usuário' });
  }
});

const bcrypt = require('bcryptjs');

// Atualizar Senha
router.put('/me/password', verifyToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    
    const validPassword = await bcrypt.compare(currentPassword, user.password);
    if (!validPassword) return res.status(401).json({ error: 'Senha atual incorreta' });
    
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: req.userId },
      data: { password: hashedPassword }
    });
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar senha' });
  }
});

// Pegar ou Gerar Código de Afiliado e Estatísticas
router.get('/me/affiliate', verifyToken, async (req, res) => {
  try {
    let user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user.affiliateCode) {
      const code = `${user.name.split(' ')[0].toLowerCase()}${user.id}`;
      user = await prisma.user.update({
        where: { id: req.userId },
        data: { affiliateCode: code }
      });
    }

    // Busca total de indicados
    const referrals = await prisma.user.count({ where: { referredBy: req.userId } });
    
    // Busca ganhos (no momento, não temos uma tabela separada para histórico de ganhos, 
    // mas vamos retornar a estrutura pro front)
    res.json({
      affiliateCode: user.affiliateCode,
      referralsCount: referrals
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar dados de afiliado' });
  }
});

// Atualizar nome e email
router.put('/me/profile', verifyToken, async (req, res) => {
  const { name, email } = req.body;
  try {
    const user = await prisma.user.update({
      where: { id: req.userId },
      data: { name, email }
    });
    const { password, ...userWithoutPassword } = user;
    res.json({ success: true, user: userWithoutPassword });
  } catch (error) {
    if (error.code === 'P2002') return res.status(400).json({ error: 'Email já está em uso' });
    res.status(500).json({ error: 'Erro ao atualizar perfil' });
  }
});

// Atualizar foto de perfil (avatarUrl)
router.put('/me/avatar', verifyToken, async (req, res) => {
  const { avatarUrl } = req.body;
  try {
    const user = await prisma.user.update({
      where: { id: req.userId },
      data: { avatarUrl }
    });
    // Removemos o hash da senha para devolver o user
    const { password, ...userWithoutPassword } = user;
    res.json({ success: true, user: userWithoutPassword });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar foto' });
  }
});

// Rota Admin: Reembolsar para carteira
router.post('/admin/refund', verifyToken, async (req, res) => {
  if (req.userRole !== 'ADMIN') return res.status(403).json({ error: 'Acesso negado' });
  
  const { orderId } = req.body;
  try {
    const order = await prisma.order.findUnique({ where: { id: parseInt(orderId) }, include: { user: true } });
    if (!order) return res.status(404).json({ error: 'Pedido não encontrado' });
    if (order.status === 'CANCELADO') return res.status(400).json({ error: 'Pedido já reembolsado/cancelado' });
    if (!order.userId) return res.status(400).json({ error: 'Pedido não está vinculado a um usuário' });

    const totalToRefund = order.pricePaid + order.walletUsed;

    // Adiciona o valor de volta na carteira do usuário
    await prisma.user.update({
      where: { id: order.userId },
      data: { walletBalance: { increment: totalToRefund } }
    });

    // Marca pedido como CANCELADO
    await prisma.order.update({
      where: { id: order.id },
      data: { status: 'CANCELADO' }
    });

    res.json({ success: true, message: 'Reembolsado para a carteira com sucesso' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao reembolsar' });
  }
});

// =========================================
// ADMIN: GERENCIAMENTO DE CLIENTES
// =========================================

// Listar todos os clientes com histórico de compras
router.get('/admin/list', verifyToken, async (req, res) => {
  if (req.userRole !== 'ADMIN') return res.status(403).json({ error: 'Acesso negado' });
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        orders: {
          orderBy: { createdAt: 'desc' },
          include: {
            items: {
              include: {
                product: true,
                variation: true,
                credentials: true
              }
            }
          }
        }
      }
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao listar usuários' });
  }
});

// Adicionar saldo manualmente
router.post('/admin/add-balance', verifyToken, async (req, res) => {
  if (req.userRole !== 'ADMIN') return res.status(403).json({ error: 'Acesso negado' });
  const { userId, amount } = req.body;
  try {
    const user = await prisma.user.update({
      where: { id: parseInt(userId) },
      data: { walletBalance: { increment: parseInt(amount) } }
    });
    res.json({ success: true, walletBalance: user.walletBalance });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao adicionar saldo' });
  }
});

// Banir / Desbanir cliente (mudando a role)
router.post('/admin/ban', verifyToken, async (req, res) => {
  if (req.userRole !== 'ADMIN') return res.status(403).json({ error: 'Acesso negado' });
  const { userId, ban } = req.body; // ban = true ou false
  try {
    const user = await prisma.user.update({
      where: { id: parseInt(userId) },
      data: { role: ban ? 'BANNED' : 'USER' }
    });
    res.json({ success: true, role: user.role });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao banir usuário' });
  }
});

// Promover/Rebaixar VIP
router.post('/admin/vip', verifyToken, async (req, res) => {
  if (req.userRole !== 'ADMIN') return res.status(403).json({ error: 'Acesso negado' });
  const { userId, vip } = req.body; // vip = true ou false
  try {
    const user = await prisma.user.update({
      where: { id: parseInt(userId) },
      data: { isVip: vip }
    });
    res.json({ success: true, isVip: user.isVip });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao alterar status VIP do usuário' });
  }
});

module.exports = router;
