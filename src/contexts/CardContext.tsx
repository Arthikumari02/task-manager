import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { useAuth, useLogoutListener } from './AuthContext';
import { TrelloCard } from '../types';

interface CardContextType {
  boardCards: { [boardId: string]: TrelloCard[] };
  isLoading: boolean;
  error: string | null;
  isCreating: boolean;
  fetchBoardCards: (boardId: string) => Promise<TrelloCard[]>;
  createCard: (listId: string, name: string) => Promise<TrelloCard | null>;
  moveCard: (boardId: string, cardId: string, sourceListId: string, destinationListId: string, destinationIndex: number) => void;
  reorderCardsInList: (boardId: string, listId: string, sourceIndex: number, destinationIndex: number) => void;
  renameCard: (boardId: string, cardId: string, newName: string) => Promise<TrelloCard | null>; // add this
}

const CardContext = createContext<CardContextType | undefined>(undefined);

interface CardProviderProps {
  children: ReactNode;
}

export const CardProvider: React.FC<CardProviderProps> = ({ children }) => {
  const { token, clientId } = useAuth();
  const [boardCards, setBoardCards] = useState<{ [boardId: string]: TrelloCard[] }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Reset data on logout
  const resetData = useCallback(() => {
    setBoardCards({});
    setIsLoading(false);
    setError(null);
    setIsCreating(false);
  }, []);

  useLogoutListener(resetData);

  const fetchBoardCards = useCallback(async (boardId: string): Promise<TrelloCard[]> => {
    if (!token || !clientId) return [];

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `https://api.trello.com/1/boards/${boardId}/cards?key=${clientId}&token=${token}`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch cards: ${response.statusText}`);
      }

      const apiCards = await response.json();
      const filteredCards: TrelloCard[] = apiCards
        .filter((card: any) => !card.closed)
        .map((card: any) => ({
          id: card.id,
          name: card.name,
          desc: card.desc || '',
          closed: card.closed,
          pos: card.pos,
          listId: card.idList,
          boardId: boardId,
          url: card.url || ''
        }));
      
      setBoardCards(prev => ({
        ...prev,
        [boardId]: filteredCards
      }));
      
      return filteredCards;
    } catch (err) {
      console.error('Error fetching board cards:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch cards');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [token, clientId]);

  const createCard = useCallback(async (listId: string, name: string): Promise<TrelloCard | null> => {
    if (!token || !clientId) return null;

    setIsCreating(true);

    try {
      const response = await fetch(
        `https://api.trello.com/1/cards`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name,
            idList: listId,
            key: clientId,
            token: token
          })
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to create card: ${response.statusText}`);
      }

      const apiCard = await response.json();
      const newCard: TrelloCard = {
        id: apiCard.id,
        name: apiCard.name,
        desc: apiCard.desc || '',
        closed: apiCard.closed,
        pos: apiCard.pos,
        listId: apiCard.idList,
        boardId: apiCard.idBoard,
        url: apiCard.url || ''
      };
      
      setBoardCards(prev => {
        const boardId = newCard.boardId;
        return {
          ...prev,
          [boardId]: [...(prev[boardId] || []), newCard]
        };
      });
      
      return newCard;
    } catch (err) {
      console.error('Error creating card:', err);
      setError(err instanceof Error ? err.message : 'Failed to create card');
      return null;
    } finally {
      setIsCreating(false);
    }
  }, [token, clientId]);

  const moveCard = useCallback((boardId: string, cardId: string, sourceListId: string, destinationListId: string, destinationIndex: number) => {
    setBoardCards(prev => {
      const cards = [...(prev[boardId] || [])];
      const cardIndex = cards.findIndex(card => card.id === cardId);
      
      if (cardIndex === -1) return prev;
      
      const card = { ...cards[cardIndex], listId: destinationListId };
      cards.splice(cardIndex, 1);
      
      // Find the position to insert the card in the destination list
      const destinationCards = cards.filter(c => c.listId === destinationListId);
      const insertIndex = Math.min(destinationIndex, destinationCards.length);
      
      // Find the actual index in the full cards array
      let actualInsertIndex = 0;
      let destinationCount = 0;
      
      for (let i = 0; i < cards.length; i++) {
        if (cards[i].listId === destinationListId) {
          if (destinationCount === insertIndex) {
            actualInsertIndex = i;
            break;
          }
          destinationCount++;
        }
        if (i === cards.length - 1) {
          actualInsertIndex = cards.length;
        }
      }
      
      cards.splice(actualInsertIndex, 0, card);
      
      return {
        ...prev,
        [boardId]: cards
      };
    });
  }, []);

  const reorderCardsInList = useCallback((boardId: string, listId: string, sourceIndex: number, destinationIndex: number) => {
    setBoardCards(prev => {
      const allCards = [...(prev[boardId] || [])];
      const listCards = allCards.filter(card => card.listId === listId);
      const otherCards = allCards.filter(card => card.listId !== listId);
      
      const [removed] = listCards.splice(sourceIndex, 1);
      listCards.splice(destinationIndex, 0, removed);
      
      return {
        ...prev,
        [boardId]: [...otherCards, ...listCards].sort((a, b) => {
          if (a.listId !== b.listId) {
            return a.listId.localeCompare(b.listId);
          }
          return a.pos - b.pos;
        })
      };
    });
  }, []);

  const renameCard = useCallback(
    async (boardId: string, cardId: string, newName: string): Promise<TrelloCard | null> => {
      if (!token || !clientId) return null;
  
      try {
        const response = await fetch(
          `https://api.trello.com/1/cards/${cardId}?key=${clientId}&token=${token}&name=${encodeURIComponent(newName)}`,
          { method: 'PUT' }
        );
  
        if (!response.ok) {
          throw new Error(`Failed to rename card: ${response.statusText}`);
        }
  
        const updatedCard = await response.json();
  
        setBoardCards(prev => {
          const updatedCards = (prev[boardId] || []).map(card =>
            card.id === cardId ? { ...card, name: updatedCard.name } : card
          );
          return { ...prev, [boardId]: updatedCards };
        });
  
        return {
          id: updatedCard.id,
          name: updatedCard.name,
          desc: updatedCard.desc || '',
          closed: updatedCard.closed,
          pos: updatedCard.pos,
          listId: updatedCard.idList,
          boardId: updatedCard.idBoard,
          url: updatedCard.url || ''
        };
      } catch (err) {
        console.error('Error renaming card:', err);
        setError(err instanceof Error ? err.message : 'Failed to rename card');
        return null;
      }
    },
    [token, clientId]
  );
  

  const value: CardContextType = {
    boardCards,
    isLoading,
    error,
    isCreating,
    fetchBoardCards,
    createCard,
    moveCard,
    reorderCardsInList,
    renameCard,
  };

  return <CardContext.Provider value={value}>{children}</CardContext.Provider>;
};

export const useCards = (): CardContextType => {
  const context = useContext(CardContext);
  if (context === undefined) {
    throw new Error('useCards must be used within a CardProvider');
  }
  return context;
};
