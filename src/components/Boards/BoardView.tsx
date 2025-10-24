import React, { useState, useEffect, useRef } from 'react';
import { observer } from 'mobx-react-lite';
import { useParams } from 'react-router-dom';
import Header from '../Header/Header';
import Loading from '../Loading';
import { ListsStoreProvider, CardsStoreProvider, SearchStoreProvider, useOrganizationsStore } from '../../contexts';
import BoardHeader from './BoardHeader';
import BoardContent from './BoardContent';
import { useUpdateBoardName } from '../../hooks/APIs/UpdateBoardName'
import { useFetchLists } from '../../hooks/APIs/FetchLists'
import { useFetchCards } from '../../hooks/APIs/FetchCards';
import { useFetchBoards } from '../../hooks/APIs/FetchBoards';
import { useBoardsStore } from "../../contexts";
import { runInAction } from 'mobx';


const BoardViewContent: React.FC<{ boardId: string }> = observer(({ boardId }) => {

  const organizationsStore = useOrganizationsStore();
  const { currentOrganization } = organizationsStore;
  const { getBoardById } = useBoardsStore();

  const [isLoading, setIsLoading] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [showNewListInput, setShowNewListInput] = useState(false);
  const [boardName, setBoardName] = useState('');
  

  // Initialize hooks at the component level
  const { fetchLists } = useFetchLists();
  const { fetchCards } = useFetchCards();
  const { fetchBoards } = useFetchBoards();
  const { updateBoardName } = useUpdateBoardName();

  const loadedBoardRef = useRef<string | null>(null);

  useEffect(() => {
    if (!boardId) return;
    const loadData = async () => {
      setIsLoading(true);

      try {
        await fetchBoards(currentOrganization?.id || '', {
          onSuccess: (boards) => {
            if (boards && boards.length > 0) {
              // Find the board that matches our boardId
              const currentBoard = boards.find(board => board.id === boardId);
              if (currentBoard) {
                setBoardName(currentBoard.name);
              } else {
                console.warn(`Board with ID ${boardId} not found in the response`);
              }
            } else {
              console.warn('No boards data returned');
            }
          },
          onError: (error) => {
            console.error(`Error loading board details: ${error}`);
          }
        }); 
        await fetchLists(boardId, {
          onSuccess: async (lists) => {
            const boardModel = getBoardById(boardId);
            if (boardModel) {
              runInAction(() => {
                boardModel.clearListIds();
                lists.forEach(list => boardModel.addListId(list.id)); 
              });
            }
            await fetchCards(boardId, {
              onSuccess: () => {
                loadedBoardRef.current = boardId;
                setIsLoading(false);
              },
              onError: (error: string) => {
                console.error('Error loading cards:', error);
                setIsLoading(false);
              }
            });
          },
          onError: (error: string) => {
            console.error('Error loading lists:', error);
            setIsLoading(false);
          }
        });
      } catch (error) {
        console.error('Unexpected error loading board data:', error);
        setIsLoading(false);
      }
    };
    loadData();
  }, [boardId, currentOrganization]);

  // Track initial load completion
  useEffect(() => {
    if (!isLoading && isInitialLoad) {
      setIsInitialLoad(false);
    }
  }, [isLoading, isInitialLoad]);

  // We don't need to load boards here anymore as GlobalBoardLoader handles it

  const handleListAdded = () => {
    setShowNewListInput(false);
  };

  const handleCancelAddList = () => {
    setShowNewListInput(false);
  };

  const handleBoardNameChange = async (newName: string) => {
    if (boardId) {
      await updateBoardName(boardId, newName, {
        onSuccess: () => {
          const boardModel = getBoardById(boardId);
          if (boardModel) {
            runInAction(() => {
              boardModel.name = newName; 
            });
          }
          setBoardName(newName);
        },
        onError: (error) => {
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
          onHideAddListForm={handleListAdded}
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
      <SearchStoreProvider>
        <ListsStoreProvider>
          <CardsStoreProvider>
            <BoardViewContent boardId={boardId} />
          </CardsStoreProvider>
        </ListsStoreProvider>
      </SearchStoreProvider>
    </div>
  );
});

export default BoardView;
