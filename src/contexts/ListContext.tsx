import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { useAuth, useLogoutListener } from './AuthContext';
import { TrelloList } from '../types';

interface ListContextType {
  boardLists: { [boardId: string]: TrelloList[] };
  isLoading: boolean;
  error: string | null;
  isCreating: boolean;
  fetchBoardLists: (boardId: string) => Promise<TrelloList[]>;
  createList: (boardId: string, name: string) => Promise<TrelloList | null>;
  updateList: (listId: string, name: string) => Promise<boolean>;
  reorderLists: (boardId: string, sourceIndex: number, destinationIndex: number) => void;
}

const ListContext = createContext<ListContextType | undefined>(undefined);

interface ListProviderProps {
  children: ReactNode;
}

export const ListProvider: React.FC<ListProviderProps> = ({ children }) => {
  const { token, clientId } = useAuth();
  const [boardLists, setBoardLists] = useState<{ [boardId: string]: TrelloList[] }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Reset data on logout
  const resetData = useCallback(() => {
    setBoardLists({});
    setIsLoading(false);
    setError(null);
    setIsCreating(false);
  }, []);

  useLogoutListener(resetData);

  const fetchBoardLists = useCallback(async (boardId: string): Promise<TrelloList[]> => {
    if (!token || !clientId) return [];

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `https://api.trello.com/1/boards/${boardId}/lists?key=${clientId}&token=${token}`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch lists: ${response.statusText}`);
      }

      const apiLists = await response.json();
      const filteredLists: TrelloList[] = apiLists
        .filter((list: any) => !list.closed)
        .map((list: any) => ({
          id: list.id,
          name: list.name,
          closed: list.closed,
          pos: list.pos,
          boardId: boardId
        }));
      
      setBoardLists(prev => ({
        ...prev,
        [boardId]: filteredLists
      }));
      
      return filteredLists;
    } catch (err) {
      console.error('Error fetching board lists:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch lists');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [token, clientId]);

  const createList = useCallback(async (boardId: string, name: string): Promise<TrelloList | null> => {
    if (!token || !clientId) return null;

    setIsCreating(true);

    try {
      const response = await fetch(
        `https://api.trello.com/1/boards/${boardId}/lists`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name,
            key: clientId,
            token: token
          })
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to create list: ${response.statusText}`);
      }

      const apiList = await response.json();
      const newList: TrelloList = {
        id: apiList.id,
        name: apiList.name,
        closed: apiList.closed,
        pos: apiList.pos,
        boardId: boardId
      };
      
      setBoardLists(prev => ({
        ...prev,
        [boardId]: [...(prev[boardId] || []), newList]
      }));
      
      return newList;
    } catch (err) {
      console.error('Error creating list:', err);
      setError(err instanceof Error ? err.message : 'Failed to create list');
      return null;
    } finally {
      setIsCreating(false);
    }
  }, [token, clientId]);

  const reorderLists = useCallback((boardId: string, sourceIndex: number, destinationIndex: number) => {
    setBoardLists(prev => {
      const lists = [...(prev[boardId] || [])];
      const [removed] = lists.splice(sourceIndex, 1);
      lists.splice(destinationIndex, 0, removed);
      
      return {
        ...prev,
        [boardId]: lists
      };
    });
  }, []);

  const updateList = useCallback(async (listId: string, name: string): Promise<boolean> => {
    if (!token || !clientId) return false;

    try {
      const response = await fetch(
        `https://api.trello.com/1/lists/${listId}?key=${clientId}&token=${token}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name
          })
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to update list: ${response.statusText}`);
      }

      // Update local state
      setBoardLists(prev => {
        const updatedBoardLists = { ...prev };
        
        // Find and update the list in the appropriate board
        Object.keys(updatedBoardLists).forEach(boardId => {
          const listIndex = updatedBoardLists[boardId].findIndex(list => list.id === listId);
          if (listIndex !== -1) {
            updatedBoardLists[boardId] = [
              ...updatedBoardLists[boardId].slice(0, listIndex),
              { ...updatedBoardLists[boardId][listIndex], name },
              ...updatedBoardLists[boardId].slice(listIndex + 1)
            ];
          }
        });
        
        return updatedBoardLists;
      });
      
      return true;
    } catch (err) {
      console.error('Error updating list:', err);
      setError(err instanceof Error ? err.message : 'Failed to update list');
      return false;
    }
  }, [token, clientId]);

  const value: ListContextType = {
    boardLists,
    isLoading,
    error,
    isCreating,
    fetchBoardLists,
    createList,
    updateList,
    reorderLists,
  };

  return <ListContext.Provider value={value}>{children}</ListContext.Provider>;
};

export const useLists = (): ListContextType => {
  const context = useContext(ListContext);
  if (context === undefined) {
    throw new Error('useLists must be used within a ListProvider');
  }
  return context;
};
