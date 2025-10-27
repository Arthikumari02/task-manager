import { Droppable } from '@hello-pangea/dnd';
import { observer } from 'mobx-react-lite';
import React, { useCallback, useState } from 'react';
import Icon from '../../assets/icons';
import { useCardsStore, useListsStore, useBoardsStore } from '../../contexts';
import { useUpdateList } from '../../hooks/APIs/UpdateList';
import { useRenameCard } from '../../hooks/APIs/RenameCard';
import { useCloseList } from '../../hooks/APIs/CloseList';
import { CardModel } from '../../models';
import AddTaskForm from './AddTaskForm';
import ListContextMenu from './ListContextMenu';
import TaskCard from './TaskCard';
import { runInAction } from 'mobx';

interface BoardListProps {
  listId: string;
  onTaskAdded?: () => void;
  onTaskClick?: (cardId: string) => void;
}

const BoardList: React.FC<BoardListProps> = observer(({ listId, onTaskAdded, onTaskClick }) => {
  const { getListById } = useListsStore();
  const { updateList } = useUpdateList();
  const { closeList } = useCloseList();
  const { renameCard } = useRenameCard();
  const { getCardById, isCreatingInList } = useCardsStore();
  const { setListClosed } = useListsStore();
  const { getBoardById } = useBoardsStore();

  const listModel = getListById(listId);

  const [showAddTaskForm, setShowAddTaskForm] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [title, setTitle] = useState(listModel?.name || 'Untitled');
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });

  const handleTaskAdded = useCallback(() => {
    setShowAddTaskForm(false);
    if (onTaskAdded) {
      onTaskAdded();
    }
  }, [onTaskAdded]);

  const handleCancelAddTask = useCallback(() => {
    setShowAddTaskForm(false);
  }, []);

  const handleTitleClick = useCallback(() => {
    setIsEditingTitle(true);
  }, []);

  const handleTitleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
  }, []);

  const handleTitleBlur = useCallback(() => {
    setIsEditingTitle(false);
    if (!listModel || !title.trim() || title === listModel.name) {
      setTitle(listModel?.name || 'Untitled');
      return;
    }

    const originalName = listModel.name;
    const newName = title.trim();

    // Optimistic update - immediately update the UI
    runInAction(() => {
      listModel.name = newName;
    });

    // Then make the API call
    updateList(listModel.id, newName, {
      onSuccess: () => {
        if (onTaskAdded) {
          onTaskAdded();
        }
      },
      onError: (error) => {
        console.error("Failed to rename list:", error);
        // Revert on error
        listModel.name = originalName;
        setTitle(originalName);
      }
    });
  }, [title, listModel, onTaskAdded, updateList]);

  const handleTitleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.currentTarget.blur();
    }
  }, []);

  const handleEllipsisClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setContextMenuPosition({
      x: rect.left,
      y: rect.bottom + 5
    });
    setShowContextMenu(true);
  }, []);

  const handleCloseContextMenu = useCallback(() => {
    setShowContextMenu(false);
  }, []);

  const handleCloseList = useCallback(() => {
    if (!listModel) return;

    const listId = listModel.id;
    const boardId = listModel.boardId;

    closeList(listId)
      .then(() => {
        runInAction(() => {
          setListClosed(listId, true);

          const boardModel = getBoardById(boardId);
          if (boardModel) {
            boardModel.removeListId(listId);
          }
        });
      })
      .catch(error => {
        console.error("Failed to close list:", error);
      });
  }, [listModel, closeList, setListClosed, getBoardById]);

  const handleShowAddTaskForm = useCallback(() => {
    setShowAddTaskForm(true);
  }, []);

  // Define handlers outside the render loop
  const handleTaskRename = useCallback((cardId: string, newName: string) => {
    // Use renameCard API hook
    renameCard(cardId, newName, {
      onSuccess: () => {
        const card = getCardById(cardId);
        if (card) {
          runInAction(() => {
            card.name = newName; // <- MobX observable update
          });
        }
      },
      onError: (error) => console.error(error),
    });
  }, [renameCard]);

  const handleTaskClick = useCallback((cardId: string) => {
    if (onTaskClick) {
      onTaskClick(cardId);
    }
  }, [onTaskClick]);

  const listCards: CardModel[] = listModel?.cardIdsList
    .map(id => getCardById(id))
    .filter((c): c is CardModel => !!c) || [];

  if (!listModel) {
    return <div className="bg-[#F4F5F7] rounded-sm px-3 py-2 w-64 flex-shrink-0 min-h-[80px] h-fit">List not found</div>;
  }

  return (
    <div className="bg-[#F4F5F7] rounded-sm px-3 py-2 w-64 flex-shrink-0 min-h-[80px] h-fit" style={{ overflow: 'visible' }}>
      {/* List Title */}
      <div className="flex items-center justify-between mb-2">
        {isEditingTitle ? (
          <input
            type="text"
            value={title}
            onChange={handleTitleChange}
            onBlur={handleTitleBlur}
            onKeyDown={handleTitleKeyDown}
            autoFocus
            className="font-semibold text-gray-800 text-sm px-1 py-0.5 rounded border border-gray-300 flex-1 mr-2"
          />
        ) : (
          <h3
            className="font-semibold text-gray-800 text-sm cursor-pointer flex-1"
            onClick={handleTitleClick}
          >
            {listModel.name}
          </h3>
        )}

        {/* Ellipsis button */}
        <button
          onClick={handleEllipsisClick}
          className="text-gray-500 hover:text-gray-700 p-1 rounded hover:bg-gray-200 transition-colors"
          title="List options"
        >
          <Icon type="menu" className="w-4 h-4" />
        </button>
      </div>

      {/* Tasks */}
      <Droppable droppableId={listModel.id} type="card" ignoreContainerClipping={true}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`min-h-[2px] ${snapshot.isDraggingOver ? 'bg-blue-100' : ''
              }`}
          >
            {listCards.map((card, index) => (
              <TaskCard
                key={card.id}
                id={card.id}
                name={card.name}
                desc={card.desc}
                index={index}
                onTaskRename={handleTaskRename}
                onTaskClick={handleTaskClick}
              />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>

      {/* Add Task */}
      {showAddTaskForm ? (
        <AddTaskForm
          listId={listModel.id}
          boardId={listModel.boardId}
          onTaskAdded={handleTaskAdded}
          onCancel={handleCancelAddTask}
        />
      ) : (
        <button
          onClick={handleShowAddTaskForm}
          className="text-gray-600 text-sm mt-1 hover:underline flex items-center"
          disabled={isCreatingInList(listModel.id)}
        >
          {isCreatingInList(listModel.id) ? (
            <>
              <div className="w-3 h-3 border border-gray-600 border-t-transparent rounded-full animate-spin mr-1"></div>
              <span>Adding task...</span>
            </>
          ) : (
            <span>+ Add a task</span>
          )}
        </button>
      )}

      {/* Context Menu */}
      <ListContextMenu
        isOpen={showContextMenu}
        position={contextMenuPosition}
        onClose={handleCloseContextMenu}
        onCloseList={handleCloseList}
      />
    </div>
  );
});

export default BoardList;