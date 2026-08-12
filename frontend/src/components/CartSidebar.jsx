import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Trash2, Plus, Minus, ShoppingBag } from 'lucide-react';
import { CartContext } from '../contexts/CartContext';

export default function CartSidebar() {
  const { cart, removeFromCart, updateQuantity, cartTotal, isCartOpen, setIsCartOpen } = useContext(CartContext);
  const navigate = useNavigate();

  if (!isCartOpen) return null;

  return (
    <>
      {/* OVERLAY */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity"
        onClick={() => setIsCartOpen(false)}
      />
      
      {/* SIDEBAR */}
      <div className="fixed top-0 right-0 h-full w-full max-w-md bg-card border-l border-white/10 shadow-2xl z-50 flex flex-col transform transition-transform">
        
        {/* HEADER */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <ShoppingBag className="text-primary" /> Seu Combo
          </h2>
          <button onClick={() => setIsCartOpen(false)} className="text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 p-2 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* ITEMS */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {cart.length === 0 ? (
            <div className="text-center text-gray-500 mt-10">
              <ShoppingBag size={48} className="mx-auto mb-4 opacity-20" />
              <p>Seu carrinho está vazio.</p>
              <button onClick={() => setIsCartOpen(false)} className="mt-4 text-primary hover:underline">
                Continuar Comprando
              </button>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.cartItemId || item.id} className="flex gap-4 bg-black/50 p-3 rounded-xl border border-white/5">
                <img src={item.imageUrl} alt={item.name} className="w-20 h-20 object-cover rounded-lg bg-black" />
                <div className="flex-1 flex flex-col">
                  <h3 className="font-bold text-sm leading-tight text-white mb-1 line-clamp-2">
                    {item.name} {item.variationName && <span className="text-primary block text-xs">({item.variationName})</span>}
                  </h3>
                  <div className="text-primary font-bold mb-auto">
                    R$ {(item.price / 100).toFixed(2).replace('.', ',')}
                  </div>
                  
                  <div className="flex items-center justify-between mt-2">
                    {/* QUANTITY CONTROLS */}
                    <div className="flex items-center gap-3 bg-white/5 rounded-lg px-2 py-1">
                      <button onClick={() => updateQuantity(item.cartItemId || item.id, -1)} className="text-gray-400 hover:text-white"><Minus size={14}/></button>
                      <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.cartItemId || item.id, 1)} className="text-gray-400 hover:text-white"><Plus size={14}/></button>
                    </div>
                    {/* REMOVE BUTTON */}
                    <button onClick={() => removeFromCart(item.cartItemId || item.id)} className="text-red-500/70 hover:text-red-500 p-1">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* FOOTER */}
        {cart.length > 0 && (
          <div className="p-6 border-t border-white/10 bg-black/50">
            <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-lg mb-4 text-center">
              <p className="text-red-400 text-xs font-medium">
                ⏳ Sua compra só está garantida após o pagamento. 
                <strong className="block mt-1 text-white">Faça o pagamento antes que esgote!</strong>
              </p>
            </div>
            
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-400">Total do Combo:</span>
              <span className="text-2xl font-black text-white">
                R$ {(cartTotal / 100).toFixed(2).replace('.', ',')}
              </span>
            </div>
            <button 
              onClick={() => {
                setIsCartOpen(false);
                navigate('/checkout');
              }}
              className="w-full btn-primary py-4 uppercase tracking-wider text-sm shadow-[0_0_20px_rgba(229,9,20,0.4)]"
            >
              Finalizar Compra
            </button>
          </div>
        )}
      </div>
    </>
  );
}
