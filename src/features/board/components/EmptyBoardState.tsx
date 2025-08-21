import React from 'react';
import { EmptyBoardStateProps } from '../../../types';

const EmptyBoardState: React.FC<EmptyBoardStateProps> = ({ onAddFirstList }) => {
  return (
    <div className="text-center py-12 w-full">
      <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </div>
      <h3 className="text-white text-lg font-semibold mb-2">This board is empty</h3>
      <p className="text-white text-opacity-80 mb-4">Add a list to get started organizing your tasks</p>
      <button
        onClick={onAddFirstList}
        className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-4 py-2 rounded-sm transition-colors flex items-center space-x-2 mx-auto"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        <span>Add a list</span>
      </button>
    </div>
  );
};

export default EmptyBoardState;
