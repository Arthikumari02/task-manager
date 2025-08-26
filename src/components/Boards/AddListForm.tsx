import React, { useState, useRef, useEffect } from 'react';
import Icon from '../../assets/icons';
import { observer } from 'mobx-react-lite';
import { useLists, useBoardsStore } from '../../contexts';
import { AddListFormProps } from '../../types';
import { BoardModel } from '../../models';

const AddListForm: React.FC<AddListFormProps> = observer(({
  boardId,
  onListAdded,
  onCancel,
  isFirstList = false
}) => {
  const { createList, isCreating } = useLists();
  const { getBoardById } = useBoardsStore();
  const [listTitle, setListTitle] = useState('');

  const handleAddList = async () => {
    const title = listTitle.trim();
    if (!title) return;

    const newList = await createList(boardId, title, (listModel) => {
      // Update the board model with the new list ID
      const boardModel = getBoardById(boardId);
      if (boardModel && boardModel instanceof BoardModel) {
        if (!boardModel.hasListId(listModel.id)) {
          boardModel.addListId(listModel.id);
        }
      }
    });

    if (newList) {
      setListTitle('');
      onListAdded();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddList();
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };

  if (isFirstList) {
    return (
      <div className="bg-gray-100 rounded-sm p-3 max-w-[252px] flex-shrink-0 mx-auto">
        <h3 className="font-semibold text-gray-800 mb-2">Create Your First List</h3>
        <input
          type="text"
          value={listTitle}
          onChange={(e) => setListTitle(e.target.value)}
          placeholder="Enter list title..."
          className="w-full p-2 border rounded mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          autoFocus
          onKeyDown={handleKeyDown}
        />
        <div className="flex space-x-2">
          <button
            onClick={handleAddList}
            disabled={isCreating}
            className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
          >
            {isCreating ? (
              <>
                <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Creating...</span>
              </>
            ) : (
              <span>Create List</span>
            )}
          </button>
          <button
            onClick={onCancel}
            className="text-gray-600 hover:text-gray-800 px-2"
          >
            <Icon type="close" className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#F4F5F7] rounded-md px-3 py-2 w-64 flex-shrink-0 min-h-[80px] h-fit">
      <input
        type="text"
        value={listTitle}
        onChange={(e) => setListTitle(e.target.value)}
        placeholder="Enter list title..."
        className="w-full p-1.5 border rounded text-sm mb-2"
        autoFocus
        onKeyDown={handleKeyDown}
        disabled={isCreating}
      />
      <div className="flex space-x-2">
        <button
          onClick={handleAddList}
          disabled={isCreating}
          className="bg-blue-600 text-white px-3 py-1 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
        >
          {isCreating ? (
            <>
              <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Adding...</span>
            </>
          ) : (
            <span>Add List</span>
          )}
        </button>
        <button
          onClick={onCancel}
          className="text-gray-600 text-sm"
        >
          x
        </button>
      </div>
    </div>
  );
});

export default AddListForm;
