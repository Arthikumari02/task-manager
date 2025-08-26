import React, { useState } from 'react';

interface BoardHeaderProps {
  boardName: string;
  boardId?: string;
  onBoardNameChange?: (newName: string) => void;
}

const BoardHeader: React.FC<BoardHeaderProps> = ({ boardName, boardId, onBoardNameChange }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(boardName);

  const handleNameClick = () => {
    if (onBoardNameChange) {
      setIsEditing(true);
    }
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
  };

  const handleNameBlur = () => {
    setIsEditing(false);
    if (name.trim() && name !== boardName && onBoardNameChange) {
      onBoardNameChange(name.trim());
    } else {
      setName(boardName); // Reset to original if empty or unchanged
    }
  };

  const handleNameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.currentTarget.blur();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setName(boardName); // Reset to original
    }
  };

  return (
    <div className="mb-4 sm:mb-6">
      {isEditing ? (
        <input
          type="text"
          value={name}
          onChange={handleNameChange}
          onBlur={handleNameBlur}
          onKeyDown={handleNameKeyDown}
          autoFocus
          className="text-white text-lg sm:text-xl font-semibold bg-transparent border-b-2 border-white border-opacity-50 focus:border-opacity-100 outline-none px-1 py-1"
        />
      ) : (
        <h1 
          className={`text-white text-lg sm:text-xl font-semibold ${onBoardNameChange ? 'cursor-pointer hover:bg-white hover:bg-opacity-10 rounded px-1 py-1 transition-colors' : ''}`}
          onClick={handleNameClick}
        >
          {boardName}
        </h1>
      )}
    </div>
  );
};

export default BoardHeader;
