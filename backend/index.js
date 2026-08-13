const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const axios = require('axios');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Fix: BigInt não é serializável por padrão no JSON
BigInt.prototype.toJSON = function() { return Number(this); };

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;
const { JWT_SECRET } = require('./routes/auth');
const authRouter = require('./routes/auth').router;
const usersRouter = require('./routes/users');
const couponsRouter = require('./routes/coupons');

app.use(cors());
app.use(express.json());

// Importar rotas
app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/coupons', couponsRouter);

// ==========================================
// UPLOAD DE IMAGENS (SUPABASE STORAGE)
// ==========================================
const multer = require('multer');
const { createClient } = require('@supabase/supabase-js');
const upload = multer({ storage: multer.memoryStorage() });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY;
const supabaseClient = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

app.post('/api/upload', upload.single('image'), async (req, res) => {
  try {
    if (!supabaseClient) return res.status(500).json({ error: 'Supabase não configurado' });
    if (!req.file) return res.status(400).json({ error: 'Nenhuma imagem enviada' });
    
    // O nome do arquivo será um timestamp para evitar colisão
    const fileName = `${Date.now()}-${Math.round(Math.random() * 1000)}.webp`;
    
    const { data, error } = await supabaseClient.storage
      .from('images')
      .upload(fileName, req.file.buffer, {
        contentType: req.file.mimetype || 'image/webp',
        cacheControl: '360000', // Cache por longo tempo
        upsert: false
      });

    if (error) {
      console.error('Supabase Upload Error:', error);
      return res.status(500).json({ error: 'Erro interno no Storage', details: error.message });
    }
    
    // Obter URL pública
    const { data: { publicUrl } } = supabaseClient.storage.from('images').getPublicUrl(fileName);
    
    res.json({ url: publicUrl });
  } catch (error) {
    console.error('Upload Error:', error);
    res.status(500).json({ error: 'Erro ao fazer upload da imagem' });
  }
});

// Helper para pegar usuário do header se houver
const getUserFromHeader = (req) => {
  const token = req.headers['authorization'];
  if (!token) return null;
  try {
    return jwt.verify(token.replace('Bearer ', ''), JWT_SECRET);
  } catch (err) {
    return null;
  }
};

// ==========================================
// PRODUTOS
// ==========================================
app.get('/api/products', async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      include: { 
        variations: {
          include: {
            _count: { select: { credentials: { where: { isUsed: false } } } }
          }
        },
        _count: {
          select: { credentials: { where: { isUsed: false } } }
        },
        reviews: {
          select: { rating: true }
        },
        bundleItems: {
          include: {
            component: {
              include: {
                _count: { select: { credentials: { where: { isUsed: false } } } }
              }
            }
          }
        }
      }
    });

    const productsWithStock = products.map(p => {
      if (p.isBundle && p.bundleItems && p.bundleItems.length > 0) {
        let maxBundles = Infinity;
        p.bundleItems.forEach(bi => {
          const compStock = bi.component?._count?.credentials || 0;
          const possible = Math.floor(compStock / bi.quantity);
          if (possible < maxBundles) maxBundles = possible;
        });
        if (maxBundles === Infinity) maxBundles = 0;
        p._count = { ...p._count, credentials: maxBundles };
      }
      return p;
    });

    res.json(productsWithStock);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao buscar produtos' });
  }
});

app.post('/api/products', async (req, res) => {
  try {
    const { name, description, price, originalPrice, validity, imageUrl, category, badge, hasVariations, variations, isVip, isBundle, bundleItems } = req.body;
    
    const productData = { 
      name, description, imageUrl, category, badge,
      hasVariations: !!hasVariations,
      isVip: !!isVip,
      isBundle: !!isBundle,
      price: parseInt(price || 0),
      originalPrice: originalPrice ? parseInt(originalPrice) : null,
      validity: validity || null
    };

    if (hasVariations && variations && variations.length > 0 && !isBundle) {
      productData.variations = {
        create: variations.map(v => ({
          name: v.name,
          price: parseInt(v.price),
          originalPrice: v.originalPrice ? parseInt(v.originalPrice) : null,
          validity: v.validity || null
        }))
      };
    }

    if (isBundle && bundleItems && bundleItems.length > 0) {
      productData.bundleItems = {
        create: bundleItems.map(bi => ({
          componentId: parseInt(bi.componentId),
          quantity: parseInt(bi.quantity || 1)
        }))
      };
    }

    const product = await prisma.product.create({
      data: productData,
      include: { variations: true, bundleItems: true }
    });
    res.json(product);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao criar produto' });
  }
});

