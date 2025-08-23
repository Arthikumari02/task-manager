import React, { createContext, useContext, useRef, useEffect, useMemo, useState } from 'react';
import { observer } from 'mobx-react-lite';
import BoardStore from '../stores/board/BoardStore';
import { useOrganizations } from './OrganizationContext';
import { TrelloBoard } from '../types';

interface BoardContextType {
  // Board store instance
  boardStore: BoardStore;
  
  // Board data
  boards: TrelloBoard[];
  currentOrganizationBoards: TrelloBoard[];
  isLoading: boolean;
  isCreating: boolean;
  error: string | null;
  
  // Board methods
  fetchBoardsForOrganization: (organizationId: string) => Promise<void>;
  createBoard: (name: string, organizationId?: string) => Promise<TrelloBoard | null>;
  updateBoardName: (boardId: string, newName: string) => Promise<boolean>;
  
  // Other utilities
  getBoardById: (boardId: string) => TrelloBoard | undefined;
}

const BoardContext = createContext<BoardContextType | undefined>(undefined);

export const BoardProvider: React.FC<{ children: React.ReactNode }> = observer(({ children }) => {
  const { currentOrganization } = useOrganizations();
  const boardStoreRef = useRef<BoardStore | null>(null);
  const [currentOrganizationBoards, setCurrentOrganizationBoards] = useState<TrelloBoard[]>([]);

  const getAuthData = () => {
    const token = localStorage.getItem('trello_token');
    const clientId = localStorage.getItem('trello_clientId');
    return { token, clientId };
  };

  // Initialize board store only once
  if (!boardStoreRef.current) {
    boardStoreRef.current = new BoardStore(getAuthData);
  }

  // Fetch boards when organization changes
  useEffect(() => {
    const fetchBoards = async () => {
      if (currentOrganization?.id && boardStoreRef.current) {
        await boardStoreRef.current.fetchBoards(currentOrganization.id);
        // Update the current organization boards after fetching
        const boards = boardStoreRef.current.boards;
        setCurrentOrganizationBoards(boards);
      } else {
        setCurrentOrganizationBoards([]);
      }
    };

    fetchBoards();
  }, [currentOrganization?.id]);

  const contextValue = useMemo(() => ({
    // Board store instance
    boardStore: boardStoreRef.current!,
    
    // Board data
    boards: (boardStoreRef.current?.boards || []).map(board => ({
      id: board.id,
      name: board.name,
      desc: board.desc,
      closed: board.closed,
      url: board.url,
      organizationId: board.organizationId,
      prefs: {} // Add empty prefs to match TrelloBoard type
    })),
    currentOrganizationBoards: currentOrganizationBoards.map(board => ({
      ...board,
      prefs: board.prefs || {} // Ensure prefs exists
    })),
    isLoading: boardStoreRef.current?.isLoading || false,
    isCreating: boardStoreRef.current?.isCreating || false,
    error: boardStoreRef.current?.error || null,
    
    // Board methods
    fetchBoardsForOrganization: async (organizationId: string) => {
      if (boardStoreRef.current) {
        await boardStoreRef.current.fetchBoards(organizationId);
        const boards = boardStoreRef.current.boards;
        setCurrentOrganizationBoards(boards);
      }
    },
    createBoard: async (name: string, organizationId?: string) => {
      if (boardStoreRef.current) {
        const orgId = organizationId || currentOrganization?.id;
        if (!orgId) return null;
        return boardStoreRef.current.createBoard(name, orgId);
      }
      return null;
    },
    updateBoardName: async (boardId: string, newName: string) => {
      if (boardStoreRef.current) {
        return boardStoreRef.current.updateBoardName(boardId, newName);
      }
      return false;
    },
    
    // Other utilities
    getBoardById: (boardId: string) => {
      const boardModel = boardStoreRef.current?.getBoardById(boardId);
      if (!boardModel) return undefined;
      
      return {
        id: boardModel.id,
        name: boardModel.name,
        desc: boardModel.desc,
        closed: boardModel.closed,
        url: boardModel.url,
        organizationId: boardModel.organizationId,
        prefs: {} // Add empty prefs to match TrelloBoard type
      };
    },
  }), [currentOrganization?.id, currentOrganizationBoards]);

  return (
    <BoardContext.Provider value={contextValue}>
      {children}
    </BoardContext.Provider>
  );
});

export const useBoards = (): BoardContextType => {
  const context = useContext(BoardContext);
  if (context === undefined) {
    throw new Error('useBoards must be used within a BoardProvider');
  }
  return context;
};


