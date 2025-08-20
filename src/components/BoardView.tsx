import React, { useState, useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { useParams } from 'react-router-dom';
import Header from './Header';
import Loading from './Loading';
import { authStore } from '../stores/AuthStore';

interface TrelloList {
  id: string;
  name: string;
  closed: boolean;
  pos: number;
  idBoard: string;
}

interface TrelloCard {
  id: string;
  name: string;
  desc: string;
  closed: boolean;
  pos: number;
  idList: string;
  idBoard: string;
}

const BoardView: React.FC = observer(() => {
  const { boardId } = useParams<{ boardId: string }>();
  const [boardName, setBoardName] = useState<string>('');
  const [lists, setLists] = useState<TrelloList[]>([]);

  const [cards, setCards] = useState<TrelloCard[]>([]);
  const [newTaskInputs, setNewTaskInputs] = useState<{ [key: string]: string }>({});
  const [showNewTaskInputs, setShowNewTaskInputs] = useState<{ [key: string]: boolean }>({});
  const [newListTitle, setNewListTitle] = useState('');
  const [showNewListInput, setShowNewListInput] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!boardId) return;

    // Find the board name from the store using boardId
    const board = authStore.boards.find(b => b.id === boardId);
    if (board) {
      setBoardName(board.name);
    } else {
      setBoardName('Board');
    }

    // Fetch lists and cards for this board
    const fetchBoardData = async () => {
      setIsLoading(true);
      try {
        const [fetchedLists, fetchedCards] = await Promise.all([
          authStore.fetchBoardLists(boardId),
          authStore.fetchBoardCards(boardId)
        ]);
        
        setLists(fetchedLists);
        setCards(fetchedCards);
      } catch (error) {
        console.error('Error fetching board data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBoardData();
  }, [boardId]);

  const addTask = async (listId: string) => {
    const taskTitle = newTaskInputs[listId]?.trim();
    if (!taskTitle || !boardId) return;

    const newCard = await authStore.createCard(listId, taskTitle);
    if (newCard) {
      // Update local state from AuthStore (no need to fetch again)
      setCards(authStore.boardCards[boardId] || []);
      setNewTaskInputs({});
      setShowNewTaskInputs({});
    }
  };

  const addList = async () => {
    const title = newListTitle.trim();
    if (!title || !boardId) return;

    const newList = await authStore.createList(boardId, title);
    if (newList) {
      // Don't add to local state - AuthStore already handles this
      // The lists will be updated via the MobX observable
      setNewListTitle('');
      setShowNewListInput(false);
    }
  };

  const handleTaskInputChange = (listId: string, value: string) => {
    setNewTaskInputs(prev => ({ ...prev, [listId]: value }));
  };

  const showTaskInput = (listId: string) => {
    // Close all other task inputs and only show the selected one
    setShowNewTaskInputs({ [listId]: true });
    // Clear any existing input values for other lists
    setNewTaskInputs(prev => ({ [listId]: prev[listId] || '' }));
  };

  const hideTaskInput = (listId: string) => {
    setShowNewTaskInputs({});
    setNewTaskInputs({});
  };

  return (
    <div className="min-h-screen bg-[#0079BF]">
      <Header 
        title="Task Manager"
        currentPage="boards"
        showSearch={true}
        showNavigation={true}
      />

      <main className="px-2 sm:px-4 py-4 sm:py-6">
        {/* Board Title */}
        <div className="mb-4 sm:mb-6">
          <h1 className="text-white text-lg sm:text-xl font-semibold">{boardName}</h1>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <Loading message="Loading" size="large" className="text-white" />
        ) : (
          /* Board Lists */
          <div className="flex space-x-2 sm:space-x-4 overflow-x-auto pb-4">
            {/* Show Add List button if no lists exist */}
            {lists.length === 0 && !showNewListInput && (
            <div className="text-center py-12 w-full">
              <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <h3 className="text-white text-lg font-semibold mb-2">This board is empty</h3>
              <p className="text-white text-opacity-80 mb-4">Add a list to get started organizing your tasks</p>
              <button
                onClick={() => setShowNewListInput(true)}
                className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 mx-auto"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>Add a list</span>
              </button>
            </div>
          )}

          {/* Show Add List input if no lists exist and input is active */}
          {lists.length === 0 && showNewListInput && (
            <div className="bg-gray-100 rounded-lg p-3 max-w-[252px] flex-shrink-0 mx-auto">
              <h3 className="font-semibold text-gray-800 mb-2">Create Your First List</h3>
              <input
                type="text"
                value={newListTitle}
                onChange={(e) => setNewListTitle(e.target.value)}
                placeholder="Enter list title..."
                className="w-full p-2 border rounded mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    addList();
                  }
                }}
              />
              <div className="flex space-x-2">
                <button
                  onClick={addList}
                  className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition-colors text-sm"
                >
                  Create List
                </button>
                <button
                  onClick={() => {
                    setShowNewListInput(false);
                    setNewListTitle('');
                  }}
                  className="text-gray-600 hover:text-gray-800 px-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {lists.map((list) => {
              const listCards = cards.filter((card) => card.idList === list.id);

              return (
                <div
                  key={list.id}
                  className="bg-[#F4F5F7] rounded-md px-3 py-2 w-64 flex-shrink-0 min-h-[80px] h-fit"
                >
                  {/* List Title */}
                  <h3 className="font-semibold text-gray-800 text-sm mb-2">
                    {list.name}
                  </h3>
          
                  {/* Tasks */}
                  <div className="space-y-2 mb-2">
                    {listCards.map((card) => (
                      <div
                        key={card.id}
                        className="bg-white rounded-sm px-2 py-2 shadow-sm text-sm cursor-pointer hover:bg-gray-50 break-words"
                      >
                        {card.name}
                      </div>
                    ))}
                  </div>  
          
                  {/* Add Task */}
                  {showNewTaskInputs[list.id] ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={newTaskInputs[list.id] || ''}
                        onChange={(e) => handleTaskInputChange(list.id, e.target.value)}
                        placeholder="Enter task name..."
                        className="w-full p-1.5 border rounded text-sm"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            addTask(list.id);
                          }
                        }}
                      />
                      <div className="flex space-x-2">
                        <button
                          onClick={() => addTask(list.id)}
                          disabled={authStore.isCreatingCard}
                          className="bg-blue-600 text-white px-3 py-1 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
                        >
                          {authStore.isCreatingCard ? (
                            <>
                              <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
                              <span>Adding...</span>
                            </>
                          ) : (
                            <span>Add Task</span>
                          )}
                        </button>
                        <button
                          onClick={() => hideTaskInput(list.id)}
                          className="text-gray-600 text-sm"
                        >
                          x
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => showTaskInput(list.id)}
                      className="text-gray-600 text-sm mt-1 hover:underline"
                    >
                      + Add a task
                    </button>
                  )}
                </div>
              );
            })}

          {/* Add Another List - Only show if there are existing lists or if input is active */}
          {(lists.length > 0 || showNewListInput) && (
            showNewListInput ? (
              <div className="bg-[#F4F5F7] rounded-md px-3 py-2 w-64 flex-shrink-0 min-h-[80px] h-fit">
                <input
                  type="text"
                  value={newListTitle}
                  onChange={(e) => setNewListTitle(e.target.value)}
                  placeholder="Enter list title..."
                  className="w-full p-1.5 border rounded text-sm mb-2"
                  autoFocus
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      addList();
                    }
                  }}
                />
                <div className="flex space-x-2">
                  <button
                    onClick={addList}
                    disabled={authStore.isCreatingList}
                    className="bg-blue-600 text-white px-3 py-1 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
                  >
                    {authStore.isCreatingList ? (
                      <>
                        <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Adding...</span>
                      </>
                    ) : (
                      <span>Add List</span>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setShowNewListInput(false);
                      setNewListTitle('');
                    }}
                    className="text-gray-600 text-sm"
                  >
                    x
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowNewListInput(true)}
                className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white rounded-md px-3 py-2 w-64 flex-shrink-0 min-h-[80px] h-fit transition-colors flex items-center justify-center"
              >
                <span className="text-sm">+ Add another list</span>
              </button>
            )
          )}
          </div>
        )}
      </main>
    </div>
  );
});

export default BoardView;