import { useContext, useEffect, useState } from 'react';
import { MessageCircle } from 'lucide-react';
import { SettingsContext } from '../contexts/SettingsContext';

export default function SupportButton() {
  const { settings } = useContext(SettingsContext);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Show after a small delay for a nice entrance effect
    const timer = setTimeout(() => setIsVisible(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  const whatsappNumber = settings?.whatsapp;
  if (!whatsappNumber) return null;

  // Ensure it starts with 55 for Brazil if not specified
  const formattedNumber = whatsappNumber.replace(/\D/g, '');
  const finalNumber = formattedNumber.startsWith('55') ? formattedNumber : `55${formattedNumber}`;
  
  const whatsappUrl = `https://wa.me/${finalNumber}`;

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`fixed bottom-6 right-6 z-[100] bg-green-500 hover:bg-green-400 text-white p-4 rounded-full shadow-lg hover:shadow-[0_0_20px_rgba(34,197,94,0.5)] transition-all duration-300 flex items-center justify-center transform hover:scale-110 group ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}
      aria-label="Falar com Suporte"
    >
      <MessageCircle size={28} className="drop-shadow-sm" />
      
      {/* Tooltip */}
      <span className="absolute right-full mr-4 bg-black/80 backdrop-blur-sm border border-white/10 text-white text-xs font-bold py-2 px-3 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
        Falar com o Suporte
      </span>
      
      {/* Ping animation */}
      <span className="absolute flex h-full w-full inset-0">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-20"></span>
      </span>
    </a>
  );
}
