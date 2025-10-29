import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { useCardsStore, useListsStore, useBoardsStore } from '../../contexts';
import { useCreateCard } from '../../hooks/APIs/CreateCard';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation('boards');

  const handleAddTask = async () => {
    const title = taskTitle.trim();
    if (!title) return;

    try {
      setTaskTitle('');

      const newCard = await createCard(listId, title, (cardModel) => {
        const listModel = getListById(listId);
        if (listModel && cardModel) {
          listModel.addCardId(cardModel.id);

          const boardModel = getBoardById(boardId);
          if (boardModel && !boardModel.hasListId(listId)) {
            boardModel.addListId(listId);
          }
        }

        addCardToList(cardModel.id, listId);

        notifyCardUpdated(cardModel.id, listId);

        if (onTaskAdded) {
          onTaskAdded();
        }

        onCancel();
      });

      if (newCard) {
        const listModel = getListById(listId);
        if (listModel) {
          listModel.addCardId(newCard.id);
        }

        addCardToList(newCard.id, listId);

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
        placeholder={t('enterTaskName')}
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
              <span>{t('adding')}</span>
            </>
          ) : (
            <span>{t('addtask')}</span>
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