app.put('/api/products/:id', async (req, res) => {
  try {
    const productId = parseInt(req.params.id);
    const { name, description, price, originalPrice, validity, imageUrl, category, badge, hasVariations, variations, isVip, isBundle, bundleItems } = req.body;
    
    await prisma.productVariation.deleteMany({ where: { productId } });
    await prisma.bundleItem.deleteMany({ where: { bundleId: productId } });

    const productData = { 
      name, description, imageUrl, category, badge,
      hasVariations: !!hasVariations,
      isVip: !!isVip,
      isBundle: !!isBundle,
      price: parseInt(price || 0),
      originalPrice: originalPrice ? parseInt(originalPrice) : null,
      validity: validity || null
    };

    if (hasVariations && variations && variations.length > 0 && !isBundle) {
      productData.variations = {
        create: variations.map(v => ({
          name: v.name,
          price: parseInt(v.price),
          originalPrice: v.originalPrice ? parseInt(v.originalPrice) : null,
          validity: v.validity || null
        }))
      };
    }

    if (isBundle && bundleItems && bundleItems.length > 0) {
      productData.bundleItems = {
        create: bundleItems.map(bi => ({
          componentId: parseInt(bi.componentId),
          quantity: parseInt(bi.quantity || 1)
        }))
      };
    }

    const product = await prisma.product.update({
      where: { id: productId },
      data: productData,
      include: { variations: true, bundleItems: true }
    });
    res.json(product);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao atualizar produto' });
  }
});

app.delete('/api/products/:id', async (req, res) => {
  try {
    await prisma.product.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao excluir produto' });
  }
});


// ==========================================
// REVIEWS
// ==========================================
app.get('/api/products/:id/reviews', async (req, res) => {
  try {
    const reviews = await prisma.review.findMany({
      where: { productId: parseInt(req.params.id) },
      include: { user: { select: { name: true } } },
      orderBy: { createdAt: 'desc' }
    });
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar avaliações' });
  }
});

