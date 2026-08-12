import React, { useState, useEffect } from 'react';
import { CheckCircle2 } from 'lucide-react';

const NAMES = ['João P.', 'Maria S.', 'Lucas M.', 'Ana V.', 'Pedro H.', 'Carla D.', 'Thiago R.', 'Fernanda C.', 'Rafael T.', 'Juliana B.'];
const PRODUCTS = ['Netflix 4K - 30 Dias', 'Canva Pro - Anual', 'Combo Plus (Disney+ e Star+)', 'YouTube Premium', 'Crunchyroll Mega Fan', 'HBO Max 30 Dias', 'IPTV Premium'];

export default function SocialProof() {
  const [notification, setNotification] = useState(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Função para mostrar notificação aleatória
    const showRandomPurchase = () => {
      const randomName = NAMES[Math.floor(Math.random() * NAMES.length)];
      const randomProduct = PRODUCTS[Math.floor(Math.random() * PRODUCTS.length)];
      
      setNotification(`${randomName} acabou de comprar ${randomProduct}`);
      setIsVisible(true);

      // Ocultar após 4 segundos
      setTimeout(() => {
        setIsVisible(false);
      }, 4000);
    };

    // Timeout inicial para a primeira notificação
    const initialTimeout = setTimeout(() => {
      showRandomPurchase();
    }, 5000); // 5 segundos após entrar no site

    // Intervalo para notificações subsequentes
    const interval = setInterval(() => {
      showRandomPurchase();
    }, 25000 + Math.random() * 20000); // Entre 25 e 45 segundos

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, []);

  if (!notification) return null;

  return (
    <div 
      className={`fixed bottom-4 left-4 z-50 transition-all duration-500 transform ${
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0 pointer-events-none'
      }`}
    >
      <div className="bg-black/90 backdrop-blur-md border border-primary/30 rounded-lg p-3 shadow-lg shadow-primary/20 flex items-center gap-3 max-w-xs">
        <div className="bg-green-500/20 p-2 rounded-full">
          <CheckCircle2 size={18} className="text-green-500" />
        </div>
        <div>
          <p className="text-xs text-gray-400">Compra confirmada agora</p>
          <p className="text-sm font-bold text-white line-clamp-2">{notification}</p>
        </div>
      </div>
    </div>
  );
}
