import React, { useState, useCallback, useMemo } from 'react';
import { observer } from 'mobx-react-lite';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { useLists, useCardsStore } from '../../contexts';
import BoardList from './BoardList';
import AddListForm from './AddListForm';
import EmptyBoardState from './EmptyBoardState';
import AddListButton from './AddListButton';
import BoardDataLoader from './BoardDataLoader';
import DragAndDropHandler from './DragAndDropHandler';
import TaskModalHandler from './TaskModalHandler';

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
  const cardStore = useCardsStore();

  const [dataLoaded, setDataLoaded] = useState(false);
  const [listsUpdateCounter, setListsUpdateCounter] = useState(0);

  // Refresh lists when needed
  const refreshLists = useCallback(() => {
    setListsUpdateCounter(prev => prev + 1);
  }, []);

  // Create a refresh function to update data
  const refreshData = useCallback(() => {
    onListAdded();

    // Force lists to update
    refreshLists();

    // Force re-fetch of lists and cards to ensure UI updates
    listStore.getListsForBoard(boardId);
    cardStore.getCardsForBoard(boardId);
  }, [boardId, listStore, cardStore, onListAdded, refreshLists]);

  // Get lists from store
  const getLists = useCallback(() => {
    const lists = listStore.getListsForBoard(boardId);
    return lists.filter(list => !list.closed);
  }, [boardId, listStore, listsUpdateCounter]);

  const lists = useMemo(() => getLists(), [getLists]);

  // Handle data loading state
  const handleDataLoaded = useCallback((isLoaded: boolean) => {
    setDataLoaded(isLoaded);
  }, []);

  // Render empty state if no lists
  if (dataLoaded && lists.length === 0 && !showNewListInput) {
    return (
      <EmptyBoardState onAddFirstList={onShowAddListForm} />
    );
  }

  return (
    <BoardDataLoader boardId={boardId} onDataLoaded={handleDataLoaded}>
      <DragAndDropHandler boardId={boardId} onRefreshData={refreshData}>
        {(handleDragEnd) => (
          <TaskModalHandler
            boardId={boardId}
            onRefreshData={refreshData}
            lists={lists.map(list => ({ id: list.id, name: list.name }))}
          >
            {(handleTaskClick, modalComponent) => (
              <div className="flex-1 pb-2" style={{ overflowX: 'visible' }}>
                <DragDropContext onDragEnd={handleDragEnd}>
                  <Droppable droppableId="board" type="list" direction="horizontal" ignoreContainerClipping={true}>
                    {(provided) => (
                      <div
                        className="flex gap-3 h-full items-start px-3"
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                      >
                        {lists.map((list, index) => (
                          <Draggable key={list.id} draggableId={list.id} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                              >
                                <BoardList
                                  listId={list.id}
                                  onTaskAdded={refreshData}
                                  onTaskClick={handleTaskClick}
                                />
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}

                        {showNewListInput ? (
                          <div className="h-full w-72 shrink-0 select-none">
                            <AddListForm
                              boardId={boardId}
                              onListAdded={onListAdded}
                              onCancel={onCancelAddList}
                            />
                          </div>
                        ) : (
                          <div className="h-full w-72 shrink-0">
                            <AddListButton onClick={onShowAddListForm} />
                          </div>
                        )}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>
                {modalComponent}
              </div>
            )}
          </TaskModalHandler>
        )}
      </DragAndDropHandler>
    </BoardDataLoader>
  );
});

export default BoardContent;
