import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { CartContext } from '../contexts/CartContext';
import { AuthContext } from '../contexts/AuthContext';
import { ShieldCheck, Lock, Wallet } from 'lucide-react';

export default function Checkout() {
  const { cart, cartTotal, clearCart, appliedCoupon, setAppliedCoupon, discountAmount, cartTotalWithDiscount } = useContext(CartContext);
  const { user, setUser } = useContext(AuthContext);
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [useWallet, setUseWallet] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [couponInput, setCouponInput] = useState('');

  const handleApplyCoupon = async () => {
    if (!couponInput) return;
    try {
      const res = await axios.post('http://192.168.1.5:3001/api/coupons/validate', { code: couponInput });
      setAppliedCoupon(res.data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Cupom inválido');
    }
  };

  useEffect(() => {
    if (cart.length === 0 && !success) {
      navigate('/');
    }
    if (user) {
      if (!name) setName(user.name);
    }
  }, [cart, navigate, success, user, name]);

  const handleCheckout = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      const cartItems = cart.map(c => ({ 
        productId: c.id, 
        variationId: c.variationId,
        quantity: c.quantity 
      }));

      const res = await axios.post('http://192.168.1.5:3001/api/checkout', {
        customerName: name,
        customerWhatsapp: whatsapp,
        cartItems,
        useWallet,
        couponCode: appliedCoupon ? appliedCoupon.code : null
      }, { headers });

      clearCart();

      if (res.data.fullyPaidWithWallet) {
        if (user && setUser) {
          setUser(prev => ({ ...prev, walletBalance: prev.walletBalance - cartTotalWithDiscount }));
        }
        setSuccess(true);
        setLoading(false);
        // Redirecionamento automático após 2 segundos
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
      } else {
        // Redireciona para o link de pagamento da InfinitePay
        window.location.href = res.data.paymentUrl;
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Erro ao processar pagamento. Tente novamente.');
      setLoading(false);
    }
  };

  const remainingToPay = () => {
    if (!user || !useWallet) return cartTotalWithDiscount;
    return cartTotalWithDiscount - user.walletBalance > 0 ? cartTotalWithDiscount - user.walletBalance : 0;
  };

  if (success) {
    return (
      <div className="container mx-auto px-4 py-12 flex justify-center">
        <div className="glass-card p-8 w-full max-w-md text-center">
          <ShieldCheck size={64} className="text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-black text-white mb-2">Compra Aprovada!</h2>
          <p className="text-gray-400 mb-6">
            O valor foi deduzido da sua carteira com sucesso. Você receberá o acesso no WhatsApp em instantes!
          </p>
          <button onClick={() => navigate('/dashboard')} className="btn-primary w-full py-3">
            Ir para o Painel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto flex flex-col md:flex-row gap-8">
        
        {/* ESQUERDA: Resumo do Carrinho */}
        <div className="flex-1 space-y-6">
          <div className="glass-card p-6 border-t-4 border-t-primary">
            <h2 className="text-xl font-bold text-white mb-4">Resumo do Pedido</h2>
            <div className="space-y-4">
              {cart.map(item => (
                <div key={item.id} className="flex justify-between items-center bg-black/40 p-3 rounded-lg border border-white/5">
                  <div className="flex items-center gap-3">
                    <img src={item.imageUrl} alt={item.name} className="w-12 h-12 object-cover rounded bg-black" />
                    <div>
                      <h4 className="text-sm font-bold text-white line-clamp-1">{item.name}</h4>
                      <p className="text-xs text-gray-500">Qtd: {item.quantity}</p>
                    </div>
                  </div>
                  <div className="text-sm font-bold text-primary">
                    R$ {((item.price * item.quantity) / 100).toFixed(2).replace('.', ',')}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-6 pt-4 border-t border-white/10 space-y-2">
              <div className="flex justify-between text-gray-400 text-sm">
                <span>Subtotal</span>
                <span>R$ {(cartTotal / 100).toFixed(2).replace('.', ',')}</span>
              </div>

              {appliedCoupon && (
                <div className="flex justify-between text-green-500 text-sm font-bold">
                  <span>Cupom ({appliedCoupon.code})</span>
                  <span>- R$ {(discountAmount / 100).toFixed(2).replace('.', ',')}</span>
                </div>
              )}
              
              {user && user.walletBalance > 0 && useWallet && (
                <div className="flex justify-between text-blue-500 text-sm font-bold">
                  <span>Desconto Carteira</span>
                  <span>- R$ {(Math.min(cartTotalWithDiscount, user.walletBalance) / 100).toFixed(2).replace('.', ',')}</span>
                </div>
              )}
              
              <div className="flex justify-between text-white text-lg font-black pt-2">
                <span>Total a Pagar</span>
                <span className="text-primary">R$ {(remainingToPay() / 100).toFixed(2).replace('.', ',')}</span>
              </div>
            </div>
          </div>

          <div className="glass-card p-4 flex items-center justify-center gap-2 text-sm text-gray-400">
            <Lock size={16} className="text-green-500" />
            Pagamento 100% Seguro via InfinitePay
          </div>
        </div>

        {/* DIREITA: Dados e Pagamento */}
        <div className="w-full md:w-[400px]">
          <div className="glass-card p-8">
            <h2 className="text-xl font-bold text-white mb-6">Finalizar Compra</h2>
            
            {error && <div className="bg-red-500/20 text-red-500 p-3 rounded-lg mb-6 text-sm border border-red-500/30">{error}</div>}

            <form onSubmit={handleCheckout} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Nome Completo</label>
                <input 
                  type="text" 
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">WhatsApp (com DDD)</label>
                <input 
                  type="text" 
                  required
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
                  placeholder="Ex: 11999999999"
                />
              </div>

              {user && user.walletBalance > 0 && (
                <div className="bg-gradient-to-r from-primary/20 to-purple-600/20 p-4 rounded-lg border border-primary/30 mt-4">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={useWallet}
                      onChange={(e) => setUseWallet(e.target.checked)}
                      className="mt-1"
                    />
                    <div>
                      <div className="flex items-center gap-1 font-bold text-white text-sm">
                        <Wallet size={14} className="text-primary"/> Usar Saldo da Carteira
                      </div>
                      <p className="text-xs text-gray-400 mt-1">Você tem R$ {(user.walletBalance / 100).toFixed(2).replace('.', ',')} disponíveis.</p>
                    </div>
                  </label>
                </div>
              )}

              <div className="bg-black/50 border border-white/10 p-4 rounded-lg mt-4">
                <label className="block text-sm font-medium text-gray-400 mb-2">Possui um cupom de desconto?</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                    placeholder="Digite seu cupom..."
                    disabled={appliedCoupon !== null}
                    className="flex-1 bg-black border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary transition-colors disabled:opacity-50"
                  />
                  {appliedCoupon ? (
                    <button type="button" onClick={() => setAppliedCoupon(null)} className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors">
                      Remover
                    </button>
                  ) : (
                    <button type="button" onClick={handleApplyCoupon} className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors">
                      Aplicar
                    </button>
                  )}
                </div>
                {appliedCoupon && (
                  <p className="text-green-500 text-xs mt-2 font-bold">Cupom {appliedCoupon.code} aplicado com sucesso!</p>
                )}
              </div>

              <div className="bg-orange-500/10 border border-orange-500/30 p-3 rounded-lg mt-4 flex gap-3 items-start">
                <span className="text-orange-500 text-lg">⚠️</span>
                <p className="text-xs text-gray-300 leading-relaxed">
                  <strong className="text-orange-500 block mb-1">Aviso Importante sobre Reembolsos</strong>
                  Não realizamos reembolso via PIX sob nenhuma hipótese. Qualquer estorno ou devolução será creditado automaticamente como <strong className="text-white">Saldo na sua Carteira</strong> dentro da plataforma.
                </p>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className={`btn-primary w-full mt-8 py-4 uppercase tracking-wider text-sm shadow-[0_0_20px_rgba(229,9,20,0.4)] ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {loading ? 'Processando...' : remainingToPay() === 0 ? 'Concluir Compra' : 'Pagar com Pix'}
              </button>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
}
