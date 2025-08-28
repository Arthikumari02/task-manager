import React, { ReactNode } from 'react';
import { AuthStoreProvider } from './AuthContext';
import { OrganizationStoreProvider } from './OrganizationContext';
import { BoardsStoreProvider } from './BoardContext';
import { CardsStoreProvider } from './CardContext';

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  return (
    <AuthStoreProvider>
      <OrganizationStoreProvider>
        <BoardsStoreProvider>
          <CardsStoreProvider>
            {children}
          </CardsStoreProvider>
        </BoardsStoreProvider>
      </OrganizationStoreProvider>
    </AuthStoreProvider>
  );
};
