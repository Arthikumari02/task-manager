import React from 'react';
import { observer } from 'mobx-react-lite';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { BoardContentProps } from '../../../types';
import { useLists, useCards } from '../../../contexts';
import BoardList from './BoardList';
import AddListForm from './AddListForm';
import EmptyBoardState from './EmptyBoardState';
import AddListButton from './AddListButton';

interface ExtendedBoardContentProps extends BoardContentProps {
  listsMap?: Map<string, any>;
  cardsByListMap?: Map<string, any[]>;
}

const BoardContent: React.FC<ExtendedBoardContentProps> = observer(({
  boardId,
  lists,
  cards,
  showNewListInput,
  onTaskAdded,
  onListAdded,
  onCancelAddList,
  onShowAddListForm,
  cardsByListMap,
}) => {
  const { reorderLists, updateList } = useLists();
  const { moveCard, reorderCardsInList, renameCard } = useCards();

  const handleRenameList = (listId: string, newName: string) => {
    updateList(listId, newName);
  };

  const handleRenameTask = (taskId: string, newName: string) => {
    if (boardId) {
      renameCard(boardId, taskId, newName);
    }
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination || !boardId) {
      return;
    }

    const { source, destination, draggableId, type } = result;

    // If dropped in the same position, do nothing
    if (source.droppableId === destination.droppableId && source.index === destination.index) {
      console.log('Dropped in same position, no action needed');
      return;
    }

    if (type === 'list') {
      // Handle list reordering
      reorderLists(boardId, source.index, destination.index);
    } else if (type === 'card') {
      // Handle card movement
      const sourceListId = source.droppableId;
      const destinationListId = destination.droppableId;

      if (sourceListId === destinationListId) {
        // Reorder cards within the same list
        reorderCardsInList(boardId, sourceListId, source.index, destination.index);
      } else {
        // Move card to different list
        moveCard(boardId, draggableId, sourceListId, destinationListId, destination.index);
      }
    }
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex space-x-2 sm:space-x-4 overflow-x-auto pb-4 -mb-4">
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
                        className={`${snapshot.isDragging
                          ? 'opacity-75 transform rotate-3 z-50'
                          : ''
                          }`}
                        style={{
                          ...provided.draggableProps.style,
                          // Ensure proper z-index during drag
                          zIndex: snapshot.isDragging ? 1000 : 'auto',
                        }}
                      >
                        <BoardList
                          list={list}
                          cards={cardsByListMap?.get(list.id) || []}
                          onTaskAdded={onTaskAdded}
                          onRenameList={handleRenameList}
                          onTaskRename={handleRenameTask}
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
    </DragDropContext>
  );
});

export default BoardContent;