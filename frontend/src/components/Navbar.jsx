import React, { useContext, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, User, Wallet, LogOut, Search, Sun, Moon, Edit, Camera, Key } from 'lucide-react';
import { AuthContext } from '../contexts/AuthContext';
import { CartContext } from '../contexts/CartContext';
import { ThemeContext } from '../contexts/ThemeContext';
import axios from 'axios';

export default function Navbar({ onSearch }) {
  const { user, logout, setUser } = useContext(AuthContext);
  const { cartCount, setIsCartOpen } = useContext(CartContext);
  const { theme, toggleTheme } = useContext(ThemeContext);
  const [searchTerm, setSearchTerm] = useState('');

  // Profile State
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  
  const [profileForm, setProfileForm] = useState({ name: '', email: '' });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '' });
  const [avatarForm, setAvatarForm] = useState({ avatarUrl: '' });

  const handleSearch = (e) => {
    e.preventDefault();
    if (onSearch) onSearch(searchTerm);
  };

  const handleChangeProfile = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const res = await axios.put('http://192.168.1.5:3001/api/users/me/profile', profileForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(res.data.user);
      alert('Perfil atualizado com sucesso!');
      setIsProfileModalOpen(false);
    } catch (err) {
      alert(err.response?.data?.error || 'Erro ao atualizar perfil');
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.put('http://192.168.1.5:3001/api/users/me/password', passwordForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Senha alterada com sucesso!');
      setIsPasswordModalOpen(false);
      setPasswordForm({ currentPassword: '', newPassword: '' });
    } catch (err) {
      alert(err.response?.data?.error || 'Erro ao alterar senha');
    }
  };

  const handleChangeAvatar = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const res = await axios.put('http://192.168.1.5:3001/api/users/me/avatar', avatarForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(res.data.user);
      alert('Foto alterada com sucesso!');
      setIsAvatarModalOpen(false);
      setAvatarForm({ avatarUrl: '' });
    } catch (err) {
      alert(err.response?.data?.error || 'Erro ao alterar foto');
    }
  };

  return (
    <nav className="w-full bg-white/80 dark:bg-black/80 backdrop-blur-xl border-b border-gray-200 dark:border-white/10 sticky top-0 z-50 transition-colors duration-300">
      <div className="container mx-auto px-4 h-20 flex items-center justify-between">
        {/* LOGO */}
        <Link to="/" className="text-2xl font-black text-primary tracking-tighter">
          STREAM<span className="text-gray-900 dark:text-white">STORE</span>
        </Link>

        {/* LUPA DE PESQUISA */}
        <div className="hidden md:flex flex-1 max-w-md mx-8 relative">
          <form onSubmit={handleSearch} className="w-full relative">
            <input 
              type="text" 
              placeholder="Pesquisar combo ou serviço..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-full py-2 pl-4 pr-10 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-primary/50 transition-colors"
            />
            <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
              <Search size={18} />
            </button>
          </form>
        </div>

        {/* ICONS & AUTH */}
        <div className="flex items-center gap-4 md:gap-6">
          {/* THEME TOGGLE */}
          <button onClick={toggleTheme} className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-white/5">
            {theme === 'light' ? <Moon size={22} /> : <Sun size={22} />}
          </button>

          {/* CART ICON */}
          <button onClick={() => setIsCartOpen(true)} className="relative p-2 text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-colors">
            <ShoppingCart size={24} />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-primary text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full shadow-[0_0_10px_rgba(229,9,20,0.5)]">
                {cartCount}
              </span>
            )}
          </button>

          {/* USER INFO */}
          {user ? (
            <div className="flex items-center gap-4">
              <Link to="/dashboard" className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 border border-gray-200 dark:border-white/10 rounded-lg transition-colors">
                <Wallet size={16} className="text-primary" />
                <span className="text-sm font-bold text-gray-900 dark:text-white">
                  R$ {(user.walletBalance / 100).toFixed(2).replace('.', ',')}
                </span>
              </Link>
              
              <div className="group relative">
                <button className="flex items-center gap-2 p-2 text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-colors">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white font-bold uppercase">
                    {user.avatarUrl ? (
                      <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover rounded-full" />
                    ) : (
                      user.name.charAt(0)
                    )}
                  </div>
                </button>
                {/* DROPDOWN (com pt-2 para cobrir o gap e não perder o hover) */}
                <div className="absolute right-0 top-full pt-2 w-48 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                  <div className="bg-white dark:bg-card border border-gray-200 dark:border-white/10 rounded-xl shadow-2xl pointer-events-none group-hover:pointer-events-auto">
                    <div className="p-4 border-b border-gray-100 dark:border-white/5">
                      <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{user.name}</p>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    </div>
                    <div className="p-2 border-b border-gray-100 dark:border-white/5">
                      <button onClick={() => {
                        setProfileForm({ name: user.name, email: user.email });
                        setIsProfileModalOpen(true);
                      }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-white dark:hover:bg-white/5 rounded-lg transition-colors text-left">
                        <Edit size={16} /> Editar Perfil
                      </button>
                      <button onClick={() => setIsAvatarModalOpen(true)} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-white dark:hover:bg-white/5 rounded-lg transition-colors text-left mt-1">
                        <Camera size={16} /> Trocar Foto
                      </button>
                      <button onClick={() => setIsPasswordModalOpen(true)} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-white dark:hover:bg-white/5 rounded-lg transition-colors text-left mt-1">
                        <Key size={16} /> Mudar Senha
                      </button>
                    </div>
                    <div className="p-2">
                      <Link to="/dashboard" className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-white dark:hover:bg-white/5 rounded-lg transition-colors">
                        <User size={16} /> Meu Painel
                      </Link>
                      <button onClick={logout} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors mt-1">
                        <LogOut size={16} /> Sair
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <Link to="/login" className="flex items-center gap-2 text-sm font-bold text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-colors">
              <User size={20} />
              <span className="hidden md:inline">Entrar</span>
            </Link>
          )}
        </div>
      </div>
      
      {/* MOBILE SEARCH BAR */}
      <div className="md:hidden px-4 pb-4">
        <form onSubmit={handleSearch} className="w-full relative">
          <input 
            type="text" 
            placeholder="Pesquisar..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-full py-2 pl-4 pr-10 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-primary/50 transition-colors"
          />
          <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">
            <Search size={18} />
          </button>
        </form>
      </div>
      {/* PROFILE MODAL */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/10 rounded-2xl w-full max-w-md p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Editar Perfil</h3>
            <form onSubmit={handleChangeProfile} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">Nome</label>
                <input 
                  type="text" 
                  required 
                  value={profileForm.name} 
                  onChange={e => setProfileForm({...profileForm, name: e.target.value})} 
                  className="w-full bg-gray-50 dark:bg-black/50 border border-gray-200 dark:border-white/10 rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">Email</label>
                <input 
                  type="email" 
                  required 
                  value={profileForm.email} 
                  onChange={e => setProfileForm({...profileForm, email: e.target.value})} 
                  className="w-full bg-gray-50 dark:bg-black/50 border border-gray-200 dark:border-white/10 rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:border-primary"
                />
              </div>
              <div className="flex gap-4 pt-4 mt-6">
                <button type="button" onClick={() => setIsProfileModalOpen(false)} className="w-1/2 py-2 rounded-lg font-medium bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 text-gray-900 dark:text-white transition-colors">Cancelar</button>
                <button type="submit" className="w-1/2 btn-primary py-2 rounded-lg font-medium">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PASSWORD MODAL */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/10 rounded-2xl w-full max-w-md p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Mudar Senha</h3>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">Senha Atual</label>
                <input 
                  type="password" 
                  required 
                  value={passwordForm.currentPassword} 
                  onChange={e => setPasswordForm({...passwordForm, currentPassword: e.target.value})} 
                  className="w-full bg-gray-50 dark:bg-black/50 border border-gray-200 dark:border-white/10 rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">Nova Senha</label>
                <input 
                  type="password" 
                  required 
                  value={passwordForm.newPassword} 
                  onChange={e => setPasswordForm({...passwordForm, newPassword: e.target.value})} 
                  className="w-full bg-gray-50 dark:bg-black/50 border border-gray-200 dark:border-white/10 rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:border-primary"
                />
              </div>
              <div className="flex gap-4 pt-4 mt-6">
                <button type="button" onClick={() => setIsPasswordModalOpen(false)} className="w-1/2 py-2 rounded-lg font-medium bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 text-gray-900 dark:text-white transition-colors">Cancelar</button>
                <button type="submit" className="w-1/2 btn-primary py-2 rounded-lg font-medium">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AVATAR MODAL */}
      {isAvatarModalOpen && (
        <div className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/10 rounded-2xl w-full max-w-md p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Trocar Foto de Perfil</h3>
            <form onSubmit={handleChangeAvatar} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">URL da Imagem</label>
                <input 
                  type="url" 
                  required 
                  value={avatarForm.avatarUrl} 
                  onChange={e => setAvatarForm({...avatarForm, avatarUrl: e.target.value})} 
                  placeholder="https://..."
                  className="w-full bg-gray-50 dark:bg-black/50 border border-gray-200 dark:border-white/10 rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:border-primary"
                />
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">Dica: Cole um link direto de uma imagem (.png ou .jpg)</p>
              </div>
              <div className="flex gap-4 pt-4 mt-6">
                <button type="button" onClick={() => setIsAvatarModalOpen(false)} className="w-1/2 py-2 rounded-lg font-medium bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 text-gray-900 dark:text-white transition-colors">Cancelar</button>
                <button type="submit" className="w-1/2 btn-primary py-2 rounded-lg font-medium">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </nav>
  );
}