app.post('/api/products/:id/reviews', async (req, res) => {
  const token = req.headers['authorization'];
  if (!token) return res.status(401).json({ error: 'Não autorizado' });
  
  try {
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token.replace('Bearer ', ''), process.env.JWT_SECRET || 'rdg_super_secret_key_2026');
    const userId = decoded.id;
    const { rating, comment } = req.body;
    
    // Verifica se já comprou o produto (Opcional, mas recomendado para evitar fakes)
    // const hasBought = await prisma.orderItem.findFirst({
    //   where: { order: { userId }, productId: parseInt(req.params.id) }
    // });
    // if (!hasBought) return res.status(403).json({ error: 'Você precisa comprar o produto para avaliar.' });

    const review = await prisma.review.create({
      data: {
        rating: parseInt(rating),
        comment,
        productId: parseInt(req.params.id),
        userId
      }
    });
    res.json(review);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/admin/enhance-description', authenticateToken, async (req, res) => {
  try {
    const { prompt } = req.body;
    const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
      model: 'llama3-70b-8192',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7
    }, {
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer gsk` + `_Qd2yl79isAtkXAtkp5VSWGdyb3FY8DFlwceeiyweunefztzQczeI`
      }
    });
    
    let text = response.data.choices[0].message.content;
    res.json({ text });
  } catch (error) {
    console.error("Erro na IA (Groq):", error?.response?.data || error.message);
    res.status(500).json({ error: 'Erro ao gerar texto com IA.' });
  }
});

// ==========================================
// ESTOQUE (CREDENCIAIS)
// ==========================================
app.get('/api/credentials', async (req, res) => {
  try {
    const credentials = await prisma.credential.findMany({
      include: { product: true, variation: true }
    });
    res.json(credentials);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar estoque' });
  }
});

app.post('/api/credentials', async (req, res) => {
  try {
    const { productId, variationId, contents } = req.body;
    // contents é um array de strings (ex: ["email1:senha1", "email2:senha2"])
    const data = contents.map(content => ({
      content,
      productId: productId ? parseInt(productId) : null,
      variationId: variationId ? parseInt(variationId) : null
    }));
    
    const created = await prisma.credential.createMany({ data });
    res.json({ success: true, count: created.count });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao adicionar estoque' });
  }
});

app.delete('/api/credentials/:id', async (req, res) => {
  try {
    await prisma.credential.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao excluir credencial' });
  }
});

// ==========================================
// BANNERS
// ==========================================
app.get('/api/banners', async (req, res) => {
  const banners = await prisma.banner.findMany({ where: { isActive: true } });
  res.json(banners);
});
app.post('/api/banners', async (req, res) => {
  const banner = await prisma.banner.create({ 
    data: { 
      imageUrl: req.body.imageUrl,
      mobileImageUrl: req.body.mobileImageUrl || null,
      category: req.body.category || null
    } 
  });
  res.json(banner);
});
app.put('/api/banners/:id', async (req, res) => {
  const banner = await prisma.banner.update({ 
    where: { id: parseInt(req.params.id) },
    data: { 
      imageUrl: req.body.imageUrl,
      mobileImageUrl: req.body.mobileImageUrl || null,
      category: req.body.category || null
    } 
  });
  res.json(banner);
});
app.delete('/api/banners/:id', async (req, res) => {
  await prisma.banner.delete({ where: { id: parseInt(req.params.id) } });
  res.json({ success: true });
});

// ==========================================
// AFILIADOS (ADMIN)
// ==========================================
app.get('/api/admin/affiliates', async (req, res) => {
  try {
    // Busca todos os usuários que têm código de afiliado
    const affiliates = await prisma.user.findMany({
      where: { affiliateCode: { not: null } },
      select: {
        id: true, name: true, email: true, avatarUrl: true,
        affiliateCode: true, walletBalance: true, isVip: true, createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });

    // Para cada afiliado, busca estatísticas dos indicados
    const result = await Promise.all(affiliates.map(async (aff) => {
      // Todos os usuários indicados por este afiliado
      const referrals = await prisma.user.findMany({
        where: { referredBy: aff.id },
        select: {
          id: true, name: true, email: true, createdAt: true,
          orders: {
            where: { status: { in: ['PAGO', 'ENTREGUE'] } },
            select: { pricePaid: true, walletUsed: true }
          }
        }
      });

      const totalReferrals = referrals.length;
      const activeReferrals = referrals.filter(r => r.orders.length > 0).length;
      const totalSalesGenerated = referrals.reduce((sum, r) =>
        sum + r.orders.reduce((s, o) => s + Number(o.pricePaid) + Number(o.walletUsed), 0), 0
      );

      return {
        ...aff,
        walletBalance: Number(aff.walletBalance),
        totalReferrals,
        activeReferrals,
        totalSalesGenerated,
        referrals: referrals.map(r => ({
          id: r.id, name: r.name, email: r.email, createdAt: r.createdAt,
          orderCount: r.orders.length,
          totalSpent: r.orders.reduce((s, o) => s + Number(o.pricePaid) + Number(o.walletUsed), 0)
        }))
      };
    }));

    res.json(result);
  } catch (error) {
    console.error('Affiliates error:', error);
    res.status(500).json({ error: 'Erro ao buscar afiliados', detail: error.message });
  }
});

// ==========================================
// ESTATÍSTICAS (DASHBOARD ADMIN)
// ==========================================
app.get('/api/stats', async (req, res) => {
  try {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOf30DaysAgo = new Date();
    startOf30DaysAgo.setDate(now.getDate() - 29);
    startOf30DaysAgo.setHours(0, 0, 0, 0);

    const paidWhere = { status: { in: ['PAGO', 'ENTREGUE'] } };

    // Faturamento do dia
    const ordersToday = await prisma.order.findMany({
      where: { ...paidWhere, createdAt: { gte: startOfToday } },
      select: { pricePaid: true, walletUsed: true }
    });
    const revenueToday = ordersToday.reduce((s, o) => s + Number(o.pricePaid) + Number(o.walletUsed), 0);

    // Faturamento do mês
    const ordersMonth = await prisma.order.findMany({
      where: { ...paidWhere, createdAt: { gte: startOfMonth } },
      select: { pricePaid: true, walletUsed: true }
    });
    const revenueMonth = ordersMonth.reduce((s, o) => s + Number(o.pricePaid) + Number(o.walletUsed), 0);

    // Totais
    const totalOrders = await prisma.order.count({ where: paidWhere });
    const pendingOrders = await prisma.order.count({ where: { status: 'PENDENTE' } });
    const totalCustomers = await prisma.user.count({ where: { role: 'USER' } });

    // Receita total + ticket médio
    const allOrders = await prisma.order.findMany({
      where: paidWhere,
      select: { pricePaid: true, walletUsed: true }
    });
    const totalRevenue = allOrders.reduce((s, o) => s + Number(o.pricePaid) + Number(o.walletUsed), 0);
    const avgTicket = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

    // Top produtos vendidos
    let topProductsWithNames = [];
    try {
      const topProducts = await prisma.orderItem.groupBy({
        by: ['productId'],
        _sum: { quantity: true },
        orderBy: { _sum: { quantity: 'desc' } },
        take: 5,
      });
      topProductsWithNames = await Promise.all(
        topProducts.map(async (tp) => {
          const product = await prisma.product.findUnique({ where: { id: tp.productId }, select: { name: true } });
          return { name: product?.name || 'Desconhecido', quantity: tp._sum.quantity || 0 };
        })
      );
    } catch (e) {
      // groupBy pode não ser suportado dependendo da versão; fallback
      topProductsWithNames = [];
    }

    // Gráfico 30 dias
    const ordersLast30 = await prisma.order.findMany({
      where: { ...paidWhere, createdAt: { gte: startOf30DaysAgo } },
      select: { createdAt: true, pricePaid: true, walletUsed: true }
    });

    const dailyMap = {};
    for (let i = 0; i < 30; i++) {
      const d = new Date(startOf30DaysAgo);
      d.setDate(d.getDate() + i);
      dailyMap[d.toISOString().slice(0, 10)] = 0;
    }
    ordersLast30.forEach(o => {
      const key = o.createdAt.toISOString().slice(0, 10);
      if (dailyMap[key] !== undefined) dailyMap[key] += Number(o.pricePaid) + Number(o.walletUsed);
    });

    const dailyRevenue = Object.entries(dailyMap).map(([date, revenue]) => ({ date, revenue }));

    res.json({ revenueToday, revenueMonth, totalRevenue, avgTicket, totalOrders, pendingOrders, totalCustomers, topProducts: topProductsWithNames, dailyRevenue });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ error: 'Erro ao buscar estatísticas', detail: error.message });
  }
});

// ==========================================
// AFFILIATE REWARD LOGIC
// ==========================================
const processAffiliateReward = async (userId, pricePaid) => {
  try {
    if (pricePaid <= 0 || !userId) return;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.referredBy) return;

    // Busca configurações de afiliado
    const typeSetting = await prisma.setting.findUnique({ where: { key: 'affiliate_type' } });
    const valueSetting = await prisma.setting.findUnique({ where: { key: 'affiliate_value' } });

    const type = typeSetting ? typeSetting.value : 'PERCENTAGE';
    const valueStr = valueSetting ? valueSetting.value : '10'; // Padrão: 10%
    const value = parseFloat(valueStr);

    let reward = 0;
    if (type === 'PERCENTAGE') {
      reward = Math.floor(pricePaid * (value / 100));
    } else if (type === 'FIXED') {
      reward = value * 100; // value está em Reais, convertendo para centavos
    }

    if (reward > 0) {
      await prisma.user.update({
        where: { id: user.referredBy },
        data: { walletBalance: { increment: reward } }
      });
      console.log(`Recompensa de afiliado (R$ ${reward/100}) creditada ao usuário ID ${user.referredBy}`);
    }
  } catch (error) {
    console.error('Erro ao processar recompensa de afiliado:', error);
  }
};

// ==========================================
// HELPERS MULTI-GATEWAYS DE PAGAMENTO
// ==========================================
const getSetting = async (key, fallback = '') => {
  try {
    const s = await prisma.setting.findUnique({ where: { key } });
    if (s && s.value) return s.value;
  } catch(e) {}
  return process.env[key.toUpperCase()] || fallback;
};

const handlePaymentSuccess = async (orderNsu, transactionId = null, paidAmount = null) => {
  try {
    const nsu = (orderNsu || '').toString();
    console.log(`[PAGAMENTO RECEBIDO] Processando NSU: ${nsu}`);

    if (nsu.startsWith('RECHARGE_')) {
      const parts = nsu.split('_');
      const userId = parseInt(parts[1]);
      const amount = parseInt(parts[2]); // Em centavos

      if (userId && amount) {
        await prisma.user.update({
          where: { id: userId },
          data: { walletBalance: { increment: amount } }
        });
        console.log(`[RECARGA CONCLUÍDA] ID Usuário: ${userId} - R$ ${amount/100}`);
      }
      return { success: true, type: 'RECHARGE' };
    }

    const orderId = parseInt(nsu);
    if (orderId) {
      const order = await prisma.order.findUnique({ where: { id: orderId } });
      if (!order) return { success: false, error: 'Pedido não encontrado' };

      if (order.status !== 'ENTREGUE' && order.status !== 'PAGO') {
        const updated = await prisma.order.update({
          where: { id: orderId },
          data: {
            status: 'ENTREGUE',
            paidAt: new Date(),
            deliveredAt: new Date(),
            transactionNsu: transactionId || order.transactionNsu
          }
        });
        await autoDeliverOrder(orderId);

        if (updated.userId) {
          await processAffiliateReward(updated.userId, updated.pricePaid);
        }
        console.log(`[PEDIDO CONCLUÍDO & ENTREGUE] Pedido #${orderId}`);
      }
      return { success: true, type: 'ORDER', orderId };
    }
  } catch (err) {
    console.error('[ERRO NO PROCESSAMENTO DE PAGAMENTO]:', err);
    return { success: false, error: err.message };
  }
};

