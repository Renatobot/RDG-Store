import React, { createContext, useState, useEffect } from 'react';

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem('cart');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState(null);

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (product, variation = null) => {
    if (product.badge === '🔴 ESGOTADO' || product.badge === 'ESGOTADO') {
      alert("Este produto está esgotado no momento.");
      return;
    }

    const cartItemId = variation ? `${product.id}-${variation.id}` : product.id;

    setCart(prev => {
      const existing = prev.find(item => (item.cartItemId || item.id) === cartItemId);
      if (existing) {
        return prev.map(item => (item.cartItemId || item.id) === cartItemId ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { 
        ...product, 
        cartItemId,
        variationId: variation ? variation.id : null,
        variationName: variation ? variation.name : null,
        price: variation ? variation.price : product.price,
        originalPrice: variation ? variation.originalPrice : product.originalPrice,
        quantity: 1 
      }];
    });
    setIsCartOpen(true);
  };

  const removeFromCart = (cartItemId) => {
    setCart(prev => prev.filter(item => (item.cartItemId || item.id) !== cartItemId));
  };

  const updateQuantity = (cartItemId, amount) => {
    setCart(prev => prev.map(item => {
      if ((item.cartItemId || item.id) === cartItemId) {
        const newQ = item.quantity + amount;
        return newQ > 0 ? { ...item, quantity: newQ } : item;
      }
      return item;
    }));
  };

  const clearCart = () => {
    setCart([]);
    setAppliedCoupon(null);
  };

  const cartTotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  let discountAmount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.type === 'PERCENTAGE') {
      discountAmount = Math.floor(cartTotal * (appliedCoupon.value / 100));
    } else if (appliedCoupon.type === 'FIXED') {
      discountAmount = appliedCoupon.value;
    }
  }

  const cartTotalWithDiscount = Math.max(0, cartTotal - discountAmount);

  return (
    <CartContext.Provider value={{ 
      cart, addToCart, removeFromCart, updateQuantity, clearCart, 
      cartTotal, cartCount, isCartOpen, setIsCartOpen,
      appliedCoupon, setAppliedCoupon, discountAmount, cartTotalWithDiscount
    }}>
      {children}
    </CartContext.Provider>
  );
};
