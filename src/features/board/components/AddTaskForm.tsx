import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { useCards, useLists } from '../../../contexts';

interface AddTaskFormProps {
  listId: string;
  boardId: string;
  onTaskAdded?: () => void;
  onCancel: () => void;
}

const AddTaskForm: React.FC<AddTaskFormProps> = observer(({ listId, boardId, onTaskAdded, onCancel }) => {
  const { createCard, isCreating } = useCards();
  const { addCardToList } = useLists();
  const [taskTitle, setTaskTitle] = useState('');

  const handleAddTask = async () => {
    const title = taskTitle.trim();
    if (!title) return;

    try {
      // Reset the form immediately for better UX
      setTaskTitle('');

      // Create the card using the store
      const cardId = await createCard(title, listId, (newCardId) => {

        // Update the list with the new card
        addCardToList(newCardId, listId);

        // Explicitly notify listeners that a card was added to this list
      });

      // Additional notification to ensure UI updates
      if (cardId && typeof cardId === 'string') {
        // Force a notification after a short delay to ensure UI updates
        setTimeout(() => {
          const cardStore = useCards();
          cardStore.notifyCardUpdated(cardId, listId);
        }, 100);
      }

      // Notify parent component that a task was added
      if (onTaskAdded) {
        onTaskAdded();
      }

      // Close the form
      onCancel();
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
