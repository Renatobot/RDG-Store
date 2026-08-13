import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../contexts/AuthContext';
import { SettingsContext } from '../contexts/SettingsContext';
import { Navigate } from 'react-router-dom';
import { Wallet, Package, Trophy, Clock, CheckCircle, Edit, Camera, Key, Star, ExternalLink, Link as LinkIcon, Plus } from 'lucide-react';

export default function ClientDashboard() {
  const { user, loading } = useContext(AuthContext);
  const { settings } = useContext(SettingsContext);
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('orders'); // 'orders' | 'affiliate'
  const [affiliateData, setAffiliateData] = useState(null);
  const [copySuccess, setCopySuccess] = useState(false);
  
  // Review State
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewProduct, setReviewProduct] = useState(null);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });

  // Recharge State
  const [rechargeModalOpen, setRechargeModalOpen] = useState(false);
  const [rechargeAmount, setRechargeAmount] = useState('');
  const [isRecharging, setIsRecharging] = useState(false);

  useEffect(() => {
    if (user) {
      axios.get('https://streaming-store-api.onrender.com/api/orders', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      }).then(res => setOrders(res.data));

      axios.get('https://streaming-store-api.onrender.com/api/users/me/affiliate', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      }).then(res => setAffiliateData(res.data));
    }
  }, [user]);

  const handleCopyLink = () => {
    if (affiliateData) {
      const link = `${window.location.origin}/login?ref=${affiliateData.affiliateCode}`;
      navigator.clipboard.writeText(link);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post(`https://streaming-store-api.onrender.com/api/reviews/${reviewProduct.id}`, reviewForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Avaliação enviada com sucesso! Agradecemos o seu feedback.');
      setReviewModalOpen(false);
      setReviewForm({ rating: 5, comment: '' });
    } catch (error) {
      alert(error.response?.data?.error || 'Erro ao enviar avaliação.');
    }
  };

  const handleRecharge = async (e) => {
    e.preventDefault();
    if (!rechargeAmount) return;
    const val = parseFloat(rechargeAmount.replace(',', '.'));
    if (isNaN(val) || val < 5) return alert('Valor mínimo de R$ 5,00');
    
    setIsRecharging(true);
    try {
      const res = await axios.post('https://streaming-store-api.onrender.com/api/wallet/recharge', { amount: parseInt(val * 100) }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.data.paymentUrl) {
        window.location.href = res.data.paymentUrl;
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Erro ao gerar recarga.');
    } finally {
      setIsRecharging(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-white">Carregando...</div>;
  if (!user) return <Navigate to="/login" />;

  const isAffiliatePercentage = settings?.affiliate_type === 'PERCENTAGE';
  const affiliateValueDisplay = isAffiliatePercentage 
    ? `${settings?.affiliate_value}%` 
    : `R$ ${parseFloat(settings?.affiliate_value || 0).toFixed(2).replace('.', ',')}`;

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-6xl mt-20">
      
      <div className="flex flex-col md:flex-row gap-8">
        
        {/* SIDEBAR */}
        <div className="w-full md:w-80 flex-shrink-0 space-y-6">
          <div className="glass-card p-6 flex flex-col items-center text-center">
            <div className="w-24 h-24 bg-gradient-to-br from-primary to-primary/50 rounded-full flex items-center justify-center mb-4 overflow-hidden border-2 border-primary/20">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-3xl font-black text-white">{user.name.charAt(0)}</span>
              )}
            </div>
            <h2 className="text-xl font-bold text-white mb-1">{user.name}</h2>
            <p className="text-sm text-gray-400 mb-6">{user.email}</p>
            
            <div className="w-full bg-black/50 rounded-xl p-4 border border-white/5 mb-4 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-[50px] -mr-10 -mt-10 pointer-events-none"></div>
              <div className="text-xs text-gray-500 uppercase tracking-widest font-bold mb-1 relative z-10">Saldo da Carteira</div>
              <div className="text-3xl font-black text-primary relative z-10 mb-3">R$ {(user.walletBalance / 100).toFixed(2).replace('.', ',')}</div>
              <button 
                onClick={() => setRechargeModalOpen(true)}
                className="w-full bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30 font-bold text-xs py-2 rounded-lg transition-colors relative z-10 flex items-center justify-center gap-2"
              >
                <Plus size={14}/> Adicionar Saldo
              </button>
            </div>
          </div>
          
          <div className="glass-card p-2 flex flex-col gap-1">
            <button 
              onClick={() => setActiveTab('orders')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold ${
                activeTab === 'orders' ? 'bg-primary/20 text-primary' : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Package size={20} /> Meus Pedidos
            </button>
            <button 
              onClick={() => setActiveTab('affiliate')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold ${
                activeTab === 'affiliate' ? 'bg-yellow-500/20 text-yellow-500' : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Trophy size={20} /> Indique e Ganhe
            </button>
          </div>
        </div>

        {/* CONTENT */}
        <div className="flex-1">
          {/* AFILIADOS */}
          {activeTab === 'affiliate' && (
            <div className="glass-card p-8 text-white space-y-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
              
              <div className="text-center relative z-10 space-y-4">
                <div className="w-20 h-20 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto border border-yellow-500/30">
                  <Trophy size={40} className="text-yellow-500" />
                </div>
                <h2 className="text-3xl font-black">Seja um Parceiro!</h2>
                <p className="text-gray-400 max-w-lg mx-auto text-lg">
                  Ganhe <strong className="text-yellow-500">{affiliateValueDisplay}</strong> direto na sua carteira toda vez que alguém se cadastrar e comprar usando seu link exclusivo!
                </p>
              </div>
              
              {affiliateData ? (
                <div className="bg-black/60 p-8 rounded-2xl border border-white/10 mt-8 max-w-2xl mx-auto relative z-10 shadow-2xl">
                  <div className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <LinkIcon size={16} /> Seu Link de Indicação Exclusivo
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input 
                      type="text" 
                      readOnly 
                      value={`${window.location.origin}/login?ref=${affiliateData.affiliateCode}`}
                      className="flex-1 bg-black border border-white/10 rounded-xl px-5 py-4 text-primary font-mono text-sm focus:outline-none focus:border-primary/50 transition-colors"
                    />
                    <button onClick={handleCopyLink} className="bg-primary hover:bg-primary/80 text-white px-8 py-4 rounded-xl font-bold transition-colors shadow-lg shadow-primary/20 flex items-center justify-center gap-2 min-w-[140px]">
                      {copySuccess ? <><CheckCircle size={18} /> Copiado</> : 'Copiar Link'}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-3">Compartilhe este link no WhatsApp, Instagram, Telegram ou onde quiser.</p>
                  
                  <div className="mt-8 flex justify-around border-t border-white/10 pt-8">
                    <div className="text-center">
                      <div className="text-4xl font-black text-white mb-1">{affiliateData.referralsCount}</div>
                      <div className="text-sm text-gray-400 uppercase tracking-wider font-bold">Amigos Indicados</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center p-8">
                  <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                  <p className="text-gray-400">Carregando seus dados de parceiro...</p>
                </div>
              )}
            </div>
          )}

          {/* HISTÓRICO DE PEDIDOS */}
          {activeTab === 'orders' && (
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Package className="text-primary" /> Histórico de Pedidos
              </h3>
              <a href="/" className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg text-sm font-bold transition-colors border border-white/10 w-fit">
                🛒 Voltar para a Loja
              </a>
            </div>
            
            {orders.length === 0 ? (
              <div className="glass-card p-8 text-center text-gray-500">
                Você ainda não fez nenhuma compra.
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map(order => (
                  <div key={order.id} className="glass-card p-6 flex flex-col gap-4">
                    {/* Header do Pedido */}
                    <div className="flex flex-col md:flex-row justify-between gap-4 border-b border-white/5 pb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm text-gray-400 font-medium">Pedido #{order.id + 31794}</span>
                          <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-sm ${
                            order.status === 'PAGO' ? 'bg-green-500/20 text-green-500' :
                            order.status === 'ENTREGUE' ? 'bg-blue-500/20 text-blue-500' :
                            order.status === 'CANCELADO' ? 'bg-red-500/20 text-red-500' :
                            'bg-yellow-500/20 text-yellow-500'
                          }`}>
                            {order.status}
                          </span>
                        </div>
                        <div className="text-white font-bold text-sm">
                          {order.items.map(i => `${i.quantity}x ${i.product.name} ${i.variation ? `(${i.variation.name})` : ''}`).join(' + ')}
                        </div>
                        <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                          <Clock size={12} /> {new Date(order.createdAt).toLocaleDateString('pt-BR')}
                        </div>
                      </div>
                      
                      <div className="text-left md:text-right mt-2 md:mt-0">
                        <div className="text-xl font-black text-white">
                          R$ {((order.pricePaid + order.walletUsed) / 100).toFixed(2).replace('.', ',')}
                        </div>
                        {order.walletUsed > 0 && (
                          <div className="text-xs text-primary font-medium mt-1">
                            (- R$ {(order.walletUsed / 100).toFixed(2).replace('.', ',')} da Carteira)
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Credenciais Entregues */}
                    {order.status === 'ENTREGUE' && order.items.some(i => i.credentials && i.credentials.length > 0) && (
                      <div className="flex flex-col gap-4">
                        {order.items.map((i, idx) => (
                          i.credentials && i.credentials.length > 0 ? (
                            <div key={idx} className="bg-gradient-to-br from-black/80 to-black/40 border border-green-500/30 rounded-xl p-4 shadow-[0_0_15px_rgba(34,197,94,0.1)] relative overflow-hidden">
                              <div className="absolute top-0 left-0 w-1 h-full bg-green-500"></div>
                              <h4 className="text-green-400 text-sm font-black mb-4 flex items-center gap-2 uppercase tracking-wide">
                                <CheckCircle size={16} /> Seu Acesso Liberado
                              </h4>
                              
                              <div className="flex flex-col sm:flex-row gap-4">
                                {/* Imagem do Produto */}
                                {i.product.imageUrl && (
                                  <div className="w-24 h-24 sm:w-32 sm:h-32 flex-shrink-0 rounded-lg overflow-hidden border border-white/10 bg-black">
                                    <img src={i.product.imageUrl} alt={i.product.name} className="w-full h-full object-contain" />
                                  </div>
                                )}
                                
                                {/* Detalhes do Acesso */}
                                <div className="flex-1 space-y-3">
                                  {i.credentials.map((c, cIdx) => {
                                    let email = '';
                                    let senha = '';
                                    let notas = 'É estritamente proibido alterar a senha, email ou criar/excluir perfis. O descumprimento gera a perda imediata da garantia sem reembolso. Em caso de dúvidas, contate o suporte informando seu ID da Compra.';
                                    let raw = '';
                                    
                                    try {
                                      const parsed = JSON.parse(c.content);
                                      email = parsed.login || '';
                                      senha = parsed.password || '';
                                      if (parsed.notes) notas = parsed.notes;
                                    } catch {
                                      const parts = c.content.split(':');
                                      if (parts.length >= 2 && !c.content.includes('http')) {
                                        email = parts[0].trim();
                                        senha = parts.slice(1).join(':').trim();
                                      } else {
                                        raw = c.content;
                                      }
                                    }

                                    return (
                                      <div key={cIdx} className="bg-black/60 rounded-lg p-4 border border-white/5 relative">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-4 text-sm">
                                          <div className="text-gray-300 flex items-center">
                                            <span className="mr-2">⚜️</span> <span className="font-bold text-gray-500 mr-1">Serviço:</span> <span className="text-white font-bold">{c.product?.name || i.product.name} {i.variation ? `(${i.variation.name})` : ''}</span>
                                          </div>
                                          <div className="text-gray-300 flex items-center">
                                            <span className="mr-2">🎫</span> <span className="font-bold text-gray-500 mr-1">ID da compra:</span> #{order.id + 31794}
                                          </div>
                                          <div className="text-gray-300 flex items-center">
                                            <span className="mr-2">⏰</span> <span className="font-bold text-gray-500 mr-1">Data:</span> {new Date(order.createdAt).toLocaleDateString('pt-BR')}
                                          </div>
                                          <div className="text-gray-300 flex items-center">
                                            <span className="mr-2">📆</span> <span className="font-bold text-gray-500 mr-1">Vencimento:</span> {i.variation?.validity || i.product.validity || 'Vitalício'}
                                          </div>
                                          <div className="text-gray-300 flex items-center sm:col-span-2">
                                            <span className="mr-2">💰</span> <span className="font-bold text-gray-500 mr-1">Valor Pago:</span> R$ {(i.price / 100).toFixed(2).replace('.', ',')}
                                          </div>
                                          
                                          <div className="col-span-1 sm:col-span-2 my-1 border-t border-white/5"></div>
                                          
                                          {email && senha ? (
                                            <>
                                              <div className="col-span-1 sm:col-span-2">
                                                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
                                                  <div className="flex items-center text-gray-300 w-24">
                                                    <span className="mr-2">📧</span> <span className="font-bold text-gray-500">Email:</span>
                                                  </div>
                                                  <div className="flex-1 bg-white/5 px-4 py-2.5 rounded-lg font-mono text-white select-all border border-white/10">{email}</div>
                                                </div>
                                              </div>
                                              <div className="col-span-1 sm:col-span-2">
                                                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
                                                  <div className="flex items-center text-gray-300 w-24">
                                                    <span className="mr-2">🔐</span> <span className="font-bold text-gray-500">Senha:</span>
                                                  </div>
                                                  <div className="flex-1 bg-white/5 px-4 py-2.5 rounded-lg font-mono text-white select-all border border-white/10">{senha}</div>
                                                </div>
                                              </div>
                                            </>
                                          ) : (
                                            <div className="col-span-1 sm:col-span-2 flex flex-col sm:flex-row sm:items-start gap-2">
                                              <div className="flex items-center text-gray-300 min-w-[100px] mt-1">
                                                <span className="mr-2">🔑</span> <span className="font-bold text-gray-500">Acesso:</span>
                                              </div>
                                              <div className="flex-1 bg-white/5 px-3 py-2 rounded font-mono text-white select-all border border-white/10 whitespace-pre-wrap">{raw || c.content}</div>
                                            </div>
                                          )}
                                        </div>
                                        
                                        <div className="mt-4 pt-3 border-t border-white/5 flex justify-between items-center">
                                          <p className="text-xs text-gray-400 leading-relaxed whitespace-pre-wrap">
                                            <span className="mr-1">📃</span> <strong className="text-gray-300">Nota:</strong> {notas}
                                          </p>
                                          
                                          <button 
                                            onClick={() => {
                                              setReviewProduct(i.product);
                                              setReviewForm({ rating: 5, comment: '' });
                                              setReviewModalOpen(true);
                                            }}
                                            className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1 transition-colors ml-4 shrink-0"
                                          >
                                            <Star size={14} className="fill-black" />
                                            Avaliar
                                          </button>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                          ) : null
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          )}
        </div>
      </div>
      
      {/* REVIEW MODAL */}
      {reviewModalOpen && reviewProduct && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="glass-card p-6 w-full max-w-md relative">
            <button onClick={() => setReviewModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white">
              ✕
            </button>
            <h3 className="text-xl font-bold text-white mb-4">Avaliar: {reviewProduct.name}</h3>
            
            <form onSubmit={handleReviewSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Nota (1 a 5 Estrelas)</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button 
                      key={star} 
                      type="button" 
                      onClick={() => setReviewForm({...reviewForm, rating: star})}
                      className={`transition-colors ${star <= reviewForm.rating ? 'text-yellow-500' : 'text-gray-600'}`}
                    >
                      <Star size={32} className={star <= reviewForm.rating ? 'fill-yellow-500' : ''} />
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Comentário (Opcional)</label>
                <textarea 
                  value={reviewForm.comment}
                  onChange={e => setReviewForm({...reviewForm, comment: e.target.value})}
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary h-24 resize-none"
                  placeholder="Conte como foi sua experiência..."
                />
              </div>
              
              <button type="submit" className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-3 rounded-lg shadow-lg shadow-yellow-500/30 transition-all">
                Enviar Avaliação
              </button>
            </form>
          </div>
        </div>
      )}

      {/* RECHARGE MODAL */}
      {rechargeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#1a1c23] border border-white/10 p-6 rounded-2xl w-full max-w-md relative animate-in fade-in zoom-in duration-200">
            <button onClick={() => setRechargeModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white">
              ✕
            </button>
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><Wallet size={20} className="text-primary"/> Adicionar Saldo</h3>
            
            <form onSubmit={handleRecharge} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Valor da Recarga (R$)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">R$</span>
                  <input 
                    type="number"
                    step="0.01"
                    min="5"
                    value={rechargeAmount}
                    onChange={e => setRechargeAmount(e.target.value)}
                    className="w-full bg-black/50 border border-white/10 rounded-lg pl-10 pr-4 py-3 text-white font-bold focus:outline-none focus:border-primary"
                    placeholder="0,00"
                    required
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">Valor mínimo: R$ 5,00</p>
              </div>
              
              <button 
                type="submit" 
                disabled={isRecharging}
                className="w-full bg-primary hover:bg-primary/80 text-white font-bold py-3 rounded-lg shadow-lg shadow-primary/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isRecharging ? 'Gerando Pagamento...' : 'Gerar Pix (InfinitePay)'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
