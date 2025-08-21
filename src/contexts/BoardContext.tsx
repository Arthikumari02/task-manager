import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { useAuth, useLogoutListener } from './AuthContext';
import { useOrganizations } from './OrganizationContext';
import { TrelloBoard } from '../types';

interface BoardContextType {
  boards: TrelloBoard[];
  isLoading: boolean;
  error: string | null;
  isCreating: boolean;
  currentOrganizationBoards: TrelloBoard[];
  fetchBoardsForOrganization: (organizationId: string) => Promise<void>;
  createBoard: (name: string, description?: string) => Promise<TrelloBoard | null>;
}

const BoardContext = createContext<BoardContextType | undefined>(undefined);

interface BoardProviderProps {
  children: ReactNode;
}

export const BoardProvider: React.FC<BoardProviderProps> = ({ children }) => {
  const { token, clientId } = useAuth();
  const { currentOrganization } = useOrganizations();
  const [boards, setBoards] = useState<TrelloBoard[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Reset data on logout
  const resetData = useCallback(() => {
    setBoards([]);
    setIsLoading(false);
    setError(null);
    setIsCreating(false);
  }, []);

  useLogoutListener(resetData);

  const currentOrganizationBoards = boards.filter(board => 
    currentOrganization && board.organizationId === currentOrganization.id && !board.closed
  );

  const fetchBoardsForOrganization = useCallback(async (organizationId: string) => {
    if (!token || !clientId) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `https://api.trello.com/1/organizations/${organizationId}/boards?key=${clientId}&token=${token}&filter=open`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch boards: ${response.statusText}`);
      }

      const trelloBoards = await response.json();
      
      const fetchedBoards = trelloBoards.map((board: any) => ({
        id: board.id,
        name: board.name,
        desc: board.desc || '',
        organizationId: organizationId,
        closed: board.closed,
        url: board.url,
        shortUrl: board.shortUrl,
        prefs: {
          backgroundColor: board.prefs?.backgroundColor || '',
          backgroundImage: board.prefs?.backgroundImage
        }
      }));

      setBoards(prevBoards => [
        ...prevBoards.filter(b => b.organizationId !== organizationId),
        ...fetchedBoards
      ]);

    } catch (err) {
      console.error('Error fetching boards:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch boards');
      setBoards([]);
    } finally {
      setIsLoading(false);
    }
  }, [token, clientId]);

  const createBoard = useCallback(async (name: string, description: string = ''): Promise<TrelloBoard | null> => {
    if (!currentOrganization || !token || !clientId) return null;

    setIsCreating(true);

    try {
      const response = await fetch(
        `https://api.trello.com/1/boards/?key=${clientId}&token=${token}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name,
            desc: description,
            idOrganization: currentOrganization.id,
            prefs_permissionLevel: 'org'
          })
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to create board: ${response.statusText}`);
      }

      const newBoard = await response.json();
      
      const boardToAdd: TrelloBoard = {
        id: newBoard.id,
        name: newBoard.name,
        desc: newBoard.desc || '',
        organizationId: currentOrganization.id,
        closed: false,
        url: newBoard.url,
        shortUrl: newBoard.shortUrl,
        prefs: {
          backgroundColor: newBoard.prefs?.backgroundColor || '',
          backgroundImage: newBoard.prefs?.backgroundImage
        }
      };

      setBoards(prevBoards => [...prevBoards, boardToAdd]);
      
      return boardToAdd;

    } catch (err) {
      console.error('Error creating board:', err);
      setError(err instanceof Error ? err.message : 'Failed to create board');
      return null;
    } finally {
      setIsCreating(false);
    }
  }, [currentOrganization, token, clientId]);

  const value: BoardContextType = {
    boards,
    isLoading,
    error,
    isCreating,
    currentOrganizationBoards,
    fetchBoardsForOrganization,
    createBoard,
  };

  return <BoardContext.Provider value={value}>{children}</BoardContext.Provider>;
};

export const useBoards = (): BoardContextType => {
  const context = useContext(BoardContext);
  if (context === undefined) {
    throw new Error('useBoards must be used within a BoardProvider');
  }
  return context;
};
