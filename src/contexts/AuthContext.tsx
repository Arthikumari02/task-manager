import React, { createContext, useContext, useRef, useEffect, ReactNode } from 'react';
import authStore, { AuthStore } from '../stores/auth/AuthStore';

// Event system for logout notifications
const logoutEventTarget = new EventTarget();
export const LOGOUT_EVENT = 'logout';


const AuthContext = createContext<AuthStore | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Use the singleton authStore instance
  const authStoreRef = useRef(authStore);

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
