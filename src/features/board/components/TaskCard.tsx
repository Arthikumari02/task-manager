import React, { useState } from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { TaskCardProps } from '../../../types';

const TaskCard: React.FC<TaskCardProps> = ({ id, name, desc, index, onTaskRename }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [taskName, setTaskName] = useState(name);

  const handleClick = () => {
    setIsEditing(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTaskName(e.target.value);
  };

  const handleBlur = () => {
    setIsEditing(false);
    if (taskName.trim() && taskName !== name) {
      // 🔹 Call parent/ backend to update
      onTaskRename(id, taskName);
    } else {
      setTaskName(name); // reset if empty
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.currentTarget.blur();
    }
  };

  return (
    <Draggable draggableId={id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`bg-white rounded-sm px-2 py-2 shadow-sm text-sm cursor-pointer hover:bg-gray-50 break-words transition-opacity ${
            snapshot.isDragging ? 'opacity-50' : ''
          }`}
        >
          {isEditing ? (
            <input
              type="text"
              value={taskName}
              onChange={handleChange}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              autoFocus
              className="w-full border border-gray-300 rounded px-1 py-0.5 text-sm"
            />
          ) : (
            <div onClick={handleClick} className="cursor-text">
              <p className="text-sm">{taskName}</p>
              {desc && <p className="text-xs text-gray-500 mt-1">{desc}</p>}
            </div>
          )}
        </div>
      )}
    </Draggable>
  );
};

export default TaskCard;
