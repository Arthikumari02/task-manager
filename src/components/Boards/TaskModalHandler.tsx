import React, { useState, useCallback } from 'react';
import { observer } from 'mobx-react-lite';
import { useCardsStore } from '../../contexts';
import { TrelloCard } from '../../types';
import TaskModal from './TaskModal';
import { useRenameCard } from '../../hooks/APIs/RenameCard'
import { useUpdateCardDescription } from '../../hooks/APIs/UpdateCardDescription'
import { useDeleteCard } from '../../hooks/APIs/DeleteCard'
import { useAddComment } from '../../hooks/APIs/AddComment'

interface TaskModalHandlerProps {
  boardId: string;
  onRefreshData: () => void;
  lists: Array<{ id: string; name: string }>;
  children: (
    handleTaskClick: (cardId: string) => void,
    modalComponent: React.ReactNode
  ) => React.ReactNode;
}

/**
 * Component responsible for handling task modal operations
 */
const TaskModalHandler: React.FC<TaskModalHandlerProps> = observer(({
  boardId,
  onRefreshData,
  lists,
  children
}) => {
  const cardStore = useCardsStore();
  
  // Initialize hooks at the component level
  const { renameCard } = useRenameCard();
  const { updateCardDescription } = useUpdateCardDescription();
  const { deleteCard } = useDeleteCard();
  const { addComment } = useAddComment();

  const [selectedTask, setSelectedTask] = useState<TrelloCard | null>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

  const handleRenameTask = useCallback((taskId: string, newName: string) => {
    renameCard(taskId, newName, {
      onSuccess: () => onRefreshData()
    });
  }, [renameCard, onRefreshData]);

  const handleUpdateDescription = useCallback(async (cardId: string, description: string) => {
    await updateCardDescription(cardId, description, {
      onSuccess: () => onRefreshData()
    });
  }, [updateCardDescription, onRefreshData]);

  const handleDeleteCard = useCallback(async (cardId: string) => {
    await deleteCard(cardId, {
      onSuccess: () => onRefreshData()
    });
  }, [deleteCard, onRefreshData]);

  const handleAddComment = useCallback(async (cardId: string, comment: string) => {
    await addComment(cardId, comment, {
      onSuccess: () => onRefreshData()
    });
  }, [addComment, onRefreshData]);

  const handleCloseTaskModal = useCallback(() => {
    setIsTaskModalOpen(false);
    setSelectedTask(null);
  }, []);

  const handleTaskClick = useCallback((cardId: string) => {
    const card = cardStore.getCardById(cardId);
    if (card) {
      const trelloCard: TrelloCard = {
        id: card.id,
        name: card.name,
        desc: card.desc,
        closed: card.closed,
        pos: card.pos,
        listId: card.listId,
        boardId: card.boardId,
        url: card.url
      };
      setSelectedTask(trelloCard);
      setIsTaskModalOpen(true);
    }
  }, [cardStore]);

  const modalComponent = isTaskModalOpen && selectedTask ? (
    <TaskModal
      isOpen={isTaskModalOpen}
      onClose={handleCloseTaskModal}
      task={selectedTask}
      listName={lists.find(list => list.id === selectedTask.listId)?.name || ''}
      onUpdateDescription={handleUpdateDescription}
      onDeleteTask={handleDeleteCard}
      onAddComment={handleAddComment}
      onTaskRename={handleRenameTask}
    />
  ) : null;

  return <>{children(handleTaskClick, modalComponent)}</>;
});

export default TaskModalHandler;
