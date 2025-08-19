import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { useNavigate } from 'react-router-dom';
import { authStore } from '../stores/AuthStore';

interface CreateBoardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CreateBoardModal: React.FC<CreateBoardModalProps> = observer(({ isOpen, onClose }) => {
  const [boardName, setBoardName] = useState('');
  const [boardDescription, setBoardDescription] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (boardName.trim()) {
      try {
        const newBoard = await authStore.addBoard(boardName.trim(), boardDescription.trim());
        setBoardName('');
        setBoardDescription('');
        onClose();
        // Navigate to the new board view
        if (newBoard) {
          navigate(`/board/${newBoard.id}`);
        }
      } catch (error) {
        console.error('Failed to create board:', error);
      }
    }
  };

  const handleClose = () => {
    setBoardName('');
    setBoardDescription('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-[#0067A3] rounded-lg shadow-xl max-w-sm w-full mx-4">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-blue-500">
          <div></div>
          <button
            onClick={handleClose}
            className="text-white hover:text-gray-200 transition-colors duration-200"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-4">
          <div className="mb-4">
            <input
              type="text"
              id="boardName"
              value={boardName}
              onChange={(e) => setBoardName(e.target.value)}
              placeholder="Add board title"
              className="w-full px-3 py-2 bg-white border-0 rounded text-sm text-gray-700 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-300"
              required
              autoFocus
            />
          </div>

          <div className="mb-4">
            <p className="text-sm text-white">
              {authStore.currentOrganization?.displayName}
            </p>
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-center">
            <button
              type="submit"
              disabled={!boardName.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed rounded transition-colors duration-200"
            >
              Create Board
            </button>
          </div>
        </form>
      </div>
    </div>
  );
});

export default CreateBoardModal;
