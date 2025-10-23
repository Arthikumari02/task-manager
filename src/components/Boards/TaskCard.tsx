import { observer } from 'mobx-react-lite';
import React, { useState, useCallback, useEffect } from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { TaskCardProps } from '../../types';
import { useCardsStore } from '../../contexts';

const TaskCard: React.FC<TaskCardProps> = observer(({ id, index, onTaskRename, onTaskClick, onTaskDelete }) => {
  const { getCardById } = useCardsStore();
  const card = getCardById(id);

  if (!card) return null;
  const [isEditing, setIsEditing] = useState(false);
  const [taskName, setTaskName] = useState(card.name);

  // Sync local state with props
  useEffect(() => {
    setTaskName(card.name);
  }, [card.name]);

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (onTaskClick) {
      onTaskClick(id);
    }
  }, [onTaskClick, id]);

  const handleDoubleClick = useCallback(() => {
    setIsEditing(true);
  }, []);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setTaskName(e.target.value);
  }, []);

  const handleBlur = useCallback(() => {
    setIsEditing(false);
    const trimmedName = taskName.trim();
    if (trimmedName && trimmedName !== card.name) {
      onTaskRename(id, trimmedName);
    } else {
      setTaskName(card.name);
    }
  }, [taskName, card.name, onTaskRename, id]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.currentTarget.blur();
    }
  }, []);

  const handleInputClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);

  return (
    <Draggable draggableId={id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`bg-white rounded-sm px-2 my-2 py-2 shadow-lg text-sm cursor-pointer hover:bg-gray-50 break-words transition-opacity ${snapshot.isDragging ? 'opacity-50' : ''
            }`}
          onClick={handleClick}
          onDoubleClick={handleDoubleClick}
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
              onClick={handleInputClick}
            />
          ) : (
            <div className="cursor-pointer">
              <p className="text-sm">{taskName}</p>
            </div>
          )}
        </div>
      )}
    </Draggable>
  );
});

export default TaskCard;
