import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { User, CartItem, PremadePot } from '@shared/schema';
import { Language } from '@/lib/i18n';

interface AppContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  user: User | null;
  setUser: (user: User | null) => void;
  cart: CartItem[];
  addToCart: (pot: PremadePot, quantity?: number) => void;
  removeFromCart: (potId: string) => void;
  updateCartQuantity: (potId: string, quantity: number) => void;
  clearCart: () => void;
  cartTotal: number;
  cartCount: number;
  isAuthenticated: boolean;
  isAuthLoading: boolean;
  logout: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('language');
      return (saved as Language) || 'vi';
    }
    return 'vi';
  });

  const [user, setUser] = useState<User | null>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('user');
      return saved ? JSON.parse(saved) : null;
    }
    return null;
  });

  const [isAuthLoading, setIsAuthLoading] = useState(true);

  const [cart, setCart] = useState<CartItem[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('cart');
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('language', lang);
  };

  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await fetch('/api/auth/me', { credentials: 'include' });
        if (response.ok) {
          const userData = await response.json();
          if (userData.id) {
            setUser(userData);
          }
        }
      } catch (error) {
        console.log('Session check failed');
      } finally {
        setIsAuthLoading(false);
      }
    };
    checkSession();
  }, []);

  useEffect(() => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
  }, [user]);

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (pot: PremadePot, quantity: number = 1) => {
    setCart(prev => {
      const existing = prev.find(item => item.pot.id === pot.id);
      if (existing) {
        return prev.map(item => 
          item.pot.id === pot.id 
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { pot, quantity }];
    });
  };

  const removeFromCart = (potId: string) => {
    setCart(prev => prev.filter(item => item.pot.id !== potId));
  };

  const updateCartQuantity = (potId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(potId);
      return;
    }
    setCart(prev => prev.map(item => 
      item.pot.id === potId ? { ...item, quantity } : item
    ));
  };

  const clearCart = () => setCart([]);

  const cartTotal = cart.reduce((sum, item) => {
    const price = parseFloat(item.pot.price as string) || 0;
    return sum + price * item.quantity;
  }, 0);

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const isAuthenticated = !!user;

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } catch (error) {
      console.log('Logout request failed');
    }
    setUser(null);
    localStorage.removeItem('user');
  };

  return (
    <AppContext.Provider value={{
      language,
      setLanguage,
      user,
      setUser,
      cart,
      addToCart,
      removeFromCart,
      updateCartQuantity,
      clearCart,
      cartTotal,
      cartCount,
      isAuthenticated,
      isAuthLoading,
      logout,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