// 1. Mercado Pago (Pix Transparente)
const createMercadoPagoPayment = async ({ orderNsu, amountInCents, description, customerName, customerEmail, webhookUrl, accessToken }) => {
  const amountInReais = parseFloat((amountInCents / 100).toFixed(2));
  const payload = {
    transaction_amount: amountInReais,
    description: description || `Pedido #${orderNsu}`,
    payment_method_id: 'pix',
    payer: {
      email: customerEmail || 'cliente@rdgdigital.com.br',
      first_name: customerName || 'Cliente'
    },
    notification_url: webhookUrl,
    external_reference: orderNsu.toString()
  };

  const res = await axios.post('https://api.mercadopago.com/v1/payments', payload, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'X-Idempotency-Key': `MP_${orderNsu}_${Date.now()}`
    }
  });

  const txData = res.data.point_of_interaction?.transaction_data;
  return {
    paymentType: 'PIX',
    gateway: 'MERCADO_PAGO',
    qrCode: txData?.qr_code || '',
    qrCodeBase64: txData?.qr_code_base64 || '',
    paymentUrl: txData?.ticket_url || null,
    paymentId: res.data.id?.toString()
  };
};

// 2. PushinPay (Pix Transparente)
const createPushinPayPayment = async ({ orderNsu, amountInCents, webhookUrl, token }) => {
  const payload = {
    value: amountInCents,
    webhook_url: webhookUrl,
    external_reference: orderNsu.toString()
  };

  const res = await axios.post('https://api.pushinpay.com.br/api/pix/cashIn', payload, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    }
  });

  return {
    paymentType: 'PIX',
    gateway: 'PUSHINPAY',
    qrCode: res.data.qr_code || res.data.pix_copia_e_cola || '',
    qrCodeBase64: res.data.qr_code_base64 || '',
    paymentUrl: null,
    paymentId: res.data.id?.toString()
  };
};

