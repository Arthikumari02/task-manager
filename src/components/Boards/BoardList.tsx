import { Droppable } from '@hello-pangea/dnd';
import { observer } from 'mobx-react-lite';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Icon from '../../assets/icons';
import { useCardsStore, useListsStore } from '../../contexts';
import { useUpdateList } from '../../hooks/APIs/UpdateList';
import { useRenameCard } from '../../hooks/APIs/RenameCard';
import { useCloseList } from '../../hooks/APIs/CloseList';
import { CardModel } from '../../models';
import AddTaskForm from './AddTaskForm';
import ListContextMenu from './ListContextMenu';
import TaskCard from './TaskCard';
import { runInAction } from 'mobx';

interface BoardListProps {
  listId: string;
  onTaskAdded?: () => void;
  onTaskClick?: (cardId: string) => void;
}

const BoardList: React.FC<BoardListProps> = observer(({ listId, onTaskAdded, onTaskClick }) => {
  const { getListById } = useListsStore();
  const { updateList } = useUpdateList();
  const {closeList} = useCloseList();
  const {renameCard} = useRenameCard();
  const cardsStore = useCardsStore();
  const { getCardById, isCreatingInList, registerCardUpdateListener, unregisterCardUpdateListener } = useCardsStore();

  // State to force re-render when cards are updated
  const [cardUpdateCounter, setCardUpdateCounter] = useState(0);
  // Get models directly from stores
  const listModel = getListById(listId);

  const [showAddTaskForm, setShowAddTaskForm] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [title, setTitle] = useState(listModel?.name || 'Untitled');
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });

  const handleTaskAdded = useCallback(() => {
    setShowAddTaskForm(false);
    // Force a re-render by incrementing the counter
    setCardUpdateCounter(prev => prev + 1);
    // Call the parent's onTaskAdded to refresh the data if provided
    if (onTaskAdded) {
      onTaskAdded();
    }
  }, [onTaskAdded]);

  // Callback to increment the update counter when cards change
  const handleCardUpdate = useCallback(() => {
    // Force immediate re-render by updating the counter
    setCardUpdateCounter(prev => prev + 1);
  }, [listId]);

  // Register and unregister card update listeners
  useEffect(() => {
    if (listId) {
      registerCardUpdateListener(listId, handleCardUpdate);

      return () => {
        unregisterCardUpdateListener(listId, handleCardUpdate);
      };
    }
  }, [listId]);

  const handleCancelAddTask = useCallback(() => {
    setShowAddTaskForm(false);
  }, []);

  const handleTitleClick = useCallback(() => {
    setIsEditingTitle(true);
  }, []);

  const handleTitleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
  }, []);

  const handleTitleBlur = useCallback(() => {
    setIsEditingTitle(false);
    if (listModel && title.trim() && title !== listModel.name) {
      // Update list name through API hook
      updateList(listModel.id, title.trim(), {
        onSuccess: () => {
          if (onTaskAdded) {
            onTaskAdded();
          }
        },
        onError: (error) => {
          console.error("Failed to rename list:", error);
          setTitle(listModel.name);
        }
      });
    } else {
      setTitle(listModel?.name || 'Untitled');
    }
  }, [title, listModel, onTaskAdded, updateList]);

  const handleTitleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.currentTarget.blur();
    }
  }, []);

  const handleEllipsisClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setContextMenuPosition({
      x: rect.left,
      y: rect.bottom + 5
    });
    setShowContextMenu(true);
  }, []);

  const handleCloseContextMenu = useCallback(() => {
    setShowContextMenu(false);
  }, []);

  const handleCloseList = useCallback(() => {
    if (listModel) {
      closeList(listModel.id)
      .then(() => {
          if (onTaskAdded) { 
              onTaskAdded(); 
          }
      })
      .catch(error => {
          console.error("Failed to close list:", error);
          // Refresh on error to get the current state
          if (onTaskAdded) { 
              onTaskAdded(); 
          }
      });
    }
  }, [listModel, onTaskAdded, closeList]);

  const handleShowAddTaskForm = useCallback(() => {
    setShowAddTaskForm(true);
  }, []);

  // Define handlers outside the render loop
  const handleTaskRename = useCallback((cardId: string, newName: string) => {
    // Use renameCard API hook
    renameCard(cardId, newName, {
      onSuccess: () => {
        const card = getCardById(cardId);
        if (card) {
          runInAction(() => {
            card.name = newName; // <- MobX observable update
          });
        }
      },
      onError: (error) => console.error(error),
    });
  }, [renameCard]);

  const handleTaskClick = useCallback((cardId: string) => {
    // Pass the card click event up to the parent component
    if (onTaskClick) {
      onTaskClick(cardId);
    }
  }, [onTaskClick]);

  const listCards: CardModel[] = listModel?.cardIdsList
  .map(id => getCardById(id))
  .filter((c): c is CardModel => !!c)
  .sort((a, b) => (a.pos || 0) - (b.pos || 0)) || [];


  // const handleDeleteCard = (cardId: string) => {
  //   const card = cardsStore.getCardById(cardId);
  //   if (!card) return;
  
  //   const list = getListById(card.listId);
  //   if (list) {
  //     runInAction(() => {
  //       const index = list.cardIdsList.indexOf(cardId);
  //       if (index > -1) list.cardIdsList.splice(index, 1); // MobX observable update
  //     });
  //   }
  
  //   runInAction(() => {
  //     cardsStore.removeCard(cardId); // observable map/array
  //   });
  
  // };
  

  // If listModel is null, render a placeholder
  if (!listModel) {
    return <div className="bg-[#F4F5F7] rounded-sm px-3 py-2 w-64 flex-shrink-0 min-h-[80px] h-fit">List not found</div>;
  }

  return (
    <div className="bg-[#F4F5F7] rounded-sm px-3 py-2 w-64 flex-shrink-0 min-h-[80px] h-fit" style={{ overflow: 'visible' }}>
      {/* List Title */}
      <div className="flex items-center justify-between mb-2">
        {isEditingTitle ? (
          <input
            type="text"
            value={title}
            onChange={handleTitleChange}
            onBlur={handleTitleBlur}
            onKeyDown={handleTitleKeyDown}
            autoFocus
            className="font-semibold text-gray-800 text-sm px-1 py-0.5 rounded border border-gray-300 flex-1 mr-2"
          />
        ) : (
          <h3
            className="font-semibold text-gray-800 text-sm cursor-pointer flex-1"
            onClick={handleTitleClick}
          >
            {listModel.name}
          </h3>
        )}

        {/* Ellipsis button */}
        <button
          onClick={handleEllipsisClick}
          className="text-gray-500 hover:text-gray-700 p-1 rounded hover:bg-gray-200 transition-colors"
          title="List options"
        >
          <Icon type="menu" className="w-4 h-4" />
        </button>
      </div>

      {/* Tasks */}
      <Droppable droppableId={listModel.id} type="card" ignoreContainerClipping={true}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`min-h-[2px] ${snapshot.isDraggingOver ? 'bg-blue-100' : ''
              }`}
          >
            {listCards.map((card, index) => (
              <TaskCard
                key={card.id}
                id={card.id}
                name={card.name}
                desc={card.desc}
                index={index}
                onTaskRename={handleTaskRename}
                onTaskClick={handleTaskClick}
              />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>

      {/* Add Task */}
      {showAddTaskForm ? (
        <AddTaskForm
          listId={listModel.id}
          boardId={listModel.boardId}
          onTaskAdded={handleTaskAdded}
          onCancel={handleCancelAddTask}
        />
      ) : (
        <button
          onClick={handleShowAddTaskForm}
          className="text-gray-600 text-sm mt-1 hover:underline flex items-center"
          disabled={isCreatingInList(listModel.id)}
        >
          {isCreatingInList(listModel.id) ? (
            <>
              <div className="w-3 h-3 border border-gray-600 border-t-transparent rounded-full animate-spin mr-1"></div>
              <span>Adding task...</span>
            </>
          ) : (
            <span>+ Add a task</span>
          )}
        </button>
      )}

      {/* Context Menu */}
      <ListContextMenu
        isOpen={showContextMenu}
        position={contextMenuPosition}
        onClose={handleCloseContextMenu}
        onCloseList={handleCloseList}
      />
    </div>
  );
});

export default BoardList;