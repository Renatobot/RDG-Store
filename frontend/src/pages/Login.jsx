import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { User, Mail, Lock, LogIn, UserPlus } from 'lucide-react';

export default function Login() {
  const { login, register, user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) navigate('/dashboard');
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (isLogin) {
        await login(formData.email, formData.password);
      } else {
        const referralCode = localStorage.getItem('referralCode');
        await register(formData.name, formData.email, formData.password, referralCode);
        if (referralCode) localStorage.removeItem('referralCode'); // Limpa após usar
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Erro de autenticação');
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] flex items-center justify-center p-4">
      <div className="glass-card w-full max-w-md p-8 relative overflow-hidden">
        {/* Glow de fundo */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full mix-blend-screen filter blur-[80px] -z-10"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-600/20 rounded-full mix-blend-screen filter blur-[80px] -z-10"></div>
        
        <div className="text-center mb-8">
          <h2 className="text-3xl font-black text-white mb-2">{isLogin ? 'Bem-vindo de volta' : 'Criar Conta'}</h2>
          <p className="text-gray-400 text-sm">
            {isLogin ? 'Faça login para acessar sua carteira e combos.' : 'Junte-se à maior comunidade de streaming.'}
          </p>
        </div>

        {error && <div className="bg-red-500/20 text-red-500 p-3 rounded-lg text-sm text-center mb-6 border border-red-500/50">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
              <input 
                type="text" 
                required 
                placeholder="Seu Nome Completo" 
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                className="w-full bg-black/50 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-primary transition-colors"
              />
            </div>
          )}

          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
            <input 
              type="email" 
              required 
              placeholder="seu@email.com" 
              value={formData.email}
              onChange={e => setFormData({...formData, email: e.target.value})}
              className="w-full bg-black/50 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-primary transition-colors"
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
            <input 
              type="password" 
              required 
              placeholder="Sua senha" 
              value={formData.password}
              onChange={e => setFormData({...formData, password: e.target.value})}
              className="w-full bg-black/50 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-primary transition-colors"
            />
          </div>

          <button type="submit" className="w-full btn-primary py-3 rounded-xl uppercase tracking-wider text-sm shadow-[0_0_20px_rgba(229,9,20,0.4)] mt-6">
            {isLogin ? <><LogIn size={18}/> Entrar na Conta</> : <><UserPlus size={18}/> Cadastrar</>}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button 
            type="button" 
            onClick={() => { setIsLogin(!isLogin); setError(''); setFormData({name:'', email:'', password:''}); }} 
            className="text-gray-400 hover:text-primary text-sm transition-colors"
          >
            {isLogin ? 'Não tem uma conta? Cadastre-se' : 'Já tem conta? Faça login'}
          </button>
        </div>
      </div>
    </div>
  );
}
