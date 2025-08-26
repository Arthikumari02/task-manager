// CardContext.tsx
import React, { createContext, useContext, useRef } from 'react';
import CardStore from '../stores/card/CardStore';

const CardContext = createContext<CardStore | undefined>(undefined);

export const CardsStoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // define how to get auth data
  const getAuthData = () => {
    const token = localStorage.getItem('trello_token');
    const clientId = localStorage.getItem('trello_clientId');
    return { token, clientId };
  };

  // pass getAuthData into CardStore constructor
  const cardStoreRef = useRef(new CardStore(getAuthData));

  return (
    <CardContext.Provider value={cardStoreRef.current}>
      {children}
    </CardContext.Provider>
  );
};

export const useCardsStore = (): CardStore => {
  const context = useContext(CardContext);
  if (context === undefined) {
    throw new Error('useCardsStore must be used within a CardProvider');
  }
  return context;
};
