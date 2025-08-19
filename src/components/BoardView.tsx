import React, { useState, useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { useParams } from 'react-router-dom';
import Header from './Header';
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
      const [fetchedLists, fetchedCards] = await Promise.all([
        authStore.fetchBoardLists(boardId),
        authStore.fetchBoardCards(boardId)
      ]);
      
      setLists(fetchedLists);
      setCards(fetchedCards);
    };

    fetchBoardData();
  }, [boardId]);

  const addTask = async (listId: string) => {
    const taskTitle = newTaskInputs[listId]?.trim();
    if (!taskTitle || !boardId) return;

    const newCard = await authStore.createCard(listId, taskTitle);
    if (newCard) {
      setCards(prev => [...prev, newCard]);
      setNewTaskInputs(prev => ({ ...prev, [listId]: '' }));
      setShowNewTaskInputs(prev => ({ ...prev, [listId]: false }));
    }
  };

  const addList = async () => {
    const title = newListTitle.trim();
    if (!title || !boardId) return;

    const newList = await authStore.createList(boardId, title);
    if (newList) {
      setLists(prev => [...prev, newList]);
      setNewListTitle('');
      setShowNewListInput(false);
    }
  };

  const handleTaskInputChange = (listId: string, value: string) => {
    setNewTaskInputs(prev => ({ ...prev, [listId]: value }));
  };

  const showTaskInput = (listId: string) => {
    setShowNewTaskInputs(prev => ({ ...prev, [listId]: true }));
  };

  const hideTaskInput = (listId: string) => {
    setShowNewTaskInputs(prev => ({ ...prev, [listId]: false }));
    setNewTaskInputs(prev => ({ ...prev, [listId]: '' }));
  };

  return (
    <div className="min-h-screen bg-[#0067A3]">
      <Header 
        title="Task Manager"
        currentPage="boards"
        showSearch={true}
        showNavigation={true}
      />

      <main className="px-4 py-6">
        {/* Board Title */}
        <div className="mb-6">
          <h1 className="text-white text-xl font-semibold">{boardName}</h1>
        </div>

        {/* Board Lists */}
        <div className="flex space-x-4 overflow-x-auto pb-4">
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
            <div className="bg-gray-100 rounded-lg p-3 min-w-[272px] flex-shrink-0 mx-auto">
              <h3 className="font-semibold text-gray-800 mb-2">Create Your First List</h3>
              <input
                type="text"
                value={newListTitle}
                onChange={(e) => setNewListTitle(e.target.value)}
                placeholder="Enter list title..."
                className="w-full p-2 border rounded mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            const listCards = cards.filter(card => card.idList === list.id);
            
            return (
              <div key={list.id} className="bg-gray-100 rounded-lg p-3 min-w-[272px] flex-shrink-0">
                {/* List Header */}
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-800">{list.name}</h3>
                  <button className="text-gray-500 hover:text-gray-700">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
                    </svg>
                  </button>
                </div>

                {/* Tasks */}
                <div className="space-y-2 mb-3">
                  {listCards.map((card: TrelloCard) => (
                    <div key={card.id} className="bg-white rounded p-2 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                      <span className="text-gray-800">{card.name}</span>
                    </div>
                  ))}
                </div>

                {/* Add Task Input */}
                {showNewTaskInputs[list.id] ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={newTaskInputs[list.id] || ''}
                    onChange={(e) => handleTaskInputChange(list.id, e.target.value)}
                    placeholder="Enter task name..."
                    className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoFocus
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        addTask(list.id);
                      }
                    }}
                  />
                  <div className="flex space-x-2">
                    <button
                      onClick={() => addTask(list.id)}
                      className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition-colors text-sm"
                    >
                      Create Task
                    </button>
                    <button
                      onClick={() => hideTaskInput(list.id)}
                      className="text-gray-600 hover:text-gray-800 px-2"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => showTaskInput(list.id)}
                  className="w-full text-left text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded p-2 transition-colors flex items-center space-x-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>Add a task</span>
                </button>
              )}
            </div>
            
          );
        })}

          {/* Add Another List - Only show if there are existing lists or if input is active */}
          {(lists.length > 0 || showNewListInput) && (
            showNewListInput ? (
              <div className="bg-gray-100 rounded-lg p-3 min-w-[272px] flex-shrink-0">
                <h3 className="font-semibold text-gray-800 mb-2">Create List</h3>
                <input
                  type="text"
                  value={newListTitle}
                  onChange={(e) => setNewListTitle(e.target.value)}
                  placeholder="Enter list title..."
                  className="w-full p-2 border rounded mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            ) : (
              <button
                onClick={() => setShowNewListInput(true)}
                className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white rounded-lg p-3 min-w-[272px] flex-shrink-0 transition-colors flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>Add another list</span>
              </button>
            )
          )}
        </div>
      </main>
    </div>
  );
});

export default BoardView;