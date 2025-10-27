import React, { useState, useCallback } from 'react';
import { observer } from 'mobx-react-lite';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { useListsStore, useCardsStore, useBoardsStore } from '../../contexts';
import BoardList from './BoardList';
import AddListForm from './AddListForm';
import EmptyBoardState from './EmptyBoardState';
import AddListButton from './AddListButton';
import BoardDataLoader from './BoardDataLoader';
import DragAndDropHandler from './DragAndDropHandler';
import TaskModalHandler from './TaskModalHandler';
import { ListModel } from '../../models/ListModel';

interface BoardContentProps {
  boardId: string;
  showNewListInput: boolean;
  onHideAddListForm: () => void;
  onCancelAddList: () => void;
  onShowAddListForm: () => void;
}

const BoardContent: React.FC<BoardContentProps> = observer(({
  boardId,
  showNewListInput,
  onHideAddListForm,
  onCancelAddList,
  onShowAddListForm
}) => {
  const listStore = useListsStore();
  const cardStore = useCardsStore();
  const boardsStore = useBoardsStore();
  const [dataLoaded, setDataLoaded] = useState(false);

  const refreshData = useCallback(() => {
    onHideAddListForm();
    listStore.getListsForBoard(boardId);
    cardStore.getCardsForBoard(boardId);
  }, [boardId, listStore, cardStore, onHideAddListForm]);

  const handleListCreationSuccess = useCallback(() => {
    refreshData();    
    onHideAddListForm();
}, [refreshData, onHideAddListForm]);

  const handleDataLoaded = useCallback((isLoaded: boolean) => {
    setDataLoaded(isLoaded);
  }, []);
const boardModel = boardsStore.getBoardById(boardId);

const lists = (boardModel?.listIds || [])
  .map(id => listStore.getListById(id))
  .filter((list): list is ListModel => !!list)
  .filter(list => !list.closed);

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
                            {(provided) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                              >
                                <BoardList
                                  key={`${list.id}-${cardStore.cardCount}`}
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
                              onListAdded={handleListCreationSuccess}
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
