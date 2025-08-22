import React, { useState } from 'react';
import { useCards } from '../../../contexts';
import { AddTaskFormProps } from '../../../types';

const AddTaskForm: React.FC<AddTaskFormProps> = ({ listId, boardId, onTaskAdded, onCancel }) => {
  const { createCard, isCreating } = useCards();
  const [taskTitle, setTaskTitle] = useState('');

  const handleAddTask = async () => {
    const title = taskTitle.trim();
    if (!title) return;

    const newCard = await createCard(title, listId, boardId);
    if (newCard) {
      setTaskTitle('');
      onTaskAdded();
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
};

export default AddTaskForm;
