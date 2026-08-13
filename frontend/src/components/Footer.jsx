import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, HeartHandshake, Zap, MessageCircle } from 'lucide-react';
import { SettingsContext } from '../contexts/SettingsContext';

export default function Footer() {
  const { settings } = useContext(SettingsContext);

  return (
    <footer className="bg-black/90 border-t border-white/10 pt-16 pb-8 mt-auto">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          
          {/* Coluna 1: Logo e Sobre */}
          <div className="col-span-1 md:col-span-1">
            <Link to="/" className="block mb-4">
              {settings?.logo_url ? (
                <img src={settings.logo_url} alt="Logo" className="h-16 md:h-20 w-auto object-contain" />
              ) : (
                <span className="text-2xl font-black text-primary tracking-tighter">
                  STREAM<span className="text-white">STORE</span>
                </span>
              )}
            </Link>
            <p className="text-gray-400 text-sm mb-6">
              Sua plataforma premium para acesso instantâneo aos melhores serviços de streaming, combos e ferramentas digitais.
            </p>
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:bg-primary hover:text-white transition-colors text-xs font-bold">
                IG
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:bg-[#1DA1F2] hover:text-white transition-colors text-xs font-bold">
                X
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:bg-[#25D366] hover:text-white transition-colors">
                <MessageCircle size={18} />
              </a>
            </div>
          </div>

          {/* Coluna 2: Categorias */}
          <div>
            <h4 className="text-white font-bold mb-6 uppercase tracking-wider text-sm">Categorias</h4>
            <ul className="space-y-3">
              <li><Link to="/?category=Streaming" className="text-gray-400 hover:text-primary transition-colors text-sm">Streaming</Link></li>
              <li><Link to="/?category=Contas Premium" className="text-gray-400 hover:text-primary transition-colors text-sm">Contas Premium</Link></li>
              <li><Link to="/?category=Combos" className="text-gray-400 hover:text-primary transition-colors text-sm">Combos</Link></li>
              <li><Link to="/?category=Inteligência Artificial" className="text-gray-400 hover:text-primary transition-colors text-sm">Inteligência Artificial</Link></li>
              <li><Link to="/?category=Games" className="text-gray-400 hover:text-primary transition-colors text-sm">Games</Link></li>
              <li><Link to="/?category=APKs Premium" className="text-gray-400 hover:text-primary transition-colors text-sm">APKs Premium</Link></li>
            </ul>
          </div>

          {/* Coluna 3: Links Úteis */}
          <div>
            <h4 className="text-white font-bold mb-6 uppercase tracking-wider text-sm">Links Úteis</h4>
            <ul className="space-y-3">
              <li><Link to="/dashboard" className="text-gray-400 hover:text-white transition-colors text-sm">Minha Conta</Link></li>
              <li><Link to="/login" className="text-gray-400 hover:text-white transition-colors text-sm">Login / Cadastro</Link></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">Termos de Uso</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">Política de Reembolso</a></li>
            </ul>
          </div>

          {/* Coluna 4: Garantias */}
          <div>
            <h4 className="text-white font-bold mb-6 uppercase tracking-wider text-sm">Por que comprar conosco?</h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <Zap className="text-primary mt-0.5" size={16} />
                <span className="text-gray-400 text-sm">Entrega imediata no WhatsApp após confirmação.</span>
              </li>
              <li className="flex items-start gap-3">
                <ShieldCheck className="text-primary mt-0.5" size={16} />
                <span className="text-gray-400 text-sm">Pagamento criptografado e 100% seguro.</span>
              </li>
              <li className="flex items-start gap-3">
                <HeartHandshake className="text-primary mt-0.5" size={16} />
                <span className="text-gray-400 text-sm">Suporte humanizado e garantia de acesso.</span>
              </li>
            </ul>
          </div>

        </div>

        {/* Linha Inferior */}
        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-gray-500 text-xs">
            © {new Date().getFullYear()} StreamStore. Todos os direitos reservados.
          </p>
          <div className="flex gap-2">
            {/* Ícones de pagamento fictícios para dar credibilidade */}
            <div className="px-2 py-1 bg-white/5 rounded text-xs font-bold text-gray-400 border border-white/10">PIX</div>
            <div className="px-2 py-1 bg-white/5 rounded text-xs font-bold text-gray-400 border border-white/10">InfinitePay</div>
          </div>
        </div>
      </div>
    </footer>
  );
}
