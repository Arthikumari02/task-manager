import React, { useState, useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { useParams } from 'react-router-dom';
import Header from '../Header/Header';
import Loading from '../Loading';
import { ListProvider, CardProvider, useBoardsStore, useListsStore, useCardsStore } from '../../contexts';
import BoardHeader from './BoardHeader';
import BoardContent from './BoardContent';
import { useUpdateBoardName } from '../../hooks/APIs/UpdateBoardName'
import { useFetchLists } from '../../hooks/APIs/FetchLists'
import { useFetchCards } from '../../hooks/APIs/FetchCards';

const BoardViewContent: React.FC<{ boardId: string }> = observer(({ boardId }) => {
  const { getBoardById } = useBoardsStore();
  const listStore = useListsStore();
  const cardStore = useCardsStore();

  const [isLoading, setIsLoading] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [showNewListInput, setShowNewListInput] = useState(false);
  const [boardName, setBoardName] = useState('');

  // Initialize hooks at the component level
  const { fetchLists } = useFetchLists();
  const { fetchCards } = useFetchCards();
  const { updateBoardName } = useUpdateBoardName();

  // Load board data
  useEffect(() => {
    if (!boardId) return;

    const loadData = async () => {
      setIsLoading(true);

      // Get board data
      const boardModel = getBoardById(boardId);
      if (boardModel) {
        setBoardName(boardModel.name);
      }

      // Load lists and cards
      await fetchLists(boardId, {
        onSuccess: async () => {
          // Get all lists for the board
          const lists = listStore.getListsForBoard(boardId);

          // Fetch cards for each list
          for (const list of lists) {
            await fetchCards(list.id, boardId, {
              onSuccess: () => {}
            });
          }
          
          setIsLoading(false);
        },
        onError: () => setIsLoading(false)
      });
    };

    loadData();
  }, [boardId, getBoardById, listStore, fetchLists, fetchCards]);

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

  const handleTaskAdded = async () => {
    if (!boardId) return;

    // Force a quick UI refresh
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 100);
  };

  const handleBoardNameChange = async (newName: string) => {
    if (boardId) {
      await updateBoardName(boardId, newName, {
        onSuccess: () => {
          // Update local state
          setBoardName(newName);
          // Refresh the board data
          handleTaskAdded();
        },
        onError: (error: string) => {
          console.error('Error updating board name:', error);
        }
      });
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
