import React from 'react';
import { AddListButtonProps } from '../../types';

const AddListButton: React.FC<AddListButtonProps> = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white rounded-md px-3 py-2 w-64 flex-shrink-0 min-h-[80px] h-fit transition-colors flex items-center justify-center"
    >
      <span className="text-sm">+ Add another list</span>
    </button>
  );
};

export default AddListButton;
