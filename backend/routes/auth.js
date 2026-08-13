const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'rdg_super_secret_key_2026';

// Middleware to verify token
const verifyToken = (req, res, next) => {
  const token = req.headers['authorization'];
  if (!token) return res.status(403).json({ error: 'Token não fornecido' });
  
  jwt.verify(token.replace('Bearer ', ''), JWT_SECRET, async (err, decoded) => {
    if (err) return res.status(401).json({ error: 'Token inválido' });
    req.userId = decoded.id;
    
    // Busca a role fresquinha direto do banco (evita problemas com tokens antigos)
    try {
      const dbUser = await prisma.user.findUnique({ where: { id: decoded.id } });
      if (dbUser) {
        req.userRole = dbUser.role;
      } else {
        req.userRole = decoded.role;
      }
    } catch (e) {
      req.userRole = decoded.role;
    }
    
    next();
  });
};

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, referralCode } = req.body;
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(400).json({ error: 'Email já cadastrado.' });
    
    let referredBy = null;
    if (referralCode) {
      const referrer = await prisma.user.findUnique({ where: { affiliateCode: referralCode } });
      if (referrer) referredBy = referrer.id;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userCount = await prisma.user.count();
    const role = userCount === 0 ? 'ADMIN' : 'USER';
    
    const uniqueAffiliateCode = `${name.split(' ')[0].toLowerCase()}${Math.floor(Math.random() * 10000)}`;

    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword, role, referredBy, affiliateCode: uniqueAffiliateCode }
    });
    
    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, walletBalance: user.walletBalance, role: user.role, isVip: user.isVip } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email e senha são obrigatórios.' });

    const cleanEmail = email.trim();
    const user = await prisma.user.findFirst({
      where: {
        email: { equals: cleanEmail, mode: 'insensitive' }
      }
    });

    if (!user) return res.status(404).json({ error: 'Usuário não encontrado.' });
    if (user.role === 'BANNED') return res.status(403).json({ error: 'Sua conta foi suspensa por violar os termos de uso.' });
    
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(401).json({ error: 'Senha incorreta.' });
    
    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, walletBalance: user.walletBalance, role: user.role, isVip: user.isVip } });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/auth/me
router.get('/me', verifyToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user) return res.status(404).json({ error: 'Usuário não encontrado.' });
    res.json({ id: user.id, name: user.name, email: user.email, walletBalance: user.walletBalance, role: user.role, isVip: user.isVip });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = { router, verifyToken, JWT_SECRET };
