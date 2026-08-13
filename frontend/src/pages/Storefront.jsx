import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { 
  ShieldCheck, Zap, HeartHandshake, ChevronLeft, ChevronRight, ShoppingCart, 
  Menu, X, Tag, Monitor, Gamepad2, Bot, Wrench, Video, Key, Package, Flame, Smartphone, Plus, MessageCircle, Send, Trophy, CheckCircle, FileText
} from 'lucide-react';
import { useSearchParams, Link } from 'react-router-dom';
import { CartContext } from '../contexts/CartContext';
import { AuthContext } from '../contexts/AuthContext';
import { Lock, Star } from 'lucide-react';

const highlightKeywords = (text) => {
  const keywords = ['garantia', 'acesso imediato', '4k', 'premium', 'vitalício', 'vitalicio', 'telas', 'tela', 'suporte', 'hd', 'uhd', 'original', 'ilimitado'];
  const regex = new RegExp(`(${keywords.join('|')})`, 'gi');
  
  const parts = text.split(regex);
  
  return parts.map((part, i) => {
    if (keywords.includes(part.toLowerCase())) {
      return <strong key={i} className="text-primary font-bold">{part}</strong>;
    }
    return part;
  });
};

const RichDescription = ({ text }) => {
  if (!text) return null;
  
  const lines = text.split('\n');
  
  return (
    <div className="space-y-3 text-sm leading-relaxed">
      {lines.map((line, idx) => {
        const trimmedLine = line.trim();
        if (!trimmedLine) return <div key={idx} className="h-1"></div>;
        
        // Checklist Heading
        if (trimmedLine.toUpperCase().includes('O QUE VOCÊ VAI RECEBER:') || trimmedLine.toUpperCase().includes('O QUE VOCE VAI RECEBER:')) {
          return <h4 key={idx} className="font-black text-white mt-8 mb-4 uppercase tracking-wider">{trimmedLine}</h4>;
        }

        // Informações Heading
        if (trimmedLine.toUpperCase().includes('INFORMAÇÕES IMPORTANTES:') || trimmedLine.toUpperCase().includes('INFORMACOES IMPORTANTES:')) {
          return <h4 key={idx} className="font-black text-white mt-8 mb-4 uppercase tracking-wider">{trimmedLine}</h4>;
        }
        
        // Alertas
        if (trimmedLine.toUpperCase().startsWith('ATENÇÃO:') || trimmedLine.toUpperCase().startsWith('ATENCAO:')) {
           return (
             <div key={idx} className="bg-red-500/10 border border-red-500/30 p-4 rounded-xl flex gap-3 text-red-200 mt-6 mb-4">
               <ShieldCheck size={20} className="text-red-500 shrink-0" />
               <div>
                 <strong className="text-red-500 font-bold block mb-1">Atenção Importante</strong>
                 {highlightKeywords(trimmedLine.substring(8).trim())}
               </div>
             </div>
           );
        }
        
        if (trimmedLine.startsWith('-') || trimmedLine.startsWith('*')) {
          const content = trimmedLine.substring(1).trim();
          return (
            <div key={idx} className="flex items-center gap-3 bg-white/5 dark:bg-black/40 p-3.5 rounded-xl border border-white/10 shadow-inner hover:border-primary/30 transition-colors">
              <CheckCircle size={18} className="text-primary shrink-0" />
              <span className="text-gray-800 dark:text-gray-300 font-medium">{highlightKeywords(content)}</span>
            </div>
          );
        }
        
        return <p key={idx} className="text-gray-600 dark:text-gray-400 px-1">{highlightKeywords(trimmedLine)}</p>;
      })}
    </div>
  );
const ProductDetailModal = ({ product: p, onClose, productReviews, user, addToCart, products }) => {
  const hasVariations = p.hasVariations && p.variations?.length > 0;
  const [selectedVariation, setSelectedVariation] = useState(hasVariations ? p.variations[0] : null);

  const stockCount = selectedVariation 
    ? (selectedVariation._count?.credentials || 0) 
    : (p._count?.credentials || 0);

  const isOutOfStock = stockCount === 0;
  const isVipLocked = p.isVip && (!user || (!user.isVip && user.role !== 'ADMIN'));
  const reviewCount = productReviews.length;
  const avgRating = reviewCount > 0 ? (productReviews.reduce((s, r) => s + r.rating, 0) / reviewCount).toFixed(1) : null;

  const price = selectedVariation ? selectedVariation.price : p.price;
  const originalPrice = selectedVariation ? selectedVariation.originalPrice : p.originalPrice;
  const validity = selectedVariation ? selectedVariation.validity : p.validity;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md" onClick={onClose}>
      <div className="glass-card w-full max-w-5xl h-[95vh] rounded-3xl overflow-hidden flex flex-col md:flex-row relative animate-in fade-in zoom-in duration-200 shadow-2xl" onClick={e => e.stopPropagation()}>
        
        {/* LADO ESQUERDO: Imagem e Conteúdo */}
        <div className="w-full md:w-3/5 overflow-y-auto custom-scrollbar bg-[#0f1014] pb-20 md:pb-0">
          {/* Botão fechar (Mobile) */}
          <button onClick={onClose} className="md:hidden fixed top-4 right-4 z-50 text-gray-400 hover:text-white bg-black/50 hover:bg-white/10 p-2 rounded-full transition-colors backdrop-blur-md">
            <X size={20} />
          </button>

          {/* Imagem */}
          {p.imageUrl && (
            <div className="w-full aspect-[16/9] md:aspect-video bg-black relative border-b border-white/5">
              <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover opacity-90" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0f1014] to-transparent"></div>
              {p.badge && <div className="absolute top-4 left-4 bg-primary text-white text-xs font-black px-3 py-1.5 rounded-md shadow-lg uppercase tracking-wider">{p.badge}</div>}
            </div>
          )}

          <div className="p-5 md:p-8 -mt-6 md:-mt-10 relative z-10">
            {/* Header */}
            <h2 className="text-3xl font-black text-white mb-3 leading-tight drop-shadow-md">{p.name}</h2>
            <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-6 md:mb-8">
              {avgRating && (
                <div className="flex items-center gap-1 text-yellow-400 text-sm bg-yellow-400/10 px-3 py-1 rounded-full border border-yellow-400/20">
                  {[1,2,3,4,5].map(s => <Star key={s} size={14} className={s <= Math.round(avgRating) ? 'fill-yellow-400' : ''} />)}
                  <span className="font-bold">{avgRating}</span>
                  <span className="text-yellow-400/70 text-xs">({reviewCount})</span>
                </div>
              )}
              <span className="text-[10px] md:text-xs bg-white/10 border border-white/10 px-3 py-1.5 rounded-full text-gray-300 font-bold tracking-wide uppercase">{p.category}</span>
              <span className="text-[10px] md:text-xs bg-green-500/10 border border-green-500/20 px-3 py-1.5 rounded-full text-green-400 font-bold tracking-wide uppercase flex items-center gap-1"><Zap size={12}/> Entrega Imediata</span>
            </div>

            {/* Descrição completa */}
            {p.description && (
              <div className="mb-8">
                <RichDescription text={p.description} />
              </div>
            )}

            {/* Avaliações */}
            {productReviews.length > 0 && (
              <div className="mt-8 pt-8 border-t border-white/10">
                <h4 className="text-sm font-black text-gray-400 uppercase tracking-wider mb-6 flex items-center gap-2">
                   Avaliações dos Clientes
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {productReviews.slice(0, 4).map((rev, i) => (
                    <div key={i} className="bg-white/5 rounded-2xl p-4 border border-white/5">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex">
                          {[1,2,3,4,5].map(s => <Star key={s} size={12} className={`${s <= rev.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'}`} />)}
                        </div>
                        <span className="text-xs font-bold text-gray-300">{rev.user?.name || 'Anônimo'}</span>
                      </div>
                      {rev.comment && <p className="text-sm text-gray-400 leading-relaxed">"{rev.comment}"</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Produtos Relacionados */}
            <div className="mt-12 pt-8 border-t border-white/10">
              <h4 className="text-sm font-black text-white uppercase tracking-wider mb-6">Você também pode gostar</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {products.filter(rel => rel.category === p.category && rel.id !== p.id).slice(0, 4).map(rel => (
                  <div key={rel.id} className="bg-white/5 border border-white/5 rounded-xl p-3 flex items-center gap-3">
                     {rel.imageUrl && <img src={rel.imageUrl} alt={rel.name} className="w-14 h-14 rounded-lg object-cover" />}
                     <div>
                       <div className="text-sm font-bold text-white line-clamp-1">{rel.name}</div>
                       <div className="text-xs text-primary font-bold">R$ {(rel.price/100).toFixed(2).replace('.', ',')}</div>
                     </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* LADO DIREITO: Checkout (Sticky) */}
        <div className="w-full md:w-2/5 p-5 md:p-8 bg-[#16181d] border-t md:border-t-0 md:border-l border-white/5 flex flex-col relative md:overflow-y-auto custom-scrollbar shrink-0 md:shrink">
          {/* Botão fechar (Desktop) */}
          <button onClick={onClose} className="hidden md:block absolute top-4 right-4 z-10 text-gray-400 hover:text-white bg-black/30 hover:bg-white/10 p-2 rounded-full transition-colors">
            <X size={20} />
          </button>

          <div className="flex-1 mt-2 md:mt-8">
            <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-6 hidden md:block">Finalizar Pedido</h3>
            
            {isVipLocked ? (
              <div className="w-full bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-6 text-center mb-6">
                <Lock className="mx-auto text-yellow-500 mb-2" size={32} />
                <h4 className="text-yellow-400 font-bold mb-1">Produto VIP</h4>
                <p className="text-yellow-500/70 text-sm">Este produto é exclusivo para membros do clube VIP.</p>
              </div>
            ) : (
              <>
                {/* Variações */}
                {hasVariations && (
                  <div className="mb-6 space-y-3">
                    <div className="text-sm font-bold text-gray-300 mb-3">Escolha seu plano:</div>
                    {p.variations.map(v => {
                      const isVarOutOfStock = (v._count?.credentials || 0) === 0;
                      const isSelected = selectedVariation?.id === v.id;
                      
                      return (
                        <button
                          key={v.id}
                          disabled={isVarOutOfStock}
                          onClick={() => setSelectedVariation(v)}
                          className={`w-full text-left p-3.5 md:p-4 rounded-2xl transition-all flex items-center justify-between border-2 ${
                            isVarOutOfStock 
                              ? 'opacity-50 cursor-not-allowed border-white/5 bg-black/20'
                              : isSelected
                                ? 'border-primary bg-primary/10 shadow-[0_0_15px_rgba(var(--color-primary-rgb),0.15)]'
                                : 'border-white/5 hover:border-white/20 bg-black/40 hover:bg-black/60'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${isSelected ? 'border-primary' : 'border-gray-500'}`}>
                              {isSelected && <div className="w-2.5 h-2.5 bg-primary rounded-full" />}
                            </div>
                            <div>
                              <div className={`font-bold text-sm md:text-base ${isVarOutOfStock ? 'text-gray-500' : isSelected ? 'text-primary' : 'text-white'}`}>
                                {v.name}
                              </div>
                              {v.validity && <div className="text-[10px] md:text-xs text-gray-500 mt-0.5">{v.validity}</div>}
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className={`font-black text-sm md:text-base ${isSelected ? 'text-primary' : 'text-gray-300'}`}>
                              R$ {(v.price/100).toFixed(2).replace('.', ',')}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Bloco de Preço Final */}
                <div className="mb-6 p-5 md:p-6 bg-black/40 border border-white/5 rounded-3xl">
                   <div className="text-gray-400 text-xs md:text-sm font-bold mb-1">Total a pagar</div>
                   <div className="flex items-end gap-3">
                     <div className="text-3xl md:text-4xl font-black text-primary leading-none">R$ {(price/100).toFixed(2).replace('.', ',')}</div>
                     {originalPrice && <div className="text-sm md:text-lg text-gray-500 line-through mb-0.5">R$ {(originalPrice/100).toFixed(2).replace('.', ',')}</div>}
                   </div>
                   {!isOutOfStock && (
                     <div className="text-[10px] md:text-xs text-green-400 font-bold mt-3 flex items-center gap-1 bg-green-500/10 w-fit px-2 py-1 rounded">
                       <CheckCircle size={12}/> Estoque Garantido
                     </div>
                   )}
                </div>

                {/* Botões de Ação */}
                <button
                  onClick={() => {
                    addToCart(p, selectedVariation);
                    onClose();
                  }}
                  disabled={isOutOfStock}
                  className={`btn-primary w-full py-3.5 md:py-4 rounded-2xl text-sm md:text-base font-black uppercase tracking-wider flex items-center justify-center gap-2 ${ isOutOfStock ? 'opacity-50 cursor-not-allowed saturate-0' : 'shadow-[0_0_20px_rgba(var(--color-primary-rgb),0.3)] hover:shadow-[0_0_30px_rgba(var(--color-primary-rgb),0.5)] transition-shadow'}`}
                >
                  <ShoppingCart size={18} /> {isOutOfStock ? 'Esgotado' : 'Comprar Agora'}
                </button>
              </>
            )}

            {/* Badges Adicionais */}
            <div className="mt-6 md:mt-8 space-y-3">
              <div className="flex items-start gap-3 p-3.5 md:p-4 bg-white/5 rounded-2xl border border-white/5">
                <ShieldCheck className="text-green-400 shrink-0 mt-0.5" size={18}/>
                <div><div className="text-[11px] md:text-sm font-bold text-white mb-0.5">Compra protegida</div><div className="text-[10px] md:text-xs text-gray-400 leading-relaxed">Seus dados estão seguros e o acesso é entregue imediatamente após o pagamento.</div></div>
              </div>
              <div className="flex items-start gap-3 p-3.5 md:p-4 bg-white/5 rounded-2xl border border-white/5">
                <HeartHandshake className="text-primary shrink-0 mt-0.5" size={18}/>
                <div><div className="text-[11px] md:text-sm font-bold text-white mb-0.5">Suporte Humanizado</div><div className="text-[10px] md:text-xs text-gray-400 leading-relaxed">Qualquer problema com o acesso? Nosso suporte resolve rápido.</div></div>
              </div>
            </div>
            
            {/* CTA Afiliados */}
            <div className="mt-6 md:mt-8 p-4 md:p-5 bg-gradient-to-r from-primary/20 to-transparent border border-primary/20 rounded-2xl">
               <h4 className="text-primary font-bold text-xs md:text-sm mb-1 flex items-center gap-2"><Trophy size={14}/> Indique e Ganhe</h4>
               <p className="text-[10px] md:text-xs text-gray-300 leading-relaxed mb-3">Ganhe dinheiro de verdade indicando este e outros produtos para seus amigos!</p>
               <Link to="/dashboard" onClick={() => window.scrollTo(0,0)} className="text-[10px] md:text-xs text-primary font-bold hover:underline">Pegar meu link →</Link>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default function Storefront() {
  const [products, setProducts] = useState([]);
  const [banners, setBanners] = useState([]);
  const [settings, setSettings] = useState({ whatsapp: '', telegram: '' });
  const [currentBannerIdx, setCurrentBannerIdx] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [selectedProductForVariations, setSelectedProductForVariations] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const activeCategory = searchParams.get('category') || 'Todos';
  const { addToCart } = useContext(CartContext);
  const { user } = useContext(AuthContext);
  const [selectedProductDetail, setSelectedProductDetail] = useState(null);
  const [productReviews, setProductReviews] = useState([]);

  // Lógica de Ranking Dinâmico
  const dynamicRanking = (() => {
    const today = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
    const baseDate = 20670; // 11 de Agosto de 2026 = aprox 20677
    const daysPassed = Math.max(0, today - baseDate);
    
    const getDailyIncrease = (id) => 15 + ((today + id) % 85);

    const baseRanking = [
      { id: 101, name: 'Lucas M.', totalSpent: 215000 },
      { id: 102, name: 'Fernanda S.', totalSpent: 185000 },
      { id: 103, name: 'Thiago B.', totalSpent: 154000 },
      { id: 104, name: 'Rafael C.', totalSpent: 123000 },
      { id: 105, name: 'Amanda T.', totalSpent: 98000 }
    ];

    return baseRanking.map(user => ({
      ...user,
      totalSpent: user.totalSpent + (daysPassed * getDailyIncrease(user.id) * 100)
    }));
  })();

  useEffect(() => {
    // Buscar produtos, banners e configurações
    axios.get('https://streaming-store-api.onrender.com/api/products').then(res => setProducts(res.data));
    axios.get('https://streaming-store-api.onrender.com/api/banners').then(res => setBanners(res.data));
    axios.get('https://streaming-store-api.onrender.com/api/settings').then(res => setSettings(res.data)).catch(() => {});
  }, []);

  // Rotação automática dos banners
  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentBannerIdx(prev => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [banners.length]);

  // Categorias fixas para garantir que todas apareçam mesmo sem produtos
  const categories = [
    'Todos', 
    'Streaming', 
    'Contas Premium', 
    'Combos', 
    'Telas', 
    'IPTV',
    'Produtos Digitais',
    'Internet Ilimitada',
    'Inteligência Artificial', 
    'Ferramentas', 
    'Games', 
    'APKs Premium', 
    'Adultos'
  ];

  const searchQuery = searchParams.get('search')?.toLowerCase() || '';

  // Filtrar produtos
  const filteredProducts = products.filter(p => {
    const matchesCategory = activeCategory === 'Todos' || p.category === activeCategory;
    const matchesSearch = !searchQuery || p.name.toLowerCase().includes(searchQuery) || (p.description && p.description.toLowerCase().includes(searchQuery));
    return matchesCategory && matchesSearch;
  });

  const prevBanner = () => setCurrentBannerIdx(prev => (prev - 1 + banners.length) % banners.length);
  const nextBanner = () => setCurrentBannerIdx(prev => (prev + 1) % banners.length);

  // Ícones por categoria
  const getCategoryIcon = (cat) => {
    switch(cat) {
      case 'Todos': return <Tag size={20} />;
      case 'Streaming': return <Video size={20} />;
      case 'Contas Premium': return <Key size={20} />;
      case 'Combos': return <Package size={20} />;
      case 'Telas': return <Monitor size={20} />;
      case 'IPTV': return <Monitor size={20} />;
      case 'Produtos Digitais': return <Package size={20} />;
      case 'Internet Ilimitada': return <Zap size={20} />;
      case 'Inteligência Artificial': return <Bot size={20} />;
      case 'Ferramentas': return <Wrench size={20} />;
      case 'Adultos': return <Flame size={20} />;
      case 'Games': return <Gamepad2 size={20} />;
      case 'APKs Premium': return <Smartphone size={20} />;
      default: return <Tag size={20} />;
    }
  };

  // Cores dinâmicas do fundo por categoria
  const categoryBackgrounds = {
    'Todos': ['bg-primary/40', 'bg-blue-600/30', 'bg-purple-700/20'],
    'Streaming': ['bg-primary/40', 'bg-blue-600/30', 'bg-purple-700/20'],
    'Contas Premium': ['bg-yellow-500/30', 'bg-amber-600/30', 'bg-orange-700/20'],
    'Combos': ['bg-emerald-500/30', 'bg-teal-600/30', 'bg-green-700/20'],
    'Telas': ['bg-indigo-500/30', 'bg-purple-600/30', 'bg-pink-700/20'],
    'IPTV': ['bg-blue-500/30', 'bg-indigo-600/30', 'bg-cyan-700/20'],
    'Produtos Digitais': ['bg-purple-500/30', 'bg-fuchsia-600/30', 'bg-pink-700/20'],
    'Internet Ilimitada': ['bg-cyan-500/30', 'bg-blue-600/30', 'bg-teal-700/20'],
    'Inteligência Artificial': ['bg-cyan-500/30', 'bg-teal-600/30', 'bg-blue-700/20'],
    'Ferramentas': ['bg-orange-500/30', 'bg-red-600/30', 'bg-yellow-700/20'],
    'Adultos': ['bg-rose-600/40', 'bg-red-700/30', 'bg-pink-800/20'],
    'Games': ['bg-green-500/40', 'bg-lime-600/30', 'bg-emerald-800/20'],
    'APKs Premium': ['bg-fuchsia-500/40', 'bg-purple-600/30', 'bg-indigo-800/20'],
  };
  const currentBg = categoryBackgrounds[activeCategory] || categoryBackgrounds['Todos'];

  const categoryImages = {
    'Todos': '/backgrounds/bg_streaming.jpg',
    'Streaming': '/backgrounds/bg_streaming.jpg',
    'Contas Premium': '/backgrounds/bg_premium.jpg',
    'Combos': '/backgrounds/bg_combos.jpg',
    'Telas': '/backgrounds/bg_telas.jpg',
    'IPTV': '/backgrounds/bg_streaming.jpg',
    'Produtos Digitais': '/backgrounds/bg_ferramentas.jpg',
    'Internet Ilimitada': '/backgrounds/bg_ia.jpg',
    'Inteligência Artificial': '/backgrounds/bg_ia.jpg',
    'Ferramentas': '/backgrounds/bg_ferramentas.jpg',
    'Adultos': '/backgrounds/bg_adultos.jpg',
    'Games': '/backgrounds/bg_games.jpg',
    'APKs Premium': '/backgrounds/bg_apks.jpg',
  };
  const currentBgImage = categoryImages[activeCategory] || categoryImages['Todos'];

  return (
    <div className="relative min-h-screen flex">
      {/* ... fundo dinâmico ... */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden bg-gray-100 dark:bg-black transition-colors duration-500">
        <img key={currentBgImage} src={currentBgImage} alt="Background" className="absolute inset-0 w-full h-full object-cover opacity-10 dark:opacity-20 mix-blend-multiply dark:mix-blend-screen transition-all duration-1000 animate-fade-in" />
        <div className="film-grain"></div>
        <div className={`absolute top-0 left-0 w-96 h-96 ${currentBg[0]} rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl opacity-60 dark:opacity-100 animate-blob transition-colors duration-1000`}></div>
        <div className={`absolute top-20 right-20 w-[30rem] h-[30rem] ${currentBg[1]} rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl opacity-60 dark:opacity-100 animate-blob animation-delay-2000 transition-colors duration-1000`}></div>
        <div className={`absolute bottom-10 left-1/2 -translate-x-1/2 w-[40rem] h-[40rem] ${currentBg[2]} rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl opacity-60 dark:opacity-100 animate-blob animation-delay-4000 transition-colors duration-1000`}></div>
      </div>

      {/* SIDEBAR (Desktop) */}
      <aside className={`hidden md:flex flex-col fixed top-20 bottom-0 left-0 z-40 bg-white/90 dark:bg-black/90 backdrop-blur-xl border-r border-gray-200 dark:border-white/10 transition-all duration-300 ${isSidebarOpen ? 'w-64' : 'w-16'}`}>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-4 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-primary transition-colors border-b border-gray-200 dark:border-white/10">
          {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
        <div className="flex-1 py-4 flex flex-col overflow-hidden">
          {categories.slice(0, 4).map(cat => (
            <button
              key={cat}
              onClick={() => setSearchParams(cat === 'Todos' ? {} : { category: cat })}
              className={`flex items-center w-full px-4 py-3 transition-colors ${
                activeCategory === cat 
                  ? 'bg-primary/10 text-primary border-r-4 border-primary font-bold' 
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white'
              }`}
              title={cat}
            >
              <div className="flex justify-center shrink-0 w-6">
                {getCategoryIcon(cat)}
              </div>
              <span className={`ml-4 truncate whitespace-nowrap transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 hidden'}`}>
                {cat}
              </span>
            </button>
          ))}
          {categories.length > 4 && (
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="flex items-center w-full px-4 py-3 transition-colors text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white"
              title="Mais Categorias"
            >
              <div className="flex justify-center shrink-0 w-6">
                <Plus size={20} />
              </div>
              <span className={`ml-4 truncate whitespace-nowrap transition-opacity duration-300 font-bold uppercase tracking-wider text-xs ${isSidebarOpen ? 'opacity-100' : 'opacity-0 hidden'}`}>
                Ver Mais
              </span>
            </button>
          )}
        </div>

        {/* SUPPORT BUTTONS */}
        <div className="border-t border-gray-200 dark:border-white/10 p-2 flex flex-col gap-1">
          {settings.whatsapp && (
            <a href={`https://wa.me/${settings.whatsapp}`} target="_blank" rel="noreferrer" className="flex items-center w-full px-2 py-3 text-green-600 dark:text-green-500 hover:bg-green-50 dark:hover:bg-green-500/10 rounded-lg transition-colors" title="Suporte WhatsApp">
              <div className="flex justify-center shrink-0 w-6"><MessageCircle size={20} /></div>
              <span className={`ml-4 font-bold truncate whitespace-nowrap transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 hidden'}`}>WhatsApp</span>
            </a>
          )}
          {settings.telegram && (
            <a href={`https://t.me/${settings.telegram.replace('@', '')}`} target="_blank" rel="noreferrer" className="flex items-center w-full px-2 py-3 text-blue-600 dark:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-colors" title="Suporte Telegram">
              <div className="flex justify-center shrink-0 w-6"><Send size={20} /></div>
              <span className={`ml-4 font-bold truncate whitespace-nowrap transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 hidden'}`}>Telegram</span>
            </a>
          )}
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className={`relative z-10 flex-1 flex flex-col min-w-0 transition-all duration-300 ${isSidebarOpen ? 'md:ml-64' : 'md:ml-16'}`}>
        
        {/* CARROSSEL DE BANNERS */}
        {banners.length > 0 && (
          <div className="relative w-full max-w-7xl mx-auto mt-2 px-4 md:px-6">
            <div className={`relative rounded-2xl overflow-hidden shadow-2xl border border-gray-300 dark:border-white/5 bg-black ${banners.some(b => b.mobileImageUrl) ? 'aspect-square' : 'aspect-video'} sm:aspect-[21/9] lg:aspect-[28/9]`}>
              {banners.map((banner, idx) => (
                <div 
                  key={banner.id} 
                  className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ${idx === currentBannerIdx ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}
                >
                  {banner.category ? (
                    <button 
                      onClick={() => setSearchParams({ category: banner.category })} 
                      className="w-full h-full cursor-pointer p-0 m-0 border-0 bg-transparent block"
                    >
                      <img src={banner.imageUrl} alt="Banner" className={`w-full h-full object-cover object-center ${banner.mobileImageUrl ? 'hidden sm:block' : ''}`} />
                      {banner.mobileImageUrl && <img src={banner.mobileImageUrl} alt="Banner Mobile" className="w-full h-full object-cover object-center sm:hidden" />}
                    </button>
                  ) : (
                    <>
                      <img src={banner.imageUrl} alt="Banner" className={`w-full h-full object-cover object-center ${banner.mobileImageUrl ? 'hidden sm:block' : ''}`} />
                      {banner.mobileImageUrl && <img src={banner.mobileImageUrl} alt="Banner Mobile" className="w-full h-full object-cover object-center sm:hidden" />}
                    </>
                  )}
                </div>
              ))}
              {/* Controles do Carrossel */}
              {banners.length > 1 && (
                <>
                  <button onClick={prevBanner} className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-black/50 p-2 rounded-full text-white hover:bg-primary transition-colors">
                    <ChevronLeft size={24} />
                  </button>
                  <button onClick={nextBanner} className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-black/50 p-2 rounded-full text-white hover:bg-primary transition-colors">
                    <ChevronRight size={24} />
                  </button>
                  {/* Pontinhos */}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
                    {banners.map((_, idx) => (
                      <button key={idx} onClick={() => setCurrentBannerIdx(idx)} className={`w-3 h-3 rounded-full transition-colors shadow-lg ${idx === currentBannerIdx ? 'bg-primary' : 'bg-white/50'}`} />
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        <main className="container mx-auto px-4 py-8 pb-28 md:pb-8 flex-1">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-black mb-2 uppercase tracking-wider text-gray-900 dark:text-white dark:drop-shadow-[0_0_15px_rgba(229,9,20,0.5)]">
              Catálogo
            </h2>
            <p className="text-gray-600 dark:text-gray-400">Entrega imediata no seu WhatsApp após o pagamento.</p>
          </div>
          
          {/* VITRINE DE PRODUTOS */}
          {filteredProducts.length === 0 ? (
            <div className="text-center text-gray-500 py-12">Nenhum produto cadastrado nesta categoria ainda.</div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-6 items-start">
              {filteredProducts.map(product => {
                  const stockCount = product._count?.credentials || 0;
                  const hasVariations = product.hasVariations && product.variations?.length > 0;
                  const isOutOfStock = stockCount === 0;
                  const isVipLocked = product.isVip && (!user || (!user.isVip && user.role !== 'ADMIN'));
                  const badgeText = isVipLocked ? '👑 VIP' : (isOutOfStock ? '🔴 ESGOTADO' : product.badge);
                  
                  const reviewsCount = product.reviews?.length || 0;
                  const averageRating = reviewsCount > 0 
                    ? (product.reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviewsCount).toFixed(1)
                    : null;

                  return (
                    <div 
                      key={product.id} 
                      className="glass-card flex flex-col overflow-hidden border border-gray-200 dark:border-white/10 hover:border-primary/50 dark:hover:border-primary/50 hover:shadow-lg hover:shadow-primary/20 transition-all cursor-pointer group relative h-full"
                      onClick={() => {
                        setSelectedProductDetail(product);
                        // Buscar avaliações do produto
                        axios.get(`https://streaming-store-api.onrender.com/api/products/${product.id}/reviews`)
                          .then(res => setProductReviews(res.data))
                          .catch(() => setProductReviews([]));
                      }}
                    >
                      
                      {/* ETIQUETA (BADGE) FLUTUANTE */}
                      {badgeText && (
                        <div className={`absolute top-2 left-2 z-10 ${isVipLocked ? 'bg-yellow-500/90' : 'bg-primary/90'} backdrop-blur-md text-white text-[10px] sm:text-xs font-black uppercase px-2 py-1 rounded-md shadow-lg border ${isVipLocked ? 'border-yellow-500/50' : 'border-primary/50'}`}>
                          {badgeText}
                        </div>
                      )}

                  {/* Imagem do Produto (Proporção 16:9) */}
                  <div className="w-full aspect-video overflow-hidden bg-gray-200 dark:bg-black/50 relative">
                    {product.imageUrl ? (
                      <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-3xl opacity-20">🔥</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Conteúdo do Cartão */}
                  <div className="p-2 sm:p-4 flex flex-col flex-1 bg-gradient-to-b from-gray-50/50 dark:from-white/5 to-transparent">
                    <div className="flex justify-between items-start mb-1 sm:mb-2 gap-1">
                      <h3 className="text-[11px] leading-tight sm:text-base font-bold text-gray-900 dark:text-white line-clamp-2">{product.name}</h3>
                      {averageRating && (
                        <div className="flex items-center gap-0.5 bg-yellow-500/10 text-yellow-500 px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] font-bold shrink-0">
                          <Star size={10} className="fill-yellow-500" />
                          {averageRating}
                        </div>
                      )}
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 text-[9px] sm:text-[10px] mb-2 sm:mb-3 line-clamp-2 overflow-hidden break-words">{product.description}</p>
                    
                    <div className="flex flex-col sm:flex-row sm:items-end justify-between mt-auto pt-2 sm:pt-3 border-t border-gray-200 dark:border-white/5 gap-1 sm:gap-0">
                      <div>
                        {/* PREÇO ORIGINAL RISCADO */}
                        {product.originalPrice && (
                          <div className="text-gray-500 text-[9px] sm:text-[11px] line-through decoration-primary/50 font-medium">
                            R$ {(product.originalPrice / 100).toFixed(2).replace('.', ',')}
                          </div>
                        )}
                        <div className="text-sm sm:text-lg font-extrabold text-primary leading-none mt-0.5">
                          R$ {(product.price / 100).toFixed(2).replace('.', ',')}
                        </div>
                        <span className="text-[8px] sm:text-[9px] font-normal text-gray-500 uppercase tracking-wider block mt-0.5">
                          / {product.validity}
                        </span>
                      </div>
                      {isVipLocked ? (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            alert('Este produto é exclusivo para membros VIP. Entre em contato com o suporte para assinar o VIP.');
                          }}
                          className="bg-gray-800 text-yellow-500 border border-yellow-500/30 px-2 sm:px-4 py-1.5 sm:py-2 text-[10px] sm:text-sm uppercase tracking-wider font-bold shadow-lg w-full sm:w-auto flex justify-center items-center gap-1 opacity-90 hover:opacity-100"
                        >
                          <Lock size={14} className="sm:w-4 sm:h-4 w-3 h-3" /> 
                          Bloqueado
                        </button>
                      ) : (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            if (hasVariations) {
                              setSelectedProductForVariations(product);
                            } else {
                              addToCart(product);
                            }
                          }}
                          disabled={isOutOfStock}
                          className={`btn-primary px-2 sm:px-4 py-1.5 sm:py-2 text-[10px] sm:text-sm uppercase tracking-wider font-bold shadow-lg w-full sm:w-auto flex justify-center ${
                            isOutOfStock 
                              ? 'opacity-50 cursor-not-allowed saturate-0' 
                              : 'shadow-primary/30'
                          }`}
                        >
                          <ShoppingCart size={14} className="sm:w-4 sm:h-4 w-3 h-3" /> 
                          {isOutOfStock ? 'Esgotado' : 'Adicionar'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            </div>
          )}

          {/* Ranking Section */}
          <div className="mt-20 max-w-2xl mx-auto">
            <div className="glass-card p-6 border-t-4 border-t-yellow-500">
              <div className="flex items-center gap-2 mb-2 justify-center">
                <Trophy className="text-yellow-500" size={28} />
                <h3 className="text-xl font-black text-white uppercase tracking-wider">Top Compradores</h3>
              </div>
              
              <p className="text-xs text-center text-gray-400 mb-6">
                O ranking oficial dos clientes que mais investem em entretenimento na nossa loja.
              </p>

              <div className="space-y-3">
                {dynamicRanking.map((rank, index) => (
                  <div key={rank.id} className="flex items-center justify-between p-3 rounded-lg bg-black/40 border border-white/5 relative overflow-hidden group">
                    {index === 0 && <div className="absolute inset-0 bg-yellow-500/10 pointer-events-none"></div>}
                    {index === 1 && <div className="absolute inset-0 bg-gray-300/10 pointer-events-none"></div>}
                    {index === 2 && <div className="absolute inset-0 bg-orange-700/10 pointer-events-none"></div>}
                    
                    <div className="flex items-center gap-3 relative z-10">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm
                        ${index === 0 ? 'bg-yellow-500 text-black' : 
                          index === 1 ? 'bg-gray-300 text-black' : 
                          index === 2 ? 'bg-orange-700 text-white' : 
                          'bg-white/10 text-gray-400'}
                      `}>
                        {index + 1}º
                      </div>
                      <div>
                        <div className={`text-sm font-bold ${index === 0 ? 'text-yellow-500' : 'text-white'}`}>
                          {rank.name}
                        </div>
                      </div>
                    </div>
                    <div className="text-sm font-bold text-gray-300 relative z-10">
                      R$ {(rank.totalSpent / 100).toFixed(2).replace('.', ',')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* CTA AFILIADOS */}
          <div className="mt-16 bg-gradient-to-r from-primary/20 via-primary/10 to-transparent border border-primary/20 rounded-3xl p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden group shadow-2xl">
            <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
            <div className="relative z-10 flex-1 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-3 mb-4">
                <div className="bg-yellow-500/20 p-3 rounded-full border border-yellow-500/30">
                  <Trophy className="text-yellow-500" size={32} />
                </div>
                <h3 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Programa de Parceiros</h3>
              </div>
              <p className="text-gray-600 dark:text-gray-400 max-w-xl text-lg leading-relaxed">
                Indique nossa loja para seus amigos e seguidores e ganhe <strong className="text-primary">dinheiro direto na sua carteira digital</strong> por cada compra realizada. Comece a lucrar hoje mesmo!
              </p>
            </div>
            <Link to="/dashboard" onClick={() => window.scrollTo(0,0)} className="relative z-10 flex-shrink-0 bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-wider py-4 px-10 rounded-xl transition-all shadow-[0_0_20px_rgba(var(--color-primary-rgb),0.3)] hover:shadow-[0_0_40px_rgba(var(--color-primary-rgb),0.5)] flex items-center justify-center gap-3 hover:-translate-y-1">
              Quero ser Afiliado <ChevronRight size={24} />
            </Link>
          </div>

          {/* Features Section */}
          <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8 text-center border-t border-gray-200 dark:border-white/10 pt-16">
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-gray-200 dark:bg-white/5 rounded-full flex items-center justify-center mb-4 text-primary">
                <Zap size={32} />
              </div>
              <h4 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">Entrega Automática</h4>
              <p className="text-gray-600 dark:text-gray-400">Receba seu acesso no WhatsApp quase na mesma hora (Sob demanda).</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-gray-200 dark:bg-white/5 rounded-full flex items-center justify-center mb-4 text-primary">
                <ShieldCheck size={32} />
              </div>
              <h4 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">Compra Segura</h4>
              <p className="text-gray-600 dark:text-gray-400">Pagamento criptografado via Pix oficial da InfinitePay.</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-gray-200 dark:bg-white/5 rounded-full flex items-center justify-center mb-4 text-primary">
                <HeartHandshake size={32} />
              </div>
              <h4 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">Suporte Humanizado</h4>
              <p className="text-gray-600 dark:text-gray-400">Deu problema? Nós resolvemos rápido pelo WhatsApp.</p>
            </div>
          </div>
        </main>
      </div>
      
      {/* MOBILE BOTTOM NAV - ICONES */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full z-50 bg-white/70 dark:bg-black/70 backdrop-blur-lg border-t border-gray-200 dark:border-white/10 shadow-[0_-5px_15px_rgba(0,0,0,0.05)] dark:shadow-[0_-5px_15px_rgba(0,0,0,0.3)] transition-colors duration-300">
        <div className="flex justify-around items-center px-2 py-3">
          {categories.slice(0, 4).map(cat => (
            <button
              key={cat}
              onClick={() => setSearchParams(cat === 'Todos' ? {} : { category: cat })}
              className={`flex flex-col items-center p-2 rounded-lg transition-colors ${
                activeCategory === cat 
                  ? 'text-primary' 
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {getCategoryIcon(cat)}
              <span className="text-[10px] mt-1 uppercase font-bold truncate max-w-[70px] text-center">
                {cat === 'Inteligência Artificial' ? 'I.A.' : cat === 'Contas Premium' ? 'Premium' : cat}
              </span>
            </button>
          ))}
          {categories.length > 4 && (
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="flex flex-col items-center p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:text-primary transition-colors"
            >
              <Plus size={20} />
              <span className="text-[10px] mt-1 uppercase font-bold">Mais</span>
            </button>
          )}
        </div>
      </nav>

      {/* FULL MENU MODAL (MAIS) - Funciona no Desktop e Mobile */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-end md:items-center md:justify-center animate-fade-in" onClick={() => setIsMobileMenuOpen(false)}>
          <div 
            className="w-full md:w-[600px] bg-white dark:bg-[#161616] rounded-t-3xl md:rounded-3xl p-6 pb-12 md:pb-6 shadow-[0_-10px_40px_rgba(0,0,0,0.3)] transition-colors duration-300 animate-slide-up md:animate-scale-in"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-black text-lg text-gray-900 dark:text-white uppercase tracking-wider">Todas as Categorias</h3>
              <button 
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 bg-gray-100 dark:bg-white/10 rounded-full text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto custom-scrollbar">
              {categories.slice(4).map(cat => (
                <button
                  key={cat}
                  onClick={() => {
                    setSearchParams(cat === 'Todos' ? {} : { category: cat });
                    setIsMobileMenuOpen(false);
                  }}
                  className={`flex items-center gap-3 p-4 rounded-xl border transition-all ${
                    activeCategory === cat 
                      ? 'border-primary bg-primary/10 text-primary' 
                      : 'border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5'
                  }`}
                >
                  <div className={activeCategory === cat ? 'text-primary' : 'text-gray-500 dark:text-gray-400'}>
                    {getCategoryIcon(cat)}
                  </div>
                  <span className="text-sm font-bold truncate">{cat}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* VARIATIONS MODAL */}
      {selectedProductForVariations && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="glass-card p-6 w-full max-w-md relative animate-in fade-in zoom-in duration-200">
            <button 
              onClick={() => setSelectedProductForVariations(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 p-2 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
            
            <h3 className="text-xl font-bold text-white mb-2 pr-8">{selectedProductForVariations.name}</h3>
            <p className="text-sm text-gray-400 mb-6">Escolha o plano desejado para continuar:</p>
            
            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
              {selectedProductForVariations.variations?.map(variation => {
                const varStock = variation._count?.credentials || 0;
                const isVarOutOfStock = varStock === 0;
                
                return (
                  <button
                    key={variation.id}
                    disabled={isVarOutOfStock}
                    onClick={() => {
                      addToCart(selectedProductForVariations, variation);
                      setSelectedProductForVariations(null);
                    }}
                    className={`w-full text-left bg-black/40 border p-4 rounded-xl transition-all group flex items-center justify-between ${
                      isVarOutOfStock 
                        ? 'opacity-50 cursor-not-allowed border-red-500/30'
                        : 'hover:bg-primary/20 border-white/5 hover:border-primary/50'
                    }`}
                  >
                    <div>
                      <div className={`font-bold transition-colors ${isVarOutOfStock ? 'text-gray-500' : 'text-white group-hover:text-primary'}`}>
                        {variation.name}
                        {isVarOutOfStock && <span className="ml-2 text-[10px] bg-red-500/20 text-red-500 px-2 py-0.5 rounded uppercase">Esgotado</span>}
                      </div>
                      {variation.validity && (
                        <div className="text-xs text-gray-500 mt-1">Validade: {variation.validity}</div>
                      )}
                    </div>
                    <div className="text-right">
                      {variation.originalPrice && (
                        <div className="text-xs text-gray-500 line-through">
                          R$ {(variation.originalPrice / 100).toFixed(2).replace('.', ',')}
                        </div>
                      )}
                      <div className={`font-bold text-lg ${isVarOutOfStock ? 'text-gray-500' : 'text-primary'}`}>
                        R$ {(variation.price / 100).toFixed(2).replace('.', ',')}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* PRODUCT DETAIL MODAL */}
      {selectedProductDetail && (
        <ProductDetailModal 
          product={selectedProductDetail} 
          onClose={() => setSelectedProductDetail(null)} 
          productReviews={productReviews} 
          user={user} 
          addToCart={addToCart} 
          products={products}
        />
      )}

    </div>
  );
}
