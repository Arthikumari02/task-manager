import React, { createContext, useContext, useRef } from 'react';
import SearchStore from '../stores/search/SearchStore';

const SearchContext = createContext<SearchStore | undefined>(undefined);

export const SearchStoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {

  const getAuthData = () => {
    const token = localStorage.getItem('trello_token');
    const clientId = localStorage.getItem('trello_clientId');
    return { token, clientId };
  };

  const searchStoreRef = useRef(new SearchStore(getAuthData));

  return (
    <SearchContext.Provider value={searchStoreRef.current}>
      {children}
    </SearchContext.Provider>
  );
};

export const useSearchStore = (): SearchStore => {
  const context = useContext(SearchContext);
  if (context === undefined) {
    throw new Error('useSearch must be used within a SearchProvider');
  }
  return context;
};
