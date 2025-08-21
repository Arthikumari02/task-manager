import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Event system for logout notifications
const logoutEventTarget = new EventTarget();
export const LOGOUT_EVENT = 'logout';

interface AuthContextType {
  token: string | null;
  clientId: string | null;
  isAuthenticated: boolean;
  userInfo: { fullName: string; initials: string } | null;
  login: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [userInfo, setUserInfo] = useState<{ fullName: string; initials: string } | null>(null);
  const [clientId] = useState<string | null>(
    process.env.REACT_APP_TRELLO_API_KEY || process.env.REACT_APP_TRELLO_CLIENT_ID || null
  );

  useEffect(() => {
    const storedToken = localStorage.getItem('trello_token');
    if (storedToken) {
      setToken(storedToken);
      fetchUserInfo(storedToken);
    }
  }, []);

  const fetchUserInfo = async (authToken: string) => {
    if (!clientId || !authToken) return;
    
    try {
      const response = await fetch(
        `https://api.trello.com/1/members/me?key=${clientId}&token=${authToken}`
      );
      
      if (response.ok) {
        const userData = await response.json();
        const fullName = userData.fullName || userData.username || 'User';
        const initials = fullName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();
        setUserInfo({ fullName, initials });
      }
    } catch (error) {
      console.error('Failed to fetch user info:', error);
    }
  };

  const login = (newToken: string) => {
    setToken(newToken);
    localStorage.setItem('trello_token', newToken);
    fetchUserInfo(newToken);
  };

  const logout = () => {
    setToken(null);
    setUserInfo(null);
    localStorage.removeItem('trello_token');
    // Notify other contexts to reset their data
    logoutEventTarget.dispatchEvent(new CustomEvent(LOGOUT_EVENT));
  };

  const value: AuthContextType = {
    token,
    clientId,
    isAuthenticated: !!token,
    userInfo,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Hook for other contexts to listen to logout events
export const useLogoutListener = (callback: () => void) => {
  useEffect(() => {
    const handleLogout = () => callback();
    logoutEventTarget.addEventListener(LOGOUT_EVENT, handleLogout);
    return () => logoutEventTarget.removeEventListener(LOGOUT_EVENT, handleLogout);
  }, [callback]);
};
