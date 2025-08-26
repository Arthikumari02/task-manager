import React, { ReactNode } from 'react';
import { AuthStoreProvider } from './AuthContext';
import { OrganizationStoreProvider } from './OrganizationContext';
import { BoardsStoreProvider } from './BoardContext';
import { SearchStoreProvider } from './SearchContext';

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  return (
    <AuthStoreProvider>
      <OrganizationStoreProvider>
        <BoardsStoreProvider>
          <SearchStoreProvider>
            {children}
          </SearchStoreProvider>
        </BoardsStoreProvider>
      </OrganizationStoreProvider>
    </AuthStoreProvider>
  );
};
