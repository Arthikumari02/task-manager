import React, { useState, useCallback } from 'react';
import { observer } from 'mobx-react-lite';
import { Droppable } from '@hello-pangea/dnd';
import { BoardListProps } from '../../../types';
import TaskCard from './TaskCard';
import AddTaskForm from './AddTaskForm';
import ListContextMenu from './ListContextMenu';

const BoardList: React.FC<BoardListProps> = observer(({ 
  list, 
  cards, 
  onTaskAdded, 
  onRenameList, 
  onTaskRename, 
  onCloseList, 
  onTaskClick 
}) => {
  const [showAddTaskForm, setShowAddTaskForm] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [title, setTitle] = useState(list.name);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });

  const handleTaskAdded = useCallback(() => {
    setShowAddTaskForm(false);
    // Call the parent's onTaskAdded to refresh the data
    onTaskAdded();
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
    if (title.trim() && title !== list.name) {
      // Update parent/global state + call API
      onRenameList(list.id, title.trim());
    }
  }, [title, list.name, list.id, onRenameList]);

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
    if (onCloseList) {
      onCloseList(list.id);
    }
  }, [onCloseList, list.id]);

  const handleShowAddTaskForm = useCallback(() => {
    setShowAddTaskForm(true);
  }, []);

  // Cards are now pre-filtered and passed directly from parent component using Map
  const listCards = cards || []; // Ensure we have an array even if cards is undefined

  return (
    <div className="bg-[#F4F5F7] rounded-sm px-3 py-2 w-64 flex-shrink-0 min-h-[80px] h-fit">
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
            {title}
          </h3>
        )}
        
        {/* Ellipsis button */}
        <button
          onClick={handleEllipsisClick}
          className="text-gray-500 hover:text-gray-700 p-1 rounded hover:bg-gray-200 transition-colors"
          title="List options"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
          </svg>
        </button>
      </div>

      {/* Tasks */}
      <Droppable droppableId={list.id} type="card">
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`min-h-[2px] ${
              snapshot.isDraggingOver ? 'bg-blue-100' : ''
            }`}
          >
            {listCards.map((card, index) => (
              <TaskCard 
                key={card.id} 
                id={card.id} 
                name={card.name} 
                desc={card.desc} 
                index={index} 
                onTaskRename={onTaskRename}
                onTaskClick={onTaskClick}
              />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>

      {/* Add Task */}
      {showAddTaskForm ? (
        <AddTaskForm
          listId={list.id}
          boardId={list.boardId}
          onTaskAdded={handleTaskAdded}
          onCancel={handleCancelAddTask}
        />
      ) : (
        <button
          onClick={handleShowAddTaskForm}
          className="text-gray-600 text-sm mt-1 hover:underline"
        >
          + Add a task
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