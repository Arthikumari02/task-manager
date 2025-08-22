import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { Droppable } from '@hello-pangea/dnd';
import { BoardListProps } from '../../../types';
import TaskCard from './TaskCard';
import AddTaskForm from './AddTaskForm';

const BoardList: React.FC<BoardListProps> = observer(({ list, cards, onTaskAdded, onRenameList, onTaskRename }) => {
  const [showAddTaskForm, setShowAddTaskForm] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [title, setTitle] = useState(list.name);

  const handleTaskAdded = () => {
    setShowAddTaskForm(false);
    onTaskAdded();
  };

  const handleCancelAddTask = () => {
    setShowAddTaskForm(false);
  };

  const handleTitleClick = () => {
    setIsEditingTitle(true);
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
  };

  const handleTitleBlur = () => {
    setIsEditingTitle(false);
    if (title.trim() && title !== list.name) {
      // 🔹 Update parent/global state + call API
      onRenameList(list.id, title.trim());
    }
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.currentTarget.blur();
    }
  };

  const listCards = cards.filter((card) => card.listId === list.id);

  return (
    <div className="bg-[#F4F5F7] rounded-sm px-3 py-2 w-64 flex-shrink-0 min-h-[80px] h-fit">
      {/* List Title */}
      {isEditingTitle ? (
        <input
          type="text"
          value={title}
          onChange={handleTitleChange}
          onBlur={handleTitleBlur}
          onKeyDown={handleTitleKeyDown}
          autoFocus
          className="font-semibold text-gray-800 text-sm mb-2 px-1 py-0.5 rounded border border-gray-300 w-full"
        />
      ) : (
        <h3
          className="font-semibold text-gray-800 text-sm mb-2 cursor-pointer"
          onClick={handleTitleClick}
        >
          {title}
        </h3>
      )}

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
              <TaskCard key={card.id} id={card.id} name={card.name} desc={card.desc} index={index} onTaskRename={onTaskRename} />
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
          onClick={() => setShowAddTaskForm(true)}
          className="text-gray-600 text-sm mt-1 hover:underline"
        >
          + Add a task
        </button>
      )}
    </div>
  );
});

export default BoardList;
