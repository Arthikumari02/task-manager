import React, { useState, useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { useParams } from 'react-router-dom';
import Header from '../../../components/Header';
import Loading from '../../../components/Loading';
import { useBoardData } from '../../../hooks';
import { ListProvider, CardProvider } from '../../../contexts';
import { useBoards } from '../../../contexts';
import BoardHeader from './BoardHeader';
import BoardContent from './BoardContent';

const BoardViewContent: React.FC<{ boardId: string }> = observer(({ boardId }) => {
  const { boardName, isLoading, handleTaskAdded } = useBoardData(boardId);
  const { updateBoardName } = useBoards();
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [showNewListInput, setShowNewListInput] = useState(false);

  // Track initial load completion
  useEffect(() => {
    if (!isLoading && isInitialLoad) {
      setIsInitialLoad(false);
    }
  }, [isLoading, isInitialLoad]);

  const handleListAdded = () => {
    setShowNewListInput(false);
  };

  const handleCancelAddList = () => {
    setShowNewListInput(false);
  };

  const handleBoardNameChange = async (newName: string) => {
    if (boardId) {
      const success = await updateBoardName(boardId, newName);
      if (success) {
        // Refresh the board data to reflect the name change
        handleTaskAdded();
      }
    }
  };

  return (
    <main className="w-full overflow-x-auto px-2 sm:px-4 py-4 sm:py-6">
      <BoardHeader
        boardName={boardName}
        boardId={boardId}
        onBoardNameChange={handleBoardNameChange}
      />

      {isInitialLoad ? (
        <div className="flex items-center justify-center h-64">
          <Loading message="Loading" size="large" className="text-white" />
        </div>
      ) : (
        <BoardContent
          boardId={boardId}
          showNewListInput={showNewListInput}
          onListAdded={handleListAdded}
          onCancelAddList={handleCancelAddList}
          onShowAddListForm={() => setShowNewListInput(true)}
        />
      )}
    </main>
  );
});

const BoardView: React.FC = observer(() => {
  // Ensure boardId is always a string
  const { boardId = '' } = useParams<{ boardId: string }>();

  return (
    <div className="min-h-screen bg-[#0079BF]">
      <Header
        title="Task Manager"
        currentPage="boards"
        showSearch={true}
        showNavigation={true}
      />

      <ListProvider>
        <CardProvider>
          <BoardViewContent boardId={boardId} />
        </CardProvider>
      </ListProvider>
    </div>
  );
});

export default BoardView;
