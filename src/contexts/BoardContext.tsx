import { observer } from 'mobx-react-lite';
import React, { createContext, useContext, useRef } from 'react';
import BoardStore from '../stores/board/BoardStore';

const BoardContext = createContext<BoardStore | undefined>(undefined);

export const BoardsStoreProvider: React.FC<{ children: React.ReactNode }> = observer(({ children }) => {
  const getAuthData = () => {
    const token = localStorage.getItem('trello_token');
    const clientId = localStorage.getItem('trello_clientId');
    return { token, clientId };
  };


  const boardStoreRef = useRef<BoardStore>(new BoardStore(getAuthData));

  return (
    <BoardContext.Provider value={boardStoreRef.current}>
      {children}
    </BoardContext.Provider>
  );
});

export const useBoardsStore = (): BoardStore => {
  const context = useContext(BoardContext);
  if (context === undefined) {
    throw new Error('useBoardsStore must be used within a BoardProvider');
  }
  return context;
};


