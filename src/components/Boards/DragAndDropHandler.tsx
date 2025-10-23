import React, { useCallback } from 'react';
import { observer } from 'mobx-react-lite';
import { DropResult } from '@hello-pangea/dnd';
import { useListsStore, useCardsStore } from '../../contexts';
import { useReorderLists } from '../../hooks/APIs/ReorderLists';
import { useMoveCard } from '../../hooks/APIs/MoveCard';
import { useReorderCardsInList } from '../../hooks/APIs/ReorderCardsInList';
import { useBoardsStore } from '../../contexts';
import { runInAction } from 'mobx';

interface DragAndDropHandlerProps {
  boardId: string;
  onRefreshData: () => void;
  children: (handleDragEnd: (result: DropResult) => void) => React.ReactNode;
}

/**
 * Component responsible for handling drag and drop operations
 */
const DragAndDropHandler: React.FC<DragAndDropHandlerProps> = observer(({
  boardId,
  onRefreshData,
  children
}) => {
  const listStore = useListsStore();
  const cardStore = useCardsStore();
  const reorderLists = useReorderLists();
  const reorderCardsInList = useReorderCardsInList();
  const { moveCard } = useMoveCard();
  const boardsStore = useBoardsStore();

  const handleDragEnd = useCallback((result: DropResult) => {
    const { destination, source, type, draggableId } = result;

    if (!destination) {
      return;
    }

    if (destination.droppableId === source.droppableId && destination.index === source.index) {
      return;
    }
    if (type === 'list') {
      const board = boardsStore.getBoardById(boardId);
      if (board) {
        // Optimistic update
        const listIds = [...board.listIds];
        const [moved] = listIds.splice(source.index, 1);
        listIds.splice(destination.index, 0, moved);
    
        runInAction(() => {
          board.listIds = listIds;
        });
      }
    
      reorderLists(boardId, source.index, destination.index)
        .then(() => onRefreshData())
        .catch(error => { console.error(error); onRefreshData(); });
    
      return;
    }
    if (source.droppableId === destination.droppableId) {
      const cardModel = cardStore.getCardById(draggableId);
      if (!cardModel) {
        console.error('Card not found:', draggableId);
        return;
      }

      const sourceList = listStore.getListById(source.droppableId);
      if (sourceList) {
        sourceList.updateCardPosition(draggableId, destination.index);
      }

      cardModel.pos = destination.index;
      cardStore.cardsMap.set(draggableId, cardModel);
      reorderCardsInList(boardId, source.droppableId, source.index, destination.index).then(() => {
        // cardStore.notifyCardUpdated(draggableId, source.droppableId);
        onRefreshData();
      }).catch(error => {
        console.error("Card reorder failed, fetching fresh data...", error);
        onRefreshData();
      });
    }
    else {
      const cardModel = cardStore.getCardById(draggableId);
      if (!cardModel) {
        console.error('Card not found:', draggableId);
        return;
      }

      listStore.removeCardFromList(source.droppableId, draggableId);

      const destList = listStore.getListById(destination.droppableId);
      if (destList) {
        const cardIds = [...destList.cardIdsList];
        cardIds.splice(destination.index, 0, draggableId);

        // Update card IDs in the destination list
        destList.getCardIds().forEach(id => destList.removeCardId(id));
        cardIds.forEach(id => destList.addCardId(id));
      } else {
        listStore.addCardToList(draggableId, destination.droppableId);
      }

      // Update the card's listId in CardStore
      cardModel.listId = destination.droppableId;
      cardModel.pos = destination.index;
      cardStore.cardsMap.set(draggableId, cardModel);

      // Handle card moving between lists in CardStore API
      moveCard(boardId, draggableId, source.droppableId, destination.droppableId, destination.index).then
      (() => {
          onRefreshData();
        })
        .catch(error => {
          console.error("Card move failed, fetching fresh data...", error);
          onRefreshData();
        });
    }
  }, [boardId, cardStore, listStore, onRefreshData, reorderLists, reorderCardsInList, moveCard]);

  return <>{children(handleDragEnd)}</>;
});

export default DragAndDropHandler;