// 3. Asaas (Pix Transparente)
const createAsaasPayment = async ({ orderNsu, amountInCents, description, customerName, webhookUrl, apiKey }) => {
  const amountInReais = parseFloat((amountInCents / 100).toFixed(2));
  
  // Cria cobrança PIX
  const chargeRes = await axios.post('https://api.asaas.com/v3/payments', {
    billingType: 'PIX',
    value: amountInReais,
    description: description || `Pedido #${orderNsu}`,
    externalReference: orderNsu.toString(),
    dueDate: new Date(Date.now() + 24*60*60*1000).toISOString().split('T')[0]
  }, {
    headers: {
      'access_token': apiKey,
      'Content-Type': 'application/json'
    }
  });

  const paymentId = chargeRes.data.id;

  // Busca QR Code Pix
  const qrRes = await axios.get(`https://api.asaas.com/v3/payments/${paymentId}/pixQrCode`, {
    headers: { 'access_token': apiKey }
  });

  return {
    paymentType: 'PIX',
    gateway: 'ASAAS',
    qrCode: qrRes.data.payload || '',
    qrCodeBase64: qrRes.data.encodedImage || '',
    paymentUrl: chargeRes.data.invoiceUrl || null,
    paymentId: paymentId?.toString()
  };
};

// 4. InfinitePay (Checkout Link)
const createInfinitePayPayment = async ({ orderNsu, amountInCents, description, customerName, customerWhatsapp, webhookUrl, handle, apiKey }) => {
  const payload = {
    handle: handle,
    order_nsu: orderNsu.toString(),
    webhook_url: webhookUrl,
    items: [
      {
        quantity: 1,
        price: amountInCents,
        description: description || `Pedido #${orderNsu}`
      }
    ],
    customer: {
      name: customerName || 'Cliente',
      phone_number: customerWhatsapp || '11999999999'
    }
  };

  const headers = { 'Content-Type': 'application/json' };
  if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;

  const res = await axios.post('https://api.checkout.infinitepay.io/links', payload, { headers });
  return {
    paymentType: 'LINK',
    gateway: 'INFINITEPAY',
    paymentUrl: res.data.url,
    paymentId: orderNsu.toString()
  };
};

