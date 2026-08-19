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
  const { user, loading } = useContext(AuthContext);
  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center text-white">Carregando...</div>;
  if (!user || user.role !== 'ADMIN') return <Navigate to="/dashboard" />;
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
