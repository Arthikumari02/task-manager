import React, { ReactNode } from 'react';
import { AuthProvider } from './AuthContext';
import { OrganizationProvider } from './OrganizationContext';
import { BoardProvider } from './BoardContext';
import { ListProvider } from './ListContext';
import { CardProvider } from './CardContext';

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  return (
    <AuthProvider>
      <OrganizationProvider>
        <BoardProvider>
          <CardProvider>
            {children}
          </CardProvider>
        </BoardProvider>
      </OrganizationProvider>
    </AuthProvider>
  );
};
