import React, { createContext, useContext, useRef } from 'react';
import ListStore from '../stores/list/ListStore';

const ListContext = createContext<ListStore | undefined>(undefined);

export const ListProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {

  const getAuthData = () => {
    const token = localStorage.getItem('trello_token');
    const clientId = localStorage.getItem('trello_clientId');
    return { token, clientId };
  };

  // pass getAuthData into CardStore constructor
  const listStoreRef = useRef(new ListStore(getAuthData));

  return (
    <ListContext.Provider value={listStoreRef.current}>
      {children}
    </ListContext.Provider>
  );
};

export const useLists = (): ListStore => {
  const context = useContext(ListContext);
  if (context === undefined) {
    throw new Error('useLists must be used within a ListProvider');
  }
  return context;
};
