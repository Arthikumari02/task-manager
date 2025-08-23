import React, { ReactNode } from 'react';
import { AuthProvider } from './AuthContext';
import { OrganizationProvider } from './OrganizationContext';
import { BoardProvider } from './BoardContext';
import { SearchProvider } from './SearchContext';

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  return (
    <AuthProvider>
      <OrganizationProvider>
        <BoardProvider>
          <SearchProvider>
            {children}
          </SearchProvider>
        </BoardProvider>
      </OrganizationProvider>
    </AuthProvider>
  );
};