// ==========================================
// CHECKOUT MULTI-GATEWAY
// ==========================================
app.post('/api/checkout', async (req, res) => {
  const { customerName, customerWhatsapp, customerEmail, cartItems, useWallet, couponCode } = req.body;
  
  if (!cartItems || cartItems.length === 0) {
    return res.status(400).json({ error: 'Carrinho vazio' });
  }

  const userToken = getUserFromHeader(req);
  const userId = userToken ? userToken.id : null;

  try {
    // 1. Validar e buscar produtos
    let totalPrice = 0;
    const orderItemsData = [];
    
    for (let item of cartItems) {
      const product = await prisma.product.findUnique({ 
        where: { id: parseInt(item.productId) },
        include: { variations: true }
      });
      if (!product) throw new Error(`Produto ${item.productId} não encontrado`);
      if (product.badge === '🔴 ESGOTADO' || product.badge === 'ESGOTADO') throw new Error(`Produto ${product.name} está esgotado`);
      
      let finalPrice = product.price;
      if (item.variationId && product.hasVariations) {
        const variation = product.variations.find(v => v.id === parseInt(item.variationId));
        if (!variation) throw new Error(`Variação ${item.variationId} não encontrada no produto ${product.name}`);
        finalPrice = variation.price;
      }
      
      const itemPrice = finalPrice * (item.quantity || 1);
      totalPrice += itemPrice;
      
      orderItemsData.push({
        productId: product.id,
        variationId: item.variationId ? parseInt(item.variationId) : null,
        price: finalPrice,
        quantity: item.quantity || 1
      });
    }

    // 1.5 Aplicar Desconto de Cupom
    let discountAmount = 0;
    if (couponCode) {
      const coupon = await prisma.coupon.findUnique({ where: { code: couponCode.toUpperCase() } });
      if (coupon && coupon.isActive) {
        if (coupon.type === 'PERCENTAGE') {
          discountAmount = Math.floor(totalPrice * (coupon.value / 100));
        } else if (coupon.type === 'FIXED') {
          discountAmount = coupon.value;
        }
      }
    }
    
    const totalPriceWithDiscount = Math.max(0, totalPrice - discountAmount);

    // 2. Tratar Saldo da Carteira (Wallet)
    let walletUsed = 0;
    let remainingToPay = totalPriceWithDiscount;

    if (userId) {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (user && user.role === 'BANNED') {
        return res.status(403).json({ error: 'Sua conta está suspensa.' });
      }
      
      if (useWallet && user && user.walletBalance > 0) {
        if (user.walletBalance >= totalPriceWithDiscount) {
          walletUsed = totalPriceWithDiscount;
          remainingToPay = 0;
        } else {
          walletUsed = user.walletBalance;
          remainingToPay = totalPriceWithDiscount - walletUsed;
        }
      }
    }

    // 3. Criar Pedido
    const orderStatus = remainingToPay === 0 ? 'ENTREGUE' : 'PENDENTE';
    const order = await prisma.order.create({
      data: {
        userId,
        customerName: customerName || 'Cliente',
        customerWhatsapp: customerWhatsapp || '',
        pricePaid: remainingToPay, 
        walletUsed,
        status: orderStatus,
        paidAt: orderStatus === 'ENTREGUE' ? new Date() : null,
        deliveredAt: orderStatus === 'ENTREGUE' ? new Date() : null,
        items: {
          create: orderItemsData
        }
      }
    });

    if (orderStatus === 'ENTREGUE') {
      await autoDeliverOrder(order.id);
      await processAffiliateReward(userId, totalPriceWithDiscount);
    }

    if (walletUsed > 0 && userId) {
      await prisma.user.update({
        where: { id: userId },
        data: { walletBalance: { decrement: walletUsed } }
      });
    }

    // Se 100% pago com saldo
    if (remainingToPay === 0) {
      return res.json({ 
        orderId: order.id, 
        fullyPaidWithWallet: true,
        paymentType: 'WALLET'
      });
    }

    // 4. Gerar Pagamento no Gateway Ativo
    const gatewayActive = (await getSetting('gateway_active', 'MERCADO_PAGO')).toUpperCase();
    const serverUrl = process.env.PUBLIC_URL || 'https://backend-pink-one-92.vercel.app';
    let paymentResult = null;

    if (gatewayActive === 'MERCADO_PAGO') {
      const mpToken = await getSetting('mp_access_token');
      if (!mpToken) throw new Error('Mercado Pago não configurado no painel.');
      paymentResult = await createMercadoPagoPayment({
        orderNsu: order.id,
        amountInCents: remainingToPay,
        description: `Pedido #${order.id} - ${orderItemsData.length} item(s)`,
        customerName,
        customerEmail,
        webhookUrl: `${serverUrl}/api/webhook/mercadopago`,
        accessToken: mpToken
      });
    } else if (gatewayActive === 'PUSHINPAY') {
      const pushinToken = await getSetting('pushinpay_token');
      if (!pushinToken) throw new Error('PushinPay não configurado no painel.');
      paymentResult = await createPushinPayPayment({
        orderNsu: order.id,
        amountInCents: remainingToPay,
        webhookUrl: `${serverUrl}/api/webhook/pushinpay`,
        token: pushinToken
      });
    } else if (gatewayActive === 'ASAAS') {
      const asaasKey = await getSetting('asaas_api_key');
      if (!asaasKey) throw new Error('Asaas não configurado no painel.');
      paymentResult = await createAsaasPayment({
        orderNsu: order.id,
        amountInCents: remainingToPay,
        description: `Pedido #${order.id}`,
        customerName,
        webhookUrl: `${serverUrl}/api/webhook/asaas`,
        apiKey: asaasKey
      });
    } else if (gatewayActive === 'INFINITEPAY') {
      const handle = await getSetting('infinitepay_handle');
      const apiKey = await getSetting('infinitepay_api_key');
      if (!handle) throw new Error('Handle da InfinitePay não configurado no painel.');
      paymentResult = await createInfinitePayPayment({
        orderNsu: order.id,
        amountInCents: remainingToPay,
        description: `Pedido #${order.id} - ${orderItemsData.length} item(s)`,
        customerName,
        customerWhatsapp,
        webhookUrl: `${serverUrl}/api/webhook/infinitepay`,
        handle,
        apiKey
      });
    } else {
      throw new Error(`Gateway '${gatewayActive}' não suportado.`);
    }

    res.json({
      orderId: order.id,
      fullyPaidWithWallet: false,
      ...paymentResult
    });

  } catch (error) {
    console.error("Erro no checkout:", error?.response?.data || error.message);
    res.status(500).json({ error: error?.response?.data?.message || error.message || 'Erro ao processar pagamento.' });
  }
});

