import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import Navbar from './components/Navbar';
import CartSidebar from './components/CartSidebar';
import Storefront from './pages/Storefront';
import Checkout from './pages/Checkout';
import AdminPanel from './pages/AdminPanel';
import Login from './pages/Login';
import ClientDashboard from './pages/ClientDashboard';
import Footer from './components/Footer';
import { ThemeProvider } from './contexts/ThemeContext';
import { SettingsProvider } from './contexts/SettingsContext';
import { AuthContext } from './contexts/AuthContext';
import { useContext, useEffect } from 'react';
import { Navigate } from 'react-router-dom';

import SocialProof from './components/SocialProof';
import SupportButton from './components/SupportButton';

function AdminRoute({ children }) {
  const { user, loading, logout } = useContext(AuthContext);
  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center text-white font-bold">Carregando painel...</div>;
  if (!user) return <Navigate to="/login?redirect=/admin" />;
  if (user.role !== 'ADMIN') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="glass-card max-w-md w-full p-8 text-center border border-red-500/30 shadow-2xl">
          <div className="w-16 h-16 bg-red-500/20 text-red-400 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
            🛡️
          </div>
          <h2 className="text-xl font-black text-white mb-2">Acesso Restrito ao Painel</h2>
          <p className="text-gray-400 text-sm mb-6">
            A conta conectada (<strong className="text-white">{user.email}</strong>) é uma conta de cliente e não tem permissão de Administrador.
          </p>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => { logout(); window.location.href = '/login?redirect=/admin'; }}
              className="bg-primary hover:bg-primary/80 text-white font-bold py-2.5 px-4 rounded-xl transition-colors text-sm shadow-lg shadow-primary/20"
            >
              Trocar para Conta de Administrador
            </button>
            <a
              href="/"
              className="bg-white/10 hover:bg-white/20 text-gray-300 font-bold py-2.5 px-4 rounded-xl transition-colors text-sm"
            >
              Voltar para a Loja
            </a>
          </div>
        </div>
      </div>
    );
  }
  return children;
}

function PrivateRoute({ children }) {
  const { user, loading } = useContext(AuthContext);
  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center text-white">Carregando...</div>;
  if (!user) return <Navigate to="/login" />;
  return children;
}

function AppContent() {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const ref = params.get('ref');
    if (ref) {
      localStorage.setItem('referralCode', ref);
    }
  }, [location]);

  return (
    <div className="flex flex-col min-h-screen">
      {!isAdmin && <Navbar />}
      {!isAdmin && <CartSidebar />}
      {!isAdmin && <SocialProof />}
      
      <div className="flex-1">
        <Routes>
          <Route path="/" element={<Storefront />} />
          <Route path="/checkout" element={<PrivateRoute><Checkout /></PrivateRoute>} />
          <Route path="/admin" element={<AdminRoute><AdminPanel /></AdminRoute>} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<PrivateRoute><ClientDashboard /></PrivateRoute>} />
        </Routes>
      </div>

      {!isAdmin && <SupportButton />}
      {!isAdmin && <Footer />}
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <SettingsProvider>
        <AuthProvider>
          <CartProvider>
            <BrowserRouter>
              <AppContent />
            </BrowserRouter>
          </CartProvider>
        </AuthProvider>
      </SettingsProvider>
    </ThemeProvider>
  );
}

export default App;
