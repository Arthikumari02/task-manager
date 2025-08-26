import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { useLists, useCards, useBoards } from '../../../contexts';
import { TrelloCard } from '../../../types';
import BoardList from './BoardList';
import AddListForm from './AddListForm';
import EmptyBoardState from './EmptyBoardState';
import AddListButton from './AddListButton';
import TaskModal from './TaskModal';
import { ListModel } from '../../../models';

interface BoardContentProps {
  boardId: string;
  showNewListInput: boolean;
  onListAdded: () => void;
  onCancelAddList: () => void;
  onShowAddListForm: () => void;
}

const BoardContent: React.FC<BoardContentProps> = observer(({
  boardId,
  showNewListInput,
  onListAdded,
  onCancelAddList,
  onShowAddListForm
}) => {
  const listStore = useLists();
  const cardStore = useCards();
  const { getBoardById } = useBoards();

  const [isLoading, setIsLoading] = useState(true);
  const [dataLoadedForBoard, setDataLoadedForBoard] = useState<string | null>(null);

  const boardModel = useMemo(() => getBoardById(boardId), [boardId]);

  const loadBoardData = () => {
    let isMounted = true;

    const loadBoardData = async () => {
      if (!boardId) return;

      if (dataLoadedForBoard === boardId) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      try {
        if (dataLoadedForBoard && dataLoadedForBoard !== boardId) {
          if (boardModel) {
            //boardModel.clearListIds();
          }
        }

        await new Promise<void>((resolve) => {
          listStore.fetchBoardLists(boardId, (lists) => {
            if (!isMounted) return;
            if (boardModel) {
              //boardModel.clearListIds();
              lists.forEach(list => boardModel.addListId(list.id));
            }
            resolve();
          });
        });

        await new Promise<void>((resolve) => {
          cardStore.fetchBoardCards(boardId, (cards) => {
            cards.forEach(card => {
              const listModel = listStore.getListById(card.listId);
              if (listModel) {
                listModel.addCardId(card.id);
              }
            });
            resolve();
          });
        });

        if (isMounted) {
          setDataLoadedForBoard(boardId);
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error loading board data:', error);
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadBoardData();

    return () => {
      isMounted = false;
    };
  }

  useEffect(() => {
    loadBoardData();
  }, [boardId]);

  // Reset data loaded state when boardId changes
  useEffect(() => {
    if (dataLoadedForBoard && dataLoadedForBoard !== boardId) {
      setDataLoadedForBoard(null);
    }
  }, [boardId, dataLoadedForBoard]);

  // Get lists and cards from stores
  const listIds = useMemo(() => boardModel?.allListIds || [], [boardModel?.allListIds]);

  const getLists = useCallback(() => {
    // First get lists directly from the store
    const storeList = listStore.getListsForBoard(boardId);
    if (storeList && storeList.length > 0) {
      return storeList;
    }

    // Fallback to using listIds
    const lists: ListModel[] = []
    listIds.forEach(listId => {
      const listModel = listStore.getListById(listId);
      if (listModel) {
        lists.push(listModel);
      }
    });
    return lists;
  }, [boardId, listIds]);

  const lists = useMemo(() => getLists(), [boardId, listIds]);

  // Create a refresh function to update data
  const refreshData = useCallback(() => {
    onListAdded();

    // Force re-fetch of lists and cards to ensure UI updates
    const lists = listStore.getListsForBoard(boardId);
    const cards = cardStore.getCardsForBoard(boardId);

    // Force a re-render by updating the component state
    setDataLoadedForBoard(prev => {
      if (prev === boardId) {
        // Toggle a bit to force re-render while keeping the same boardId
        const timestamp = Date.now().toString();
        return `${boardId}-${timestamp}`;
      }
      return boardId;
    });
  }, [listStore, cardStore, boardId, onListAdded]);

  // Extract methods from stores
  const { reorderLists } = listStore;
  const { moveCard, reorderCardsInList, renameCard, updateCardDescription, deleteCard, addComment } = cardStore;

  const [selectedTask, setSelectedTask] = useState<TrelloCard | null>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

  const handleRenameTask = useCallback((taskId: string, newName: string) => {
    if (boardId) {
      // Get the card to find its list ID
      const card = cardStore.getCardById(taskId);
      if (card) {
        renameCard(boardId, taskId, newName);
        // No need to call refreshData() as the notification system will handle updates
      }
    }
  }, [boardId, renameCard, cardStore]);

  const handleUpdateDescription = useCallback(async (cardId: string, description: string) => {
    await updateCardDescription(cardId, description);
    // Get the card to find its list ID
    const card = cardStore.getCardById(cardId);
    if (card) {
      // Notify subscribers about the card update
      cardStore.notifyCardUpdated(cardId, card.listId);
    }
  }, [updateCardDescription, cardStore]);

  const handleDeleteCard = useCallback(async (cardId: string) => {
    await deleteCard(cardId);
    refreshData();
  }, [deleteCard, refreshData]);

  const handleAddComment = useCallback(async (cardId: string, comment: string) => {
    await addComment(cardId, comment);
    refreshData();
  }, [addComment, refreshData]);

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

  const handleDragEnd = useCallback((result: DropResult) => {
    const { destination, source, type, draggableId } = result;


    if (!destination) {
      return;
    }

    if (destination.droppableId === source.droppableId && destination.index === source.index) {
      return;
    }

    // Immediately update UI optimistically before API calls complete
    if (type === 'list') {
      // Handle list reordering
      reorderLists(boardId, source.index, destination.index);

      // Force immediate refresh
      refreshData();
      return;
    }

    if (source.droppableId === destination.droppableId) {


      // Get the card model before reordering
      const cardModel = cardStore.getCardById(draggableId);
      if (!cardModel) {
        console.error('Card not found:', draggableId);
        return;
      }
      // Update the card position in the CardStore
      cardModel.pos = destination.index;
      // Make sure the change is reflected in the store
      cardStore.cardsMap.set(draggableId, cardModel);
      console.log("After setting position", cardModel.pos)
      // Update ListStore first to maintain consistent state
      const sourceList = listStore.getListById(source.droppableId);
      if (sourceList) {
        // Reorder the card IDs in the list
        const cardIds = [...sourceList.cardIdsList];
        const [movedCardId] = cardIds.splice(source.index, 1);
        // cardIds.splice(destination.index, 0, movedCardId);

        // Update card IDs by removing and adding them individually
        // since cardIdsList is a computed property
        sourceList.updateCardPosition(movedCardId, destination.index);
        console.log("After updating position", sourceList.cardIdsList, draggableId)
      }

      // Handle card reordering within the same list in CardStore
      // Wait for the API call to complete to ensure persistence
      reorderCardsInList(boardId, source.droppableId, source.index, destination.index).then(() => {
        // Notify any subscribers that this card has been updated
        cardStore.notifyCardUpdated(draggableId, source.droppableId);

        // Force a refresh of the data after a short delay to ensure UI is in sync
        setTimeout(() => {
          refreshData();
        }, 300);
      });

    } else {

      // Get the card model before moving
      const cardModel = cardStore.getCardById(draggableId);
      if (!cardModel) {
        console.error('Card not found:', draggableId);
        return;
      }

      // Update ListStore first - remove card from source list
      listStore.removeCardFromList(source.droppableId, draggableId);

      // Add card to destination list at the correct position
      const destList = listStore.getListById(destination.droppableId);
      if (destList) {
        const cardIds = [...destList.cardIdsList];
        cardIds.splice(destination.index, 0, draggableId);

        // Update card IDs by removing and adding them individually
        // since cardIdsList is a computed property
        destList.getCardIds().forEach(id => destList.removeCardId(id));
        cardIds.forEach(id => destList.addCardId(id));
      } else {
        // Fallback if list not found
        listStore.addCardToList(draggableId, destination.droppableId);
      }

      // Update the card's listId in CardStore
      cardModel.listId = destination.droppableId;
      cardStore.cardsMap.set(draggableId, cardModel);

      // Handle card moving between lists in CardStore API
      moveCard(boardId, draggableId, source.droppableId, destination.droppableId, destination.index);

      // Notify subscribers about the card update in both source and destination lists
      cardStore.notifyCardUpdated(draggableId, source.droppableId);

      cardStore.notifyCardUpdated(draggableId, destination.droppableId);
    }
  }, [reorderLists, reorderCardsInList, moveCard, boardId, refreshData, cardStore, listStore]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-gray-600">Loading board data...</div>
      </div>
    );
  }

  if (lists.length === 0 && !showNewListInput) {
    return <EmptyBoardState onAddFirstList={onShowAddListForm} />;
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex space-x-2 sm:space-x-4 pb-4 -mb-4">
        {/* Empty Board State */}
        {lists.length === 0 && !showNewListInput && (
          <EmptyBoardState onAddFirstList={onShowAddListForm} />
        )}

        {/* Add First List Form */}
        {lists.length === 0 && showNewListInput && boardId && (
          <AddListForm
            boardId={boardId}
            onListAdded={onListAdded}
            onCancel={onCancelAddList}
            isFirstList={true}
          />
        )}

        {/* Droppable area for lists */}
        {lists.length > 0 && (
          <Droppable droppableId="board-lists" direction="horizontal" type="list">
            {(provided, snapshot) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className={`flex space-x-2 sm:space-x-4 ${snapshot.isDraggingOver ? 'bg-blue-50 bg-opacity-50 rounded-lg p-2' : ''
                  }`}
              >
                {lists.map((list: any, index: number) => (
                  <Draggable key={list.id} draggableId={list.id} index={index}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className={`${snapshot.isDragging ? 'opacity-75 transform rotate-3 z-50' : ''}`}
                        style={{
                          ...provided.draggableProps.style,
                          // Ensure proper z-index during drag
                          zIndex: snapshot.isDragging ? 1000 : 'auto',
                        }}
                      >
                        <BoardList
                          key={list.id}
                          listId={list.id}
                          onTaskAdded={refreshData}
                          onTaskClick={handleTaskClick}
                        />
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        )}

        {/* Add Another List */}
        {lists.length > 0 && (
          showNewListInput && boardId ? (
            <AddListForm
              boardId={boardId}
              onListAdded={onListAdded}
              onCancel={onCancelAddList}
              isFirstList={false}
            />
          ) : (
            <AddListButton onClick={onShowAddListForm} />
          )
        )}
      </div>

      {/* Task Modal */}
      {isTaskModalOpen && selectedTask && (
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
      )}
    </DragDropContext>
  );
});

export default BoardContent;