import { Droppable } from '@hello-pangea/dnd';
import { observer } from 'mobx-react-lite';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useCards, useLists } from '../../../contexts';
import { CardModel } from '../../../models';
import AddTaskForm from './AddTaskForm';
import ListContextMenu from './ListContextMenu';
import TaskCard from './TaskCard';

interface BoardListProps {
  listId: string;
  onTaskAdded?: () => void;
  onTaskClick?: (cardId: string) => void;
}

const BoardList: React.FC<BoardListProps> = observer(({ listId, onTaskAdded, onTaskClick }) => {
  const { getListById, updateList } = useLists();
  const { getCardById, renameCard, isCreatingInList, registerCardUpdateListener, unregisterCardUpdateListener } = useCards();
  
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
    console.log(`Card update detected for list ${listId}`);
    // Force immediate re-render by updating the counter
    setCardUpdateCounter(prev => prev + 1);
  }, [listId]);
  
  // Register and unregister card update listeners
  useEffect(() => {
    if (listId) {
      console.log(`Registering card update listener for list ${listId}`);
      registerCardUpdateListener(listId, handleCardUpdate);
      
      return () => {
        console.log(`Unregistering card update listener for list ${listId}`);
        unregisterCardUpdateListener(listId, handleCardUpdate);
      };
    }
  }, [listId, registerCardUpdateListener, unregisterCardUpdateListener, handleCardUpdate]);

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
      // Update list name directly through store
      updateList(listModel.id, title.trim());
    }
  }, [title, listModel, updateList]);

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
    // Archive list directly through store
    if (listModel && typeof updateList === 'function') {
      updateList(listModel.id, listModel.name);
      // Note: In a real implementation, we would need to add archiving functionality
    }
  }, [listModel, updateList]);

  const handleShowAddTaskForm = useCallback(() => {
    setShowAddTaskForm(true);
  }, []);

  // Define handlers outside the render loop
  const handleTaskRename = useCallback((cardId: string, newName: string) => {
    // Use CardStore's renameCard method
    if (listModel?.boardId) {
      renameCard(listModel.boardId, cardId, newName);
    }
  }, [listModel, renameCard]);

  const handleTaskClick = useCallback((cardId: string) => {
    // Pass the card click event up to the parent component
    console.log(`Card clicked: ${cardId}`);
    if (onTaskClick) {
      onTaskClick(cardId);
    }
  }, [onTaskClick]);

  // Get cards for this list using MobX reactivity directly
  const listCards: CardModel[] = useMemo(() => {
    if (!listModel?.cardIdsList) {
      return [];
    }
    console.log(`BoardList: Getting cards for list ${listId}, found ${listModel.cardIdsList.length} card IDs`);

    const cards = listModel.cardIdsList
      .map(cardId => {
        const card = getCardById(cardId);
        if (!card) {
          console.log(`BoardList: Card ${cardId} not found in CardStore for list ${listId}`);
        }
        return card;
      })
      .filter((card): card is CardModel => card !== undefined && card !== null)
      // Sort cards by position to ensure correct order after drag and drop
      .sort((a, b) => (a.pos || 0) - (b.pos || 0));

    console.log(`BoardList: Returning ${cards.length} cards for list ${listId}`);
    return cards;
  }, [
    listModel?.cardIdsList,
    getCardById,
    listId,
    cardUpdateCounter, // Add cardUpdateCounter to dependencies to force re-render on card updates
    // We don't need to add individual card properties as dependencies
    // The cardUpdateCounter will handle forcing re-renders when cards change
  ]);

  // If listModel is null, render a placeholder
  if (!listModel) {
    return <div className="bg-[#F4F5F7] rounded-sm px-3 py-2 w-64 flex-shrink-0 min-h-[80px] h-fit">List not found</div>;
  }

  return (
    <div className="bg-[#F4F5F7] rounded-sm px-3 py-2 w-64 flex-shrink-0 min-h-[80px] h-fit">
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
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
          </svg>
        </button>
      </div>

      {/* Tasks */}
      <Droppable droppableId={listModel.id} type="card">
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