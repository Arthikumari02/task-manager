import React, { createContext, useContext, useRef, useEffect, ReactNode } from 'react';
import AuthStore from '../stores/auth/AuthStore';

// Event system for logout notifications
const logoutEventTarget = new EventTarget();
export const LOGOUT_EVENT = 'logout';


const AuthContext = createContext<AuthStore | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const getAuthData = () => {
    const token = localStorage.getItem('trello_token');
    const clientId = localStorage.getItem('trello_clientId');
    return { token, clientId };
  };

  // pass getAuthData into CardStore constructor
  const authStoreRef = useRef(new AuthStore());

  return (
    <AuthContext.Provider value={authStoreRef.current}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthStore => {
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
