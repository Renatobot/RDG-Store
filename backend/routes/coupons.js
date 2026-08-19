require('dotenv').config();
const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { verifyToken } = require('./auth');

// Listar Cupons (Apenas Admin)
router.get('/', verifyToken, async (req, res) => {
  if (req.userRole !== 'ADMIN') return res.status(403).json({ error: 'Acesso negado' });
  try {
    const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: 'desc' } });
    res.json(coupons);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao listar cupons' });
  }
});

// Criar Cupom (Apenas Admin)
router.post('/', verifyToken, async (req, res) => {
  if (req.userRole !== 'ADMIN') return res.status(403).json({ error: 'Acesso negado' });
  try {
    const { code, type, value, isActive } = req.body;
    const coupon = await prisma.coupon.create({
      data: { 
        code: code.toUpperCase(), 
        type, 
        value: parseInt(value), 
        isActive: isActive !== undefined ? isActive : true 
      }
    });
    res.json(coupon);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar cupom. Código já existe?' });
  }
});

// Atualizar Cupom (Apenas Admin)
router.put('/:id', verifyToken, async (req, res) => {
  if (req.userRole !== 'ADMIN') return res.status(403).json({ error: 'Acesso negado' });
  try {
    const { id } = req.params;
    const { isActive } = req.body;
    const coupon = await prisma.coupon.update({
      where: { id: parseInt(id) },
      data: { isActive }
    });
    res.json(coupon);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar cupom' });
  }
});

// Deletar Cupom (Apenas Admin)
router.delete('/:id', verifyToken, async (req, res) => {
  if (req.userRole !== 'ADMIN') return res.status(403).json({ error: 'Acesso negado' });
  try {
    const { id } = req.params;
    await prisma.coupon.delete({ where: { id: parseInt(id) } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao deletar cupom' });
  }
});

// Validar Cupom (Qualquer usuário logado ou não logado, dependendo de como chamarem)
router.post('/validate', async (req, res) => {
  try {
    const { code } = req.body;
    const coupon = await prisma.coupon.findUnique({ where: { code: code.toUpperCase() } });
    
    if (!coupon) return res.status(404).json({ error: 'Cupom não encontrado' });
    if (!coupon.isActive) return res.status(400).json({ error: 'Este cupom está inativo ou expirado' });
    
    res.json(coupon);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao validar cupom' });
  }
});

module.exports = router;
