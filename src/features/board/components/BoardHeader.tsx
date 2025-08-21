import React from 'react';

interface BoardHeaderProps {
  boardName: string;
}

const BoardHeader: React.FC<BoardHeaderProps> = ({ boardName }) => {
  return (
    <div className="mb-4 sm:mb-6">
      <h1 className="text-white text-lg sm:text-xl font-semibold">{boardName}</h1>
    </div>
  );
};

export default BoardHeader;