// ==========================================
// RECARGA DE SALDO MULTI-GATEWAY
// ==========================================
app.post('/api/wallet/recharge', async (req, res) => {
  const token = req.headers['authorization'];
  if (!token) return res.status(401).json({ error: 'Não autorizado' });
  
  try {
    const decoded = jwt.verify(token.replace('Bearer ', ''), process.env.JWT_SECRET || 'rdg_super_secret_key_2026');
    const userId = decoded.id;
    const { amount } = req.body; // Em centavos

    if (!amount || amount < 500) {
      return res.status(400).json({ error: 'O valor mínimo para recarga é de R$ 5,00.' });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: 'Usuário não encontrado.' });

    const order_nsu = `RECHARGE_${userId}_${amount}_${Date.now()}`;
    const gatewayActive = (await getSetting('gateway_active', 'MERCADO_PAGO')).toUpperCase();
    const serverUrl = process.env.PUBLIC_URL || 'https://backend-pink-one-92.vercel.app';
    let paymentResult = null;

    if (gatewayActive === 'MERCADO_PAGO') {
      const mpToken = await getSetting('mp_access_token');
      if (!mpToken) throw new Error('Mercado Pago não configurado.');
      paymentResult = await createMercadoPagoPayment({
        orderNsu: order_nsu,
        amountInCents: amount,
        description: `Recarga de Saldo - ${user.name}`,
        customerName: user.name,
        customerEmail: user.email,
        webhookUrl: `${serverUrl}/api/webhook/mercadopago`,
        accessToken: mpToken
      });
    } else if (gatewayActive === 'PUSHINPAY') {
      const pushinToken = await getSetting('pushinpay_token');
      if (!pushinToken) throw new Error('PushinPay não configurado.');
      paymentResult = await createPushinPayPayment({
        orderNsu: order_nsu,
        amountInCents: amount,
        webhookUrl: `${serverUrl}/api/webhook/pushinpay`,
        token: pushinToken
      });
    } else if (gatewayActive === 'ASAAS') {
      const asaasKey = await getSetting('asaas_api_key');
      if (!asaasKey) throw new Error('Asaas não configurado.');
      paymentResult = await createAsaasPayment({
        orderNsu: order_nsu,
        amountInCents: amount,
        description: `Recarga de Saldo - ${user.name}`,
        customerName: user.name,
        webhookUrl: `${serverUrl}/api/webhook/asaas`,
        apiKey: asaasKey
      });
    } else if (gatewayActive === 'INFINITEPAY') {
      const handle = await getSetting('infinitepay_handle');
      const apiKey = await getSetting('infinitepay_api_key');
      if (!handle) throw new Error('InfinitePay não configurado.');
      paymentResult = await createInfinitePayPayment({
        orderNsu: order_nsu,
        amountInCents: amount,
        description: `Recarga de Saldo - ${user.name}`,
        customerName: user.name,
        customerWhatsapp: '11999999999',
        webhookUrl: `${serverUrl}/api/webhook/infinitepay`,
        handle,
        apiKey
      });
    }

    res.json({
      orderNsu: order_nsu,
      ...paymentResult
    });
  } catch (error) {
    console.error("Erro na recarga:", error?.response?.data || error.message);
    res.status(500).json({ error: error?.response?.data?.message || error.message || 'Erro ao gerar recarga.' });
  }
});

// ==========================================
// STATUS DO PEDIDO / CONSULTA EM TEMPO REAL
// ==========================================
app.get('/api/orders/:id/status', async (req, res) => {
  try {
    const orderId = parseInt(req.params.id);
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, status: true, paidAt: true, deliveredAt: true }
    });
    if (!order) return res.status(404).json({ error: 'Pedido não encontrado' });
    res.json({
      id: order.id,
      status: order.status,
      isPaid: order.status === 'PAGO' || order.status === 'ENTREGUE'
    });
  } catch (e) {
    res.status(500).json({ error: 'Erro ao consultar status' });
  }
});

// ==========================================
// WEBHOOKS MULTI-GATEWAYS
// ==========================================
// 1. Mercado Pago Webhook
app.post('/api/webhook/mercadopago', async (req, res) => {
  try {
    const queryId = req.query['data.id'] || req.query.id || req.body?.data?.id || req.body?.id;
    const mpToken = await getSetting('mp_access_token');

    if (queryId && mpToken) {
      const mpRes = await axios.get(`https://api.mercadopago.com/v1/payments/${queryId}`, {
        headers: { 'Authorization': `Bearer ${mpToken}` }
      });
      const payment = mpRes.data;
      if (payment && payment.status === 'approved') {
        await handlePaymentSuccess(payment.external_reference, payment.id?.toString(), payment.transaction_amount * 100);
      }
    }
    res.status(200).send('OK');
  } catch (err) {
    console.error('Mercado Pago Webhook error:', err?.response?.data || err.message);
    res.status(200).send('ACK');
  }
});

// 2. PushinPay Webhook
app.post('/api/webhook/pushinpay', async (req, res) => {
  try {
    const data = req.body;
    if (data.status === 'paid' || data.status === 'approved' || data.status === 'PAID') {
      const extRef = data.external_reference || data.custom_id;
      await handlePaymentSuccess(extRef, data.id?.toString() || data.transaction_id, data.value);
    }
    res.status(200).send('OK');
  } catch (err) {
    console.error('PushinPay Webhook error:', err);
    res.status(200).send('ACK');
  }
});

