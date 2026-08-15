import { createContext, useState, useEffect, useContext } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for saved auth state on mount
    const isDemo = import.meta.env.VITE_USE_MOCK === 'true';
    if (isDemo) {
      const savedAuth = localStorage.getItem('isAuthenticated');
      if (savedAuth === 'true') {
        setIsAuthenticated(true);
      }
    } else {
      const token = localStorage.getItem('jwt_token');
      if (token) {
        setIsAuthenticated(true);
      }
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    const isDemo = import.meta.env.VITE_USE_MOCK === 'true';
    
    // Mock login logic for demo
    if (isDemo) {
      if (username === 'admin' && password === 'admin') {
        setIsAuthenticated(true);
        localStorage.setItem('isAuthenticated', 'true');
        return true;
      }
      return false;
    }
    
    // Replace with actual API call
    try {
      const response = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('jwt_token', data.token || data.access_token);
        setIsAuthenticated(true);
        return true;
      }
      return false;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('jwt_token');
  };

  if (loading) {
    return <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>Loading...</div>;
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
