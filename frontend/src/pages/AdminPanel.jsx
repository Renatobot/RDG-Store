import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import {
  LayoutDashboard, Package, Plus, Edit, Trash2, Image as ImageIcon,
  Settings, User, LogOut, Key, Camera, ShoppingBag, Tag, Ticket,
  Layers, Search, CheckCircle, Clock, XCircle, RefreshCcw, Wallet,
  ChevronRight, Crown, Ban, Link2, X, Bot
} from 'lucide-react';
import StockManager from '../components/StockManager';
import AdminDashboard from '../components/AdminDashboard';
import AffiliatesPanel from '../components/AffiliatesPanel';
import { AuthContext } from '../contexts/AuthContext';
import ImageUploader from '../components/ImageUploader';

// ─── helpers ────────────────────────────────────────────────────────────────
const fmtR = c => `R$ ${(c / 100).toFixed(2).replace('.', ',')}`;
const statusCfg = {
  PAGO:     { color: 'bg-green-500/20 text-green-400 border-green-500/30',  label: 'Pago' },
  ENTREGUE: { color: 'bg-blue-500/20  text-blue-400  border-blue-500/30',   label: 'Entregue' },
  PENDENTE: { color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',label: 'Pendente' },
  CANCELADO:{ color: 'bg-red-500/20   text-red-400   border-red-500/30',    label: 'Cancelado' },
};
const StatusBadge = ({ status }) => {
  const c = statusCfg[status] || statusCfg.PENDENTE;
  return <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase border ${c.color}`}>{c.label}</span>;
};

// ─── Modal Wrapper ───────────────────────────────────────────────────────────
const Modal = ({ title, onClose, children, maxW = 'max-w-lg' }) => (
  <div className="fixed inset-0 z-[200] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto" onClick={onClose}>
    <div className={`bg-gray-950 border border-white/10 rounded-2xl w-full ${maxW} my-auto shadow-2xl`} onClick={e => e.stopPropagation()}>
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <h3 className="text-lg font-bold text-white">{title}</h3>
        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"><X size={18} /></button>
      </div>
      <div className="p-6">{children}</div>
    </div>
  </div>
);

// ─── Input / Label helpers ───────────────────────────────────────────────────
const Field = ({ label, children }) => (
  <div>
    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">{label}</label>
    {children}
  </div>
);
const inp = "w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-primary transition-colors";

// ═══════════════════════════════════════════════════════════════════════════════
export default function AdminPanel() {
  const { user, logout, setUser } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [banners, setBanners] = useState([]);
  const [users, setUsers] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [credentials, setCredentials] = useState([]);
  const [usersSearch, setUsersSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [settings, setSettings] = useState({ whatsapp: '', telegram: '', affiliate_type: 'PERCENTAGE', affiliate_value: '10' });

  const CATS = ['Streaming','Contas Premium','Combos','Telas','IPTV','Produtos Digitais','Internet Ilimitada','Inteligência Artificial','Ferramentas','Adultos','Games','APKs Premium'];
  const BADGES = ['🔥 MAIS VENDIDO','⏳ POUCAS UNIDADES','⚡ PROMOÇÃO','🔴 ESGOTADO'];

  // ── Profile modals ──
  const [pwModal, setPwModal] = useState(false);
  const [avatarModal, setAvatarModal] = useState(false);
  const [profileModal, setProfileModal] = useState(false);
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '' });
  const [avatarForm, setAvatarForm] = useState({ avatarUrl: '' });
  const [profileForm, setProfileForm] = useState({ name: '', email: '' });

  // ── Product modal ──
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [isCustomCat, setIsCustomCat] = useState(false);
  const [isCustomBadge, setIsCustomBadge] = useState(false);
  const [formData, setFormData] = useState({ name:'', description:'', price:'', originalPrice:'', validity:'', imageUrl:'', category:'Streaming', badge:'', hasVariations:false, variations:[], isVip:false, isBundle:false, bundleItems:[] });
  const [isEnhancing, setIsEnhancing] = useState(false);

  // ── Banner ──
  const [bannerUrl, setBannerUrl] = useState('');
  const [mobileBannerUrl, setMobileBannerUrl] = useState('');
  const [bannerCat, setBannerCat] = useState('');
  const [editBannerId, setEditBannerId] = useState(null);

  // ── Coupon ──
  const [couponForm, setCouponForm] = useState({ code:'', type:'PERCENTAGE', value:'' });

  // ── Product search/filter ──
  const [prodSearch, setProdSearch] = useState('');
  const [prodCatFilter, setProdCatFilter] = useState('');

  // ────────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (activeTab === 'orders') fetchOrders();
    if (activeTab === 'products') fetchProducts();
    if (activeTab === 'banners') fetchBanners();
    if (activeTab === 'users') fetchUsers();
    if (activeTab === 'coupons') fetchCoupons();
    if (activeTab === 'settings') fetchSettings();
    if (activeTab === 'stock') { fetchProducts(); fetchCredentials(); }
    let iv; if (activeTab === 'orders') iv = setInterval(fetchOrders, 5000);
    return () => clearInterval(iv);
  }, [activeTab]);

  const tok = () => localStorage.getItem('token');
  const auth = () => ({ headers: { Authorization: `Bearer ${tok()}` } });

  const fetchOrders = () => axios.get('https://streaming-store-api.onrender.com/api/orders').then(r => setOrders(r.data)).catch(console.error);
  const fetchProducts = () => axios.get('https://streaming-store-api.onrender.com/api/products').then(r => setProducts(r.data)).catch(console.error);
  const fetchBanners = () => axios.get('https://streaming-store-api.onrender.com/api/banners').then(r => setBanners(r.data)).catch(console.error);
  const fetchUsers = () => axios.get('https://streaming-store-api.onrender.com/api/users/admin/list', auth()).then(r => setUsers(r.data)).catch(console.error);
  const fetchCoupons = () => axios.get('https://streaming-store-api.onrender.com/api/coupons', auth()).then(r => setCoupons(r.data)).catch(console.error);
  const fetchSettings = () => axios.get('https://streaming-store-api.onrender.com/api/settings').then(r => setSettings(p => ({ ...p, ...r.data }))).catch(console.error);
  const fetchCredentials = () => axios.get('https://streaming-store-api.onrender.com/api/credentials').then(r => setCredentials(r.data)).catch(console.error);

  // ── Orders ──────────────────────────────────────────────────────────────────
  const markDelivered = id => axios.patch(`https://streaming-store-api.onrender.com/api/orders/${id}/status`, { status:'ENTREGUE' }).then(fetchOrders).catch(() => alert('Erro'));
  const refund = async id => {
    if (!window.confirm('Reembolsar para a carteira do cliente?')) return;
    await axios.post('https://streaming-store-api.onrender.com/api/users/admin/refund', { orderId:id }, auth()).then(fetchOrders).catch(e => alert(e.response?.data?.error || 'Erro'));
  };

  // ── Products ─────────────────────────────────────────────────────────────────
  const enhanceDescription = async () => {
    if (!formData.description) return alert("Digite pelo menos o básico do produto para a IA trabalhar.");
    setIsEnhancing(true);
    
    const prompt = `Reescreva a seguinte descrição de produto para um site de vendas premium de serviços digitais. O texto deve ser altamente persuasivo e dividido EXATAMENTE nas seguintes seções em maiúsculo (não use markdown de título como #, apenas escreva o título exato seguido de dois pontos e pule de linha):
SOBRE O SERVIÇO:
(parágrafo persuasivo)
O QUE VOCÊ VAI RECEBER:
(lista com emojis de check ✅)
INDICAÇÕES DE USO:
(lista de casos de uso usando emoji de check ou traço)
OBSERVAÇÕES DE USO:
(regras ou alertas, se houver)
INFORMAÇÕES ADICIONAIS:
(Tabela no formato Chave: Valor. Exemplo -> Plataforma: Canva).

Aqui está o texto base que você deve aprimorar e formatar:
${formData.description}`;

    try {
      const response = await axios.post('https://streaming-store-api.onrender.com/api/admin/enhance-description', { prompt }, auth());
      if (response.data.text) {
        setFormData({...formData, description: response.data.text.trim()});
      }
    } catch(err) {
      alert("Erro ao conectar com a IA.");
    } finally {
      setIsEnhancing(false);
    }
  };

  const openModal = (p = null) => {
    if (p) {
      setEditingId(p.id);
      setIsCustomCat(!CATS.includes(p.category));
      setIsCustomBadge(p.badge && !BADGES.includes(p.badge));
      setFormData({ 
        name:p.name, description:p.description||'', price:(p.price/100).toString(), originalPrice:p.originalPrice?(p.originalPrice/100).toString():'', validity:p.validity||'', imageUrl:p.imageUrl||'', category:p.category||'Streaming', badge:p.badge||'', hasVariations:p.hasVariations||false, isVip:p.isVip||false, 
        variations:(p.variations||[]).map(v => ({ name:v.name, price:(v.price/100).toString(), originalPrice:v.originalPrice?(v.originalPrice/100).toString():'', validity:v.validity||'' })),
        isBundle:p.isBundle||false,
        bundleItems:(p.bundleItems||[]).map(b => ({ componentId: b.componentId, quantity: b.quantity }))
      });
    } else {
      setEditingId(null); setIsCustomCat(false); setIsCustomBadge(false);
      setFormData({ name:'', description:'', price:'', originalPrice:'', validity:'', imageUrl:'', category:'Streaming', badge:'', hasVariations:false, variations:[], isVip:false, isBundle:false, bundleItems:[] });
    }
    setIsModalOpen(true);
  };
  const saveProduct = async e => {
    e.preventDefault();
    const payload = { 
      ...formData, 
      price: Math.round(parseFloat(formData.price.replace(',','.')||0)*100), 
      originalPrice:formData.originalPrice?Math.round(parseFloat(formData.originalPrice.replace(',','.'))*100):null, 
      variations:formData.variations.map(v=>({ name:v.name, validity:v.validity, price:Math.round(parseFloat(v.price.replace(',','.')||0)*100), originalPrice:v.originalPrice?Math.round(parseFloat(v.originalPrice.replace(',','.'))*100):null })),
      bundleItems:formData.bundleItems.map(b=>({ componentId: parseInt(b.componentId), quantity: parseInt(b.quantity) }))
    };
    try { editingId ? await axios.put(`https://streaming-store-api.onrender.com/api/products/${editingId}`, payload) : await axios.post('https://streaming-store-api.onrender.com/api/products', payload); setIsModalOpen(false); fetchProducts(); } catch { alert('Erro ao salvar produto'); }
  };
  const deleteProduct = async id => { if (!window.confirm('Excluir produto?')) return; await axios.delete(`https://streaming-store-api.onrender.com/api/products/${id}`).then(fetchProducts).catch(()=>alert('Erro')); };

  // ── Banners ──────────────────────────────────────────────────────────────────
  const saveBanner = async e => {
    e.preventDefault();
    if (!bannerUrl) return;
    editBannerId ? await axios.put(`https://streaming-store-api.onrender.com/api/banners/${editBannerId}`, { imageUrl:bannerUrl, mobileImageUrl: mobileBannerUrl, category:bannerCat }) : await axios.post('https://streaming-store-api.onrender.com/api/banners', { imageUrl:bannerUrl, mobileImageUrl: mobileBannerUrl, category:bannerCat });
    setBannerUrl(''); setMobileBannerUrl(''); setBannerCat(''); setEditBannerId(null); fetchBanners();
  };

  // ── Coupons ──────────────────────────────────────────────────────────────────
  const addCoupon = async e => { e.preventDefault(); try { await axios.post('https://streaming-store-api.onrender.com/api/coupons', couponForm, auth()); setCouponForm({ code:'', type:'PERCENTAGE', value:'' }); fetchCoupons(); } catch { alert('Erro. Código já existe?'); } };
  const deleteCoupon = async id => { if (!window.confirm('Excluir cupom?')) return; await axios.delete(`https://streaming-store-api.onrender.com/api/coupons/${id}`, auth()).then(fetchCoupons); };
  const toggleCoupon = async (id, active) => { await axios.put(`https://streaming-store-api.onrender.com/api/coupons/${id}`, { isActive:!active }, auth()).then(fetchCoupons); };

  // ── Settings ─────────────────────────────────────────────────────────────────
  const saveSettings = async e => { e.preventDefault(); try { await axios.put('https://streaming-store-api.onrender.com/api/settings', settings); alert('Salvo!'); } catch { alert('Erro'); } };

  // ── Profile ──────────────────────────────────────────────────────────────────
  const changePw = async e => { e.preventDefault(); try { await axios.put('https://streaming-store-api.onrender.com/api/users/me/password', pwForm, auth()); alert('Senha alterada!'); setPwModal(false); setPwForm({ currentPassword:'', newPassword:'' }); } catch(err){ alert(err.response?.data?.error||'Erro'); } };
  const changeAvatar = async e => { e.preventDefault(); try { const r = await axios.put('https://streaming-store-api.onrender.com/api/users/me/avatar', avatarForm, auth()); setUser(r.data.user); alert('Foto alterada!'); setAvatarModal(false); } catch(err){ alert(err.response?.data?.error||'Erro'); } };
  const changeProfile = async e => { e.preventDefault(); try { const r = await axios.put('https://streaming-store-api.onrender.com/api/users/me/profile', profileForm, auth()); setUser(r.data.user); alert('Perfil atualizado!'); setProfileModal(false); } catch(err){ alert(err.response?.data?.error||'Erro'); } };

  // ── Derived ──────────────────────────────────────────────────────────────────
  const filteredUsers = users.filter(u => { const s = usersSearch.toLowerCase(); return !s || u.id.toString().includes(s) || u.name.toLowerCase().includes(s) || u.email.toLowerCase().includes(s); });
  const filteredProds = products.filter(p => { const s = prodSearch.toLowerCase(); const catOk = !prodCatFilter || p.category === prodCatFilter; const nameOk = !s || p.name.toLowerCase().includes(s); return catOk && nameOk; });

  const tabs = [
    { id:'dashboard', icon:<LayoutDashboard size={16}/>, label:'Dashboard' },
    { id:'orders',    icon:<ShoppingBag size={16}/>,    label:'Pedidos',  badge: orders.filter(o=>o.status==='PAGO').length || null },
    { id:'products',  icon:<Package size={16}/>,        label:'Produtos' },
    { id:'banners',   icon:<ImageIcon size={16}/>,       label:'Banners' },
    { id:'users',     icon:<User size={16}/>,            label:'Clientes' },
    { id:'coupons',   icon:<Ticket size={16}/>,          label:'Cupons' },
    { id:'affiliates',icon:<Link2 size={16}/>,           label:'Afiliados' },
    { id:'stock',     icon:<Layers size={16}/>,          label:'Estoque' },
    { id:'settings',  icon:<Settings size={16}/>,        label:'Configurações' },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* ─── TOP BAR ──────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/10 px-6 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {settings?.logo_url ? (
            <img src={settings.logo_url} alt="Logo" className="h-12 md:h-14 w-auto object-contain" />
          ) : (
            <span className="text-white font-black text-lg tracking-tight">STREAM<span className="text-primary">STORE</span></span>
          )}
          <span className="text-gray-600 hidden sm:block">·</span>
          <span className="text-gray-400 text-sm hidden sm:block">Painel Admin</span>
        </div>

        {user && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white font-bold text-sm uppercase overflow-hidden border border-primary/30 shrink-0">
                {user.avatarUrl ? <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" /> : user.name.charAt(0)}
              </div>
              <div className="hidden sm:block">
                <div className="text-white text-sm font-bold leading-none">{user.name}</div>
                <div className="text-gray-500 text-xs mt-0.5">{user.email}</div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => { setProfileForm({ name:user.name, email:user.email }); setProfileModal(true); }} title="Editar Perfil" className="p-2 hover:bg-white/10 text-gray-400 hover:text-white rounded-lg transition-colors border border-white/10"><Edit size={15}/></button>
              <button onClick={() => setAvatarModal(true)} title="Trocar Foto" className="p-2 hover:bg-white/10 text-gray-400 hover:text-white rounded-lg transition-colors border border-white/10"><Camera size={15}/></button>
              <button onClick={() => setPwModal(true)} title="Mudar Senha" className="p-2 hover:bg-white/10 text-gray-400 hover:text-white rounded-lg transition-colors border border-white/10"><Key size={15}/></button>
              <button onClick={logout} title="Sair" className="p-2 hover:bg-red-500/20 text-red-500 rounded-lg transition-colors border border-red-500/20"><LogOut size={15}/></button>
            </div>
          </div>
        )}
      </header>

      <div className="flex">
        {/* ─── SIDEBAR ────────────────────────────────────────────────── */}
        <aside className="hidden md:flex flex-col w-56 shrink-0 min-h-[calc(100vh-57px)] bg-black/40 border-r border-white/10 sticky top-[57px] h-[calc(100vh-57px)] overflow-y-auto">
          <nav className="p-3 space-y-1 flex-1">
            {tabs.map(t => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === t.id ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
              >
                {t.icon}
                <span className="flex-1 text-left">{t.label}</span>
                {t.badge ? <span className="bg-red-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full min-w-[18px] text-center">{t.badge}</span> : null}
              </button>
            ))}
          </nav>
        </aside>

        {/* ─── MOBILE TAB BAR ─────────────────────────────────────────── */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-black/50 backdrop-blur-3xl border-t border-white/10 flex overflow-x-auto hide-scrollbar">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} className={`flex-shrink-0 flex flex-col items-center justify-center gap-1.5 min-w-[80px] px-2 py-3.5 text-[11px] font-bold transition-all relative ${activeTab === t.id ? 'text-primary bg-primary/10' : 'text-gray-400'}`}>
              {React.cloneElement(t.icon, { size: 20 })}
              <span className="block whitespace-nowrap">{t.label}</span>
              {t.badge ? <span className="absolute top-1.5 right-1.5 bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">{t.badge}</span> : null}
            </button>
          ))}
        </div>

        {/* ─── MAIN CONTENT ───────────────────────────────────────────── */}
        <main className="flex-1 min-w-0 p-4 md:p-6 pb-20 md:pb-6">

          {/* ══ DASHBOARD ══════════════════════════════════════════════ */}
          {activeTab === 'dashboard' && <AdminDashboard />}

          {/* ══ ORDERS ═════════════════════════════════════════════════ */}
          {activeTab === 'orders' && (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <ShoppingBag className="text-primary" size={22} />
                <h2 className="text-xl font-bold text-white">Pedidos</h2>
                <span className="bg-white/10 text-gray-400 text-xs px-2 py-0.5 rounded-full">{orders.length} total</span>
              </div>

              <div className="space-y-3">
                {orders.length === 0 && <div className="text-center py-16 text-gray-600 bg-black/20 rounded-2xl border border-white/5">Nenhum pedido ainda.</div>}
                {orders.map(order => (
                  <div key={order.id} className="bg-black/40 border border-white/10 rounded-2xl overflow-hidden hover:border-white/20 transition-colors">
                    {/* Header */}
                    <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-white/5">
                      <div className="flex items-center gap-3">
                        <span className="text-gray-400 text-sm font-mono">#{order.id + 31794}</span>
                        <StatusBadge status={order.status} />
                        {order.user && <span className="text-primary text-xs font-medium">{order.user.name}</span>}
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-white font-black">{fmtR(order.pricePaid + (order.walletUsed || 0))}</div>
                          {order.walletUsed > 0 && <div className="text-primary text-[10px]">-{fmtR(order.walletUsed)} Carteira</div>}
                        </div>
                        <div className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleDateString('pt-BR')}</div>
                      </div>
                    </div>

                    {/* Body */}
                    <div className="px-5 py-3 flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <div className="text-sm font-bold text-white mb-0.5">{order.customerName}</div>
                        <a href={`https://wa.me/55${order.customerWhatsapp}`} target="_blank" rel="noreferrer" className="text-xs text-green-400 hover:underline">{order.customerWhatsapp}</a>
                        <div className="mt-2 space-y-1">
                          {order.items?.map((i, idx) => (
                            <div key={idx}>
                              <span className="text-xs text-gray-300">{i.quantity}x {i.product?.name}{i.variation ? ` (${i.variation.name})` : ''}</span>
                              {i.credentials?.length > 0 && (
                                <div className="mt-1 bg-green-500/10 border border-green-500/20 rounded-lg p-2 text-[11px] font-mono text-green-300 space-y-0.5">
                                  {i.credentials.map((c, ci) => {
                                    try { const p = JSON.parse(c.content); return <div key={ci}>{p.login && `📧 ${p.login}`}{p.password && ` · 🔐 ${p.password}`}{p.notes && <span className="text-gray-400"> · {p.notes}</span>}</div>; }
                                    catch { return <div key={ci}>{c.content}</div>; }
                                  })}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 shrink-0">
                        {order.status === 'PAGO' && (
                          <button onClick={() => markDelivered(order.id)} className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors">
                            <CheckCircle size={13}/> Marcar Entregue
                          </button>
                        )}
                        {order.status === 'ENTREGUE' && <span className="text-xs text-blue-400 flex items-center gap-1"><CheckCircle size={13}/> Entregue</span>}
                        {(order.status === 'PAGO' || order.status === 'ENTREGUE') && (
                          order.userId
                            ? <button onClick={() => refund(order.id)} className="flex items-center gap-1.5 bg-primary/20 hover:bg-primary/40 text-primary border border-primary/30 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"><RefreshCcw size={13}/> Reembolsar</button>
                            : <span className="text-[11px] text-gray-600 border border-white/5 px-2 py-1 rounded-lg">Sem conta vinculada</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ══ PRODUCTS ═══════════════════════════════════════════════ */}
          {activeTab === 'products' && (
            <div>
              <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <Package className="text-primary" size={22} />
                  <h2 className="text-xl font-bold text-white">Produtos</h2>
                  <span className="bg-white/10 text-gray-400 text-xs px-2 py-0.5 rounded-full">{products.length}</span>
                </div>
                <button onClick={() => openModal()} className="flex items-center gap-2 bg-primary hover:bg-primary/80 text-white px-4 py-2 rounded-xl font-bold text-sm shadow-lg shadow-primary/20 transition-colors">
                  <Plus size={16}/> Novo Produto
                </button>
              </div>

              {/* Filtros */}
              <div className="flex flex-wrap gap-3 mb-5">
                <div className="relative flex-1 min-w-44">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input value={prodSearch} onChange={e => setProdSearch(e.target.value)} placeholder="Buscar produto..." className={`${inp} pl-9`} />
                </div>
                <select value={prodCatFilter} onChange={e => setProdCatFilter(e.target.value)} className={inp + ' w-auto'}>
                  <option value="">Todas as categorias</option>
                  {CATS.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredProds.map(p => (
                  <div key={p.id} className="bg-black/40 border border-white/10 rounded-2xl overflow-hidden hover:border-white/25 hover:shadow-lg hover:shadow-primary/10 transition-all group flex flex-col">
                    {p.imageUrl
                      ? <div className="w-full aspect-video overflow-hidden bg-black"><img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" /></div>
                      : <div className="w-full aspect-video bg-white/5 flex items-center justify-center text-gray-700"><Package size={32}/></div>
                    }
                    <div className="p-4 flex flex-col flex-1">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className="bg-white/10 text-gray-400 text-[10px] px-2 py-0.5 rounded font-medium">{p.category}</span>
                        {p.badge && <span className="bg-primary/20 text-primary text-[10px] px-2 py-0.5 rounded font-bold">{p.badge}</span>}
                        {p.isVip && <span className="bg-yellow-500/20 text-yellow-400 text-[10px] px-2 py-0.5 rounded font-bold">👑 VIP</span>}
                      </div>
                      <h3 className="text-white font-bold text-sm mb-1 leading-tight">{p.name}</h3>
                      {p.description && <p className="text-gray-500 text-[11px] line-clamp-2 mb-3">{p.description}</p>}
                      <div className="mt-auto pt-3 border-t border-white/5 flex items-center justify-between">
                        <div>
                          {p.originalPrice && <div className="text-gray-600 text-[11px] line-through">{fmtR(p.originalPrice)}</div>}
                          <div className="text-primary font-black">{fmtR(p.price)}</div>
                        </div>
                        <div className="flex gap-1">
                          <button onClick={() => openModal(p)} className="p-2 hover:bg-white/10 text-gray-400 hover:text-white rounded-lg transition-colors"><Edit size={14}/></button>
                          <button onClick={() => deleteProduct(p.id)} className="p-2 hover:bg-red-500/20 text-gray-600 hover:text-red-500 rounded-lg transition-colors"><Trash2 size={14}/></button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {filteredProds.length === 0 && (
                  <div className="col-span-full text-center py-16 text-gray-600 bg-black/20 rounded-2xl border border-white/5">Nenhum produto encontrado.</div>
                )}
              </div>
            </div>
          )}

          {/* ══ BANNERS ════════════════════════════════════════════════ */}
          {activeTab === 'banners' && (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <ImageIcon className="text-primary" size={22} />
                <h2 className="text-xl font-bold text-white">Banners</h2>
              </div>

              <div className="bg-black/40 border border-white/10 rounded-2xl p-5 mb-6">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">{editBannerId ? '✏️ Editando Banner' : '➕ Adicionar Banner'}</h3>
                <form onSubmit={saveBanner} className="flex flex-col gap-3">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1">
                      <ImageUploader value={bannerUrl} onChange={setBannerUrl} placeholder="Link Desktop (Proporção 21:9 - ex: 1920x600)..." />
                    </div>
                    <select value={bannerCat} onChange={e => setBannerCat(e.target.value)} className={`${inp} sm:w-44`}>
                      <option value="">Sem link de categoria</option>
                      {CATS.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1">
                      <ImageUploader value={mobileBannerUrl} onChange={setMobileBannerUrl} placeholder="Link Mobile (Opcional - Proporção 1:1 - ex: 1080x1080)..." />
                    </div>
                    <button type="submit" className="bg-primary hover:bg-primary/80 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-colors shrink-0">{editBannerId ? 'Salvar Alterações' : 'Adicionar Banner'}</button>
                    {editBannerId && <button type="button" onClick={() => { setEditBannerId(null); setBannerUrl(''); setMobileBannerUrl(''); setBannerCat(''); }} className="bg-white/10 hover:bg-white/20 text-white px-4 py-2.5 rounded-xl text-sm transition-colors">Cancelar</button>}
                  </div>
                </form>
                {(bannerUrl || mobileBannerUrl) && (
                  <div className="mt-4 flex gap-4 flex-wrap">
                    {bannerUrl && <div><p className="text-xs text-gray-500 mb-2">Prévia Desktop:</p><img src={bannerUrl} alt="preview desktop" className="w-full max-w-sm aspect-[21/9] object-cover rounded-xl border border-white/10" /></div>}
                    {mobileBannerUrl && <div><p className="text-xs text-gray-500 mb-2">Prévia Mobile:</p><img src={mobileBannerUrl} alt="preview mobile" className="h-32 aspect-square object-cover rounded-xl border border-white/10" /></div>}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {banners.map(b => (
                  <div key={b.id} className="relative group rounded-2xl overflow-hidden border border-white/10 bg-black/50 flex">
                    <img src={b.imageUrl} alt="Desktop" className="w-2/3 aspect-[21/9] object-cover" />
                    {b.mobileImageUrl ? (
                      <img src={b.mobileImageUrl} alt="Mobile" className="w-1/3 aspect-[21/9] object-cover border-l border-white/10" />
                    ) : (
                      <div className="w-1/3 flex items-center justify-center bg-white/5 border-l border-white/10"><span className="text-[10px] text-gray-600 text-center px-2">Sem versão Mobile</span></div>
                    )}
                    {b.category && <div className="absolute top-3 left-3 bg-primary/90 px-3 py-1 text-xs font-bold text-white rounded-lg shadow">{b.category}</div>}
                    <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                      <button onClick={() => { setEditBannerId(b.id); setBannerUrl(b.imageUrl); setMobileBannerUrl(b.mobileImageUrl || ''); setBannerCat(b.category||''); window.scrollTo({top:0,behavior:'smooth'}); }} className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-xl transition-colors"><Edit size={18}/></button>
                      <button onClick={() => { if(window.confirm('Excluir banner?')) axios.delete(`https://streaming-store-api.onrender.com/api/banners/${b.id}`).then(fetchBanners); }} className="bg-red-600 hover:bg-red-700 text-white p-3 rounded-xl transition-colors"><Trash2 size={18}/></button>
                    </div>
                  </div>
                ))}
                {banners.length === 0 && <div className="col-span-full text-center py-12 text-gray-600 bg-black/20 rounded-2xl border border-white/5">Nenhum banner cadastrado.</div>}
              </div>
            </div>
          )}

          {/* ══ USERS ══════════════════════════════════════════════════ */}
          {activeTab === 'users' && (
            <div>
              <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <User className="text-primary" size={22} />
                  <h2 className="text-xl font-bold text-white">Clientes</h2>
                  <span className="bg-white/10 text-gray-400 text-xs px-2 py-0.5 rounded-full">{users.length}</span>
                </div>
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input value={usersSearch} onChange={e => setUsersSearch(e.target.value)} placeholder="Buscar por nome, email, ID..." className={`${inp} pl-9 w-64`} />
                </div>
              </div>

              <div className="bg-black/40 border border-white/10 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-black/60 border-b border-white/10">
                      <tr>
                        {['ID','Nome','Email','Saldo','Status','Ações'].map(h => (
                          <th key={h} className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {filteredUsers.map(u => (
                        <tr key={u.id} className="hover:bg-white/[0.03] transition-colors cursor-pointer" onClick={() => setSelectedUser(u)}>
                          <td className="px-4 py-3 text-gray-500 text-xs">#{u.id}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold overflow-hidden shrink-0">
                                {u.avatarUrl ? <img src={u.avatarUrl} alt="" className="w-full h-full object-cover" /> : u.name.charAt(0)}
                              </div>
                              <div>
                                <div className="text-white text-xs font-bold flex items-center gap-1">{u.name} {u.isVip && <span className="text-yellow-400 text-[10px]">👑</span>}</div>
                                <div className="text-gray-600 text-[10px]">{u.orders?.length||0} pedido(s)</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-gray-400 text-xs">{u.email}</td>
                          <td className="px-4 py-3 text-green-400 font-bold text-sm">{fmtR(u.walletBalance||0)}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase border ${u.role==='BANNED' ? 'bg-red-500/20 text-red-400 border-red-500/30' : u.isVip ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' : 'bg-green-500/20 text-green-400 border-green-500/30'}`}>
                              {u.role==='BANNED' ? 'Banido' : u.isVip ? 'VIP' : 'Ativo'}
                            </span>
                          </td>
                          <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                            <div className="flex items-center gap-1.5">
                              <button onClick={async () => {
                                const v = window.prompt('Valor a adicionar na carteira (Ex: 50.00)');
                                if (!v) return;
                                const amt = Math.round(parseFloat(v.replace(',','.'))*100);
                                if (isNaN(amt)||amt<=0) return alert('Inválido');
                                await axios.post('https://streaming-store-api.onrender.com/api/users/admin/add-balance', { userId:u.id, amount:amt }, auth()); fetchUsers();
                              }} className="bg-green-600/20 hover:bg-green-600 text-green-400 hover:text-white border border-green-500/30 px-2 py-1 rounded-lg text-[11px] font-bold transition-colors" title="Adicionar saldo">
                                <Wallet size={12}/>
                              </button>
                              <button onClick={async () => {
                                await axios.post('https://streaming-store-api.onrender.com/api/users/admin/vip', { userId:u.id, vip:!u.isVip }, auth());
                                if (u.id === user?.id) { const me = await axios.get('https://streaming-store-api.onrender.com/api/auth/me', auth()); setUser(me.data); }
                                fetchUsers();
                              }} className={`${u.isVip ? 'bg-yellow-500/20 hover:bg-yellow-500 text-yellow-400' : 'bg-gray-700 hover:bg-yellow-500 text-gray-400'} hover:text-white border border-white/10 px-2 py-1 rounded-lg text-[11px] font-bold transition-colors`} title={u.isVip?'Remover VIP':'Tornar VIP'}>
                                <Crown size={12}/>
                              </button>
                              <button onClick={async () => {
                                if (!window.confirm(u.role==='BANNED'?'Desbanir?':'Banir este usuário?')) return;
                                await axios.post('https://streaming-store-api.onrender.com/api/users/admin/ban', { userId:u.id, ban:u.role!=='BANNED' }, auth()); fetchUsers();
                              }} className={`${u.role==='BANNED' ? 'bg-gray-600/20 hover:bg-gray-600 text-gray-400' : 'bg-red-500/20 hover:bg-red-600 text-red-400'} hover:text-white border border-red-500/20 px-2 py-1 rounded-lg text-[11px] font-bold transition-colors`} title={u.role==='BANNED'?'Desbanir':'Banir'}>
                                <Ban size={12}/>
                              </button>
                              <button onClick={() => setSelectedUser(u)} className="bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white px-2 py-1 rounded-lg text-[11px] transition-colors" title="Ver detalhes">
                                <ChevronRight size={12}/>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {filteredUsers.length === 0 && (
                        <tr><td colSpan={6} className="px-4 py-12 text-center text-gray-600">Nenhum cliente encontrado.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ══ COUPONS ════════════════════════════════════════════════ */}
          {activeTab === 'coupons' && (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <Ticket className="text-primary" size={22} />
                <h2 className="text-xl font-bold text-white">Cupons de Desconto</h2>
              </div>

              <div className="bg-black/40 border border-white/10 rounded-2xl p-5 mb-6">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">➕ Criar Cupom</h3>
                <form onSubmit={addCoupon} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs text-gray-500 mb-1">Código</label>
                    <input required value={couponForm.code} onChange={e => setCouponForm({...couponForm, code:e.target.value.toUpperCase()})} placeholder="BEMVINDO10" className={inp} />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Tipo</label>
                    <select value={couponForm.type} onChange={e => setCouponForm({...couponForm, type:e.target.value})} className={inp}>
                      <option value="PERCENTAGE">Porcentagem (%)</option>
                      <option value="FIXED">Valor Fixo (R$)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Valor</label>
                    <input type="number" required min="1" value={couponForm.value} onChange={e => setCouponForm({...couponForm, value:e.target.value})} placeholder="10" className={inp} />
                  </div>
                  <div className="sm:col-span-4">
                    <button type="submit" className="bg-primary hover:bg-primary/80 text-white px-6 py-2.5 rounded-xl font-bold text-sm transition-colors shadow-lg shadow-primary/20">Criar Cupom</button>
                  </div>
                </form>
              </div>

              <div className="bg-black/40 border border-white/10 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-black/60 border-b border-white/10">
                      <tr>
                        {['Código','Desconto','Status','Criado em','Ações'].map(h => <th key={h} className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{h}</th>)}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {coupons.map(c => (
                        <tr key={c.id} className={`hover:bg-white/[0.03] transition-colors ${!c.isActive?'opacity-50':''}`}>
                          <td className="px-4 py-3"><span className="bg-primary/20 text-primary font-black text-sm px-3 py-1 rounded-lg font-mono">{c.code}</span></td>
                          <td className="px-4 py-3 text-white font-bold">{c.type==='PERCENTAGE' ? `${c.value}%` : fmtR(c.value)}</td>
                          <td className="px-4 py-3"><span className={`px-2.5 py-0.5 rounded-full text-[11px] font-black border ${c.isActive ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'}`}>{c.isActive ? 'Ativo' : 'Inativo'}</span></td>
                          <td className="px-4 py-3 text-gray-500 text-xs">{new Date(c.createdAt).toLocaleDateString('pt-BR')}</td>
                          <td className="px-4 py-3">
                            <div className="flex gap-2">
                              <button onClick={() => toggleCoupon(c.id, c.isActive)} className="bg-white/10 hover:bg-white/20 text-white px-3 py-1 rounded-lg text-xs font-bold transition-colors">{c.isActive ? 'Desativar' : 'Ativar'}</button>
                              <button onClick={() => deleteCoupon(c.id)} className="bg-red-500/20 hover:bg-red-500 text-red-400 hover:text-white px-3 py-1 rounded-lg text-xs font-bold transition-colors">Excluir</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {coupons.length === 0 && <tr><td colSpan={5} className="px-4 py-12 text-center text-gray-600">Nenhum cupom cadastrado.</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ══ AFFILIATES ═══════════════════════════════════════════════ */}
          {activeTab === 'affiliates' && (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <Link2 className="text-primary" size={22} />
                <h2 className="text-xl font-bold text-white">Programa de Afiliados</h2>
              </div>
              <AffiliatesPanel />
            </div>
          )}

          {/* ══ STOCK ══════════════════════════════════════════════════ */}
          {activeTab === 'stock' && (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <Layers className="text-primary" size={22} />
                <h2 className="text-xl font-bold text-white">Gerenciador de Estoque</h2>
              </div>
              <StockManager products={products} credentials={credentials} onSuccess={fetchCredentials} />
            </div>
          )}

          {/* ══ SETTINGS ═══════════════════════════════════════════════ */}
          {activeTab === 'settings' && (
            <div className="max-w-2xl">
              <div className="flex items-center gap-3 mb-6">
                <Settings className="text-primary" size={22} />
                <h2 className="text-xl font-bold text-white">Configurações</h2>
              </div>
              <form onSubmit={saveSettings} className="space-y-6">
                <div className="bg-black/40 border border-white/10 rounded-2xl p-6 space-y-5">
                  <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">💬 Canais de Suporte</h3>
                  <Field label="WhatsApp (Suporte)">
                    <input type="text" value={settings.whatsapp} onChange={e => setSettings({...settings, whatsapp:e.target.value})} placeholder="5511999999999" className={inp} />
                    <p className="text-xs text-gray-600 mt-1">Código do país (55) + DDD + número. Sem espaços.</p>
                  </Field>
                  <Field label="Telegram (Suporte)">
                    <input type="text" value={settings.telegram} onChange={e => setSettings({...settings, telegram:e.target.value})} placeholder="@seusuporte" className={inp} />
                  </Field>
                </div>

                <div className="bg-black/40 border border-white/10 rounded-2xl p-6 space-y-5">
                  <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">🎨 Identidade Visual</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="Logo (URL ou Upload)">
                      <ImageUploader value={settings.logo_url} onChange={val => setSettings({...settings, logo_url:val})} placeholder="https://..." />
                    </Field>
                    <Field label="Favicon (URL ou Upload)">
                      <ImageUploader value={settings.favicon_url} onChange={val => setSettings({...settings, favicon_url:val})} placeholder="https://..." />
                      <p className="text-xs text-gray-600 mt-1">Ícone que aparece na aba do navegador.</p>
                    </Field>
                  </div>
                </div>

                <div className="bg-black/40 border border-white/10 rounded-2xl p-6 space-y-5">
                  <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">🤝 Programa de Afiliados</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Tipo de Recompensa">
                      <select value={settings.affiliate_type} onChange={e => setSettings({...settings, affiliate_type:e.target.value})} className={inp}>
                        <option value="PERCENTAGE">Porcentagem (%)</option>
                        <option value="FIXED">Valor Fixo (R$)</option>
                      </select>
                    </Field>
                    <Field label="Valor da Recompensa">
                      <input type="number" value={settings.affiliate_value} onChange={e => setSettings({...settings, affiliate_value:e.target.value})} className={inp} />
                    </Field>
                  </div>
                </div>

                <button type="submit" className="w-full bg-primary hover:bg-primary/80 text-white font-black py-3 rounded-xl text-sm shadow-lg shadow-primary/20 transition-colors">
                  Salvar Configurações
                </button>
              </form>
            </div>
          )}

        </main>
      </div>

      {/* ═══ MODALS ══════════════════════════════════════════════════════ */}

      {/* User Detail Modal */}
      {selectedUser && (
        <Modal title={`Cliente: ${selectedUser.name}`} onClose={() => setSelectedUser(null)} maxW="max-w-3xl">
          <div className="space-y-5">
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-black/50 rounded-xl p-4 text-center border border-white/5">
                <div className="text-xs text-gray-500 mb-1">Saldo</div>
                <div className="text-xl font-black text-green-400">{fmtR(selectedUser.walletBalance||0)}</div>
              </div>
              <div className="bg-black/50 rounded-xl p-4 text-center border border-white/5">
                <div className="text-xs text-gray-500 mb-1">Pedidos</div>
                <div className="text-xl font-black text-white">{selectedUser.orders?.length||0}</div>
              </div>
              <div className="bg-black/50 rounded-xl p-4 text-center border border-white/5">
                <div className="text-xs text-gray-500 mb-1">Status</div>
                <div className={`text-sm font-black ${selectedUser.role==='BANNED'?'text-red-400':selectedUser.isVip?'text-yellow-400':'text-green-400'}`}>
                  {selectedUser.role==='BANNED'?'Banido':selectedUser.isVip?'👑 VIP':'Ativo'}
                </div>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3 pb-2 border-b border-white/10">Histórico de Pedidos</h4>
              {!selectedUser.orders?.length
                ? <p className="text-gray-600 text-center py-6">Nenhum pedido.</p>
                : <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                    {selectedUser.orders.map(o => (
                      <div key={o.id} className="bg-black/50 border border-white/5 rounded-xl p-4 flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-white font-bold text-sm">#{o.id + 31794}</span>
                            <StatusBadge status={o.status} />
                          </div>
                          <div className="text-xs text-gray-500">{new Date(o.createdAt).toLocaleString('pt-BR')}</div>
                          <div className="text-xs text-gray-400 mt-1">{o.items?.map(i => `${i.quantity}x ${i.product?.name}`).join(', ')}</div>
                        </div>
                        <div className="text-primary font-black shrink-0">{fmtR(o.pricePaid)}</div>
                      </div>
                    ))}
                  </div>
              }
            </div>
          </div>
        </Modal>
      )}

      {/* Product Modal */}
      {isModalOpen && (
        <Modal title={editingId ? 'Editar Produto' : 'Novo Produto'} onClose={() => setIsModalOpen(false)}>
          <form onSubmit={saveProduct} className="space-y-4">
            <Field label="Nome do Produto">
              <input type="text" required value={formData.name} onChange={e => setFormData({...formData,name:e.target.value})} placeholder="Ex: Netflix 4K" className={inp} />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Categoria">
                <select value={isCustomCat?'Personalizada':formData.category} onChange={e => { if(e.target.value==='Personalizada'){setIsCustomCat(true);setFormData({...formData,category:''});}else{setIsCustomCat(false);setFormData({...formData,category:e.target.value});}}} className={`${inp} mb-2`}>
                  {CATS.map(c => <option key={c}>{c}</option>)}
                  <option value="Personalizada">Personalizada...</option>
                </select>
                {isCustomCat && <input type="text" required value={formData.category} onChange={e => setFormData({...formData,category:e.target.value})} placeholder="Nome da Categoria" className={inp} />}
              </Field>
              <Field label="Etiqueta (Badge)">
                <select value={isCustomBadge?'Personalizada':(formData.badge||'')} onChange={e => { if(e.target.value==='Personalizada'){setIsCustomBadge(true);setFormData({...formData,badge:''});}else{setIsCustomBadge(false);setFormData({...formData,badge:e.target.value});}}} className={`${inp} mb-2`}>
                  <option value="">Nenhuma</option>
                  {BADGES.map(b => <option key={b}>{b}</option>)}
                  <option value="Personalizada">Personalizada...</option>
                </select>
                {isCustomBadge && <input type="text" value={formData.badge} onChange={e => setFormData({...formData,badge:e.target.value})} placeholder="Ex: 🎁 PRESENTE" className={inp} />}
              </Field>
            </div>

            <div className="mb-4">
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">Descrição</label>
                <button type="button" onClick={enhanceDescription} disabled={isEnhancing} className="text-xs font-bold flex items-center gap-1.5 bg-gradient-to-r from-purple-600 to-primary text-white hover:opacity-80 px-3 py-1.5 rounded-lg transition-all disabled:opacity-50 shadow-lg shadow-purple-500/20">
                  <Bot size={14} /> {isEnhancing ? 'Mágica acontecendo...' : 'Aprimorar com IA'}
                </button>
              </div>
              <textarea value={formData.description} onChange={e => setFormData({...formData,description:e.target.value})} className={`${inp} h-32 resize-y`} placeholder="Descreva o produto ou digite o básico e deixe a IA fazer a mágica..." />
            </div>

            <div className="flex items-center gap-6 mb-2 border-t border-white/5 pt-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={formData.isBundle} onChange={e => setFormData({...formData,isBundle:e.target.checked, hasVariations:false})} className="w-4 h-4 rounded" />
                <span className="text-sm font-bold text-white bg-primary/20 px-2 py-1 rounded">📦 É um Combo?</span>
              </label>
              {!formData.isBundle && (
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={formData.hasVariations} onChange={e => setFormData({...formData,hasVariations:e.target.checked})} className="w-4 h-4 rounded" />
                  <span className="text-sm text-gray-300">Tem variações</span>
                </label>
              )}
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={formData.isVip} onChange={e => setFormData({...formData,isVip:e.target.checked})} className="w-4 h-4 rounded" />
                <span className="text-sm text-yellow-400">👑 Produto VIP</span>
              </label>
            </div>

            {formData.isBundle ? (
              <div className="grid grid-cols-3 gap-3">
                <Field label="Preço do Combo (R$)"><input type="text" required value={formData.price} onChange={e => setFormData({...formData,price:e.target.value})} placeholder="29,90" className={inp} /></Field>
                <Field label="Preço Riscado"><input type="text" value={formData.originalPrice} onChange={e => setFormData({...formData,originalPrice:e.target.value})} placeholder="69,90" className={inp} /></Field>
                <Field label="Validade"><input type="text" required value={formData.validity} onChange={e => setFormData({...formData,validity:e.target.value})} placeholder="30 dias" className={inp} /></Field>
              </div>
            ) : !formData.hasVariations ? (
              <div className="grid grid-cols-3 gap-3">
                <Field label="Preço Atual (R$)"><input type="text" required value={formData.price} onChange={e => setFormData({...formData,price:e.target.value})} placeholder="15,90" className={inp} /></Field>
                <Field label="Preço Riscado"><input type="text" value={formData.originalPrice} onChange={e => setFormData({...formData,originalPrice:e.target.value})} placeholder="59,90" className={inp} /></Field>
                <Field label="Validade"><input type="text" required value={formData.validity} onChange={e => setFormData({...formData,validity:e.target.value})} placeholder="30 dias" className={inp} /></Field>
              </div>
            ) : (
              <div className="border border-white/10 rounded-xl p-4 bg-black/30 space-y-3">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Variações</h4>
                {formData.variations.map((v, i) => (
                  <div key={i} className="grid grid-cols-4 gap-2 items-end border-b border-white/5 pb-3">
                    <div className="col-span-2"><label className="text-xs text-gray-600 mb-1 block">Nome</label><input type="text" required value={v.name} onChange={e => { const nv=[...formData.variations]; nv[i].name=e.target.value; setFormData({...formData,variations:nv}); }} placeholder="Tela 30 dias" className={inp} /></div>
                    <div><label className="text-xs text-gray-600 mb-1 block">Preço</label><input type="text" required value={v.price} onChange={e => { const nv=[...formData.variations]; nv[i].price=e.target.value; setFormData({...formData,variations:nv}); }} placeholder="15,90" className={inp} /></div>
                    <div className="flex gap-2"><div className="flex-1"><label className="text-xs text-gray-600 mb-1 block">Validade</label><input type="text" value={v.validity} onChange={e => { const nv=[...formData.variations]; nv[i].validity=e.target.value; setFormData({...formData,variations:nv}); }} placeholder="30 dias" className={inp} /></div><button type="button" onClick={() => setFormData({...formData,variations:formData.variations.filter((_,j)=>j!==i)})} className="p-2 hover:bg-red-500/20 text-red-500 rounded-lg transition-colors mt-5"><Trash2 size={14}/></button></div>
                  </div>
                ))}
                <button type="button" onClick={() => setFormData({...formData,variations:[...formData.variations,{name:'',price:'',originalPrice:'',validity:''}]})} className="text-primary text-sm font-bold flex items-center gap-1 hover:text-primary/80 transition-colors"><Plus size={14}/> Adicionar Variação</button>
              </div>
            )}

            {formData.isBundle && (
              <div className="border border-primary/30 rounded-xl p-4 bg-primary/10 space-y-3">
                <h4 className="text-xs font-bold text-primary uppercase tracking-wider">Serviços deste Combo</h4>
                {formData.bundleItems.map((b, i) => (
                  <div key={i} className="grid grid-cols-4 gap-2 items-end border-b border-primary/20 pb-3">
                    <div className="col-span-2">
                      <label className="text-xs text-primary/70 mb-1 block font-bold">Produto Base</label>
                      <select required value={b.componentId} onChange={e => { const nb=[...formData.bundleItems]; nb[i].componentId=e.target.value; setFormData({...formData,bundleItems:nb}); }} className={inp}>
                        <option value="">Selecione um produto...</option>
                        {products.filter(p => !p.isBundle && p.id !== editingId).map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-primary/70 mb-1 block font-bold">Quantidade</label>
                      <input type="number" min="1" required value={b.quantity} onChange={e => { const nb=[...formData.bundleItems]; nb[i].quantity=e.target.value; setFormData({...formData,bundleItems:nb}); }} className={inp} />
                    </div>
                    <div className="flex gap-2 items-end">
                      <button type="button" onClick={() => setFormData({...formData,bundleItems:formData.bundleItems.filter((_,j)=>j!==i)})} className="p-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl transition-colors"><Trash2 size={16}/></button>
                    </div>
                  </div>
                ))}
                <button type="button" onClick={() => setFormData({...formData,bundleItems:[...formData.bundleItems,{componentId:'',quantity:'1'}]})} className="w-full text-white bg-primary hover:bg-primary/80 rounded-lg py-2.5 text-sm font-bold flex items-center justify-center gap-2 transition-colors"><Plus size={16}/> Adicionar Serviço</button>
              </div>
            )}

            <Field label="Link da Imagem (URL ou Upload)">
              <ImageUploader value={formData.imageUrl} onChange={val => setFormData({...formData,imageUrl:val})} placeholder="https://..." />
              {formData.imageUrl && <img src={formData.imageUrl} alt="preview" className="mt-2 w-full aspect-video object-cover rounded-xl border border-white/10" />}
            </Field>

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold text-sm transition-colors">Cancelar</button>
              <button type="submit" className="flex-1 py-2.5 rounded-xl bg-primary hover:bg-primary/80 text-white font-bold text-sm transition-colors shadow-lg shadow-primary/20">Salvar Produto</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Password Modal */}
      {pwModal && (
        <Modal title="Mudar Senha" onClose={() => setPwModal(false)}>
          <form onSubmit={changePw} className="space-y-4">
            <Field label="Senha Atual"><input type="password" required value={pwForm.currentPassword} onChange={e => setPwForm({...pwForm,currentPassword:e.target.value})} className={inp} /></Field>
            <Field label="Nova Senha"><input type="password" required value={pwForm.newPassword} onChange={e => setPwForm({...pwForm,newPassword:e.target.value})} className={inp} /></Field>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setPwModal(false)} className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold text-sm">Cancelar</button>
              <button type="submit" className="flex-1 py-2.5 rounded-xl bg-primary hover:bg-primary/80 text-white font-bold text-sm">Salvar</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Avatar Modal */}
      {avatarModal && (
        <Modal title="Trocar Foto de Perfil" onClose={() => setAvatarModal(false)}>
          <form onSubmit={changeAvatar} className="space-y-4">
            <Field label="Foto de Perfil (URL ou Upload)">
              <ImageUploader value={avatarForm.avatarUrl} onChange={val => setAvatarForm({avatarUrl:val})} placeholder="https://..." />
            </Field>
            {avatarForm.avatarUrl && <img src={avatarForm.avatarUrl} alt="preview" className="w-24 h-24 rounded-full object-cover border-2 border-primary mx-auto" />}
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setAvatarModal(false)} className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold text-sm">Cancelar</button>
              <button type="submit" className="flex-1 py-2.5 rounded-xl bg-primary hover:bg-primary/80 text-white font-bold text-sm">Salvar</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Profile Modal */}
      {profileModal && (
        <Modal title="Editar Perfil" onClose={() => setProfileModal(false)}>
          <form onSubmit={changeProfile} className="space-y-4">
            <Field label="Nome"><input type="text" required value={profileForm.name} onChange={e => setProfileForm({...profileForm,name:e.target.value})} className={inp} /></Field>
            <Field label="Email"><input type="email" required value={profileForm.email} onChange={e => setProfileForm({...profileForm,email:e.target.value})} className={inp} /></Field>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setProfileModal(false)} className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold text-sm">Cancelar</button>
              <button type="submit" className="flex-1 py-2.5 rounded-xl bg-primary hover:bg-primary/80 text-white font-bold text-sm">Salvar</button>
            </div>
          </form>
        </Modal>
      )}

    </div>
  );
}