// 3. Asaas Webhook
app.post('/api/webhook/asaas', async (req, res) => {
  try {
    const { event, payment } = req.body;
    if (event === 'PAYMENT_RECEIVED' || event === 'PAYMENT_CONFIRMED') {
      if (payment && payment.externalReference) {
        await handlePaymentSuccess(payment.externalReference, payment.id, Math.round(payment.value * 100));
      }
    }
    res.status(200).send('OK');
  } catch (err) {
    console.error('Asaas Webhook error:', err);
    res.status(200).send('ACK');
  }
});

// 4. InfinitePay Webhook
app.post('/api/webhook/infinitepay', async (req, res) => {
  const data = req.body;
  try {
    const orderNsu = data.order_nsu ? data.order_nsu.toString() : '';
    if (orderNsu) {
      await handlePaymentSuccess(orderNsu, data.transaction_nsu, null);
    }
    res.status(200).send('OK');
  } catch (error) {
    console.error('InfinitePay Webhook error:', error);
    res.status(200).send('ACK');
  }
});

// ==========================================
// ADMIN (Painel de Pedidos)
// ==========================================
app.get('/api/orders', async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
        include: {
        items: { include: { product: true, variation: true, credentials: { include: { product: true } } } },
        user: true
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar pedidos' });
  }
});

// Função helper para auto-entregar
async function autoDeliverOrder(orderId) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true }
  });
  if (!order || order.status !== 'ENTREGUE') return;

  for (const item of order.items) {
    const product = await prisma.product.findUnique({
      where: { id: item.productId },
      include: { bundleItems: true }
    });

    if (!product) continue;

    if (product.isBundle && product.bundleItems && product.bundleItems.length > 0) {
      for (const bi of product.bundleItems) {
        const needed = bi.quantity * item.quantity;
        
        // Count how many we already assigned of this specific component
        const existing = await prisma.credential.count({ 
          where: { orderId: item.id, productId: bi.componentId } 
        });
        
        if (existing >= needed) continue;
        const remaining = needed - existing;

        const freeCredentials = await prisma.credential.findMany({
          where: { isUsed: false, productId: bi.componentId },
          take: remaining
        });

        for (const cred of freeCredentials) {
          await prisma.credential.update({
            where: { id: cred.id },
            data: { isUsed: true, orderId: item.id }
          });
        }
      }
    } else {
      const needed = item.quantity;
      const existing = await prisma.credential.count({ where: { orderId: item.id } });
      if (existing >= needed) continue;
      const remaining = needed - existing;

      const freeCredentials = await prisma.credential.findMany({
        where: { 
          isUsed: false,
          productId: item.productId,
          variationId: item.variationId
        },
        take: remaining
      });

      for (const cred of freeCredentials) {
        await prisma.credential.update({
          where: { id: cred.id },
          data: { isUsed: true, orderId: item.id }
        });
      }
    }
  }
}

app.patch('/api/orders/:id/status', async (req, res) => {
  const { status } = req.body;
  const orderId = parseInt(req.params.id);
  try {
    const order = await prisma.order.update({
      where: { id: orderId },
      data: { 
        status,
        deliveredAt: status === 'ENTREGUE' ? new Date() : undefined
      }
    });
    
    if (status === 'ENTREGUE') {
      await autoDeliverOrder(orderId);
    }
    
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar pedido' });
  }
});

// ==========================================
// SETTINGS (Configurações)
// ==========================================
app.get('/api/settings', async (req, res) => {
  try {
    const settings = await prisma.setting.findMany();
    // Transformar array de key-value em objeto
    const settingsObj = settings.reduce((acc, curr) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {});
    res.json(settingsObj);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar configurações' });
  }
});

app.put('/api/settings', async (req, res) => {
  try {
    const updates = req.body; // ex: { whatsapp: "5511999999999", telegram: "meu_user" }
    for (const [key, value] of Object.entries(updates)) {
      await prisma.setting.upsert({
        where: { key },
        update: { value: String(value) },
        create: { key, value: String(value) }
      });
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar configurações' });
  }
});

// ==========================================
// ESTOQUE (Credenciais)
// ==========================================
app.get('/api/credentials', async (req, res) => {
  try {
    const creds = await prisma.credential.findMany({
      include: { product: true, variation: true, order: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json(creds);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar credenciais' });
  }
});

app.post('/api/credentials', async (req, res) => {
  try {
    const { productId, variationId, contents } = req.body;
    const data = contents.map(content => ({
      productId: parseInt(productId),
      variationId: variationId ? parseInt(variationId) : null,
      content,
      isUsed: false
    }));

    await prisma.credential.createMany({ data });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao adicionar credenciais' });
  }
});

app.delete('/api/credentials/:id', async (req, res) => {
  try {
    await prisma.credential.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao deletar credencial' });
  }
});

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor Backend rodando na porta ${PORT} (0.0.0.0)`);
});
