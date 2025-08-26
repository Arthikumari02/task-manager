import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { useCardsStore, useListsStore, useBoardsStore } from '../../contexts';
import { useCreateCard } from '../../hooks/APIs/CreateCard';

interface AddTaskFormProps {
  listId: string;
  boardId: string;
  onTaskAdded?: () => void;
  onCancel: () => void;
}

const AddTaskForm: React.FC<AddTaskFormProps> = observer(({ listId, boardId, onTaskAdded, onCancel }) => {
  const cardStore = useCardsStore();
  const { notifyCardUpdated } = cardStore;
  const { addCardToList, getListById } = useListsStore();
  const { getBoardById } = useBoardsStore();
  const { createCard, isCreating } = useCreateCard();
  const [taskTitle, setTaskTitle] = useState('');

  const handleAddTask = async () => {
    const title = taskTitle.trim();
    if (!title) return;

    try {
      // Reset the form immediately for better UX
      setTaskTitle('');

      // Create the card using the API hook
      const newCard = await createCard(listId, title, (cardModel) => {
        // Get the list model and add the card ID directly
        const listModel = getListById(listId);
        if (listModel && cardModel) {
          // Add card ID to the list model
          listModel.addCardId(cardModel.id);

          // Also ensure the board knows about this list
          const boardModel = getBoardById(boardId);
          if (boardModel && !boardModel.hasListId(listId)) {
            boardModel.addListId(listId);
          }
        }

        // Update the list with the new card (this updates the store's internal mapping)
        addCardToList(cardModel.id, listId);

        // Immediately notify listeners that a card was added to this list
        notifyCardUpdated(cardModel.id, listId);

        // Notify parent component that a task was added
        if (onTaskAdded) {
          onTaskAdded();
        }

        // Close the form
        onCancel();
      });

      // Force an immediate notification after the card is created
      // This ensures the UI updates even if the callback hasn't run yet
      if (newCard) {
        // Get the list model and add the card ID directly to ensure immediate UI update
        const listModel = getListById(listId);
        if (listModel) {
          listModel.addCardId(newCard.id);
        }

        // Update the list with the new card
        addCardToList(newCard.id, listId);

        // Notify listeners
        notifyCardUpdated(newCard.id, listId);
      }
    } catch (error) {
      console.error('Error creating card:', error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddTask();
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };

  return (
    <div className="space-y-2">
      <input
        type="text"
        value={taskTitle}
        onChange={(e) => setTaskTitle(e.target.value)}
        placeholder="Enter task name..."
        className="w-full p-1.5 border rounded text-sm"
        autoFocus
        onKeyDown={handleKeyDown}
        disabled={isCreating}
      />
      <div className="flex space-x-2">
        <button
          onClick={handleAddTask}
          disabled={isCreating}
          className="bg-blue-600 text-white px-3 py-1 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
        >
          {isCreating ? (
            <>
              <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Adding...</span>
            </>
          ) : (
            <span>Add Task</span>
          )}
        </button>
        <button
          onClick={onCancel}
          className="text-gray-600 text-sm"
        >
          x
        </button>
      </div>
    </div>
  );
});

export default AddTaskForm;
