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
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50">
      {/* Desktop: Center modal */}
      <div className="hidden md:flex items-center justify-center min-h-screen">
        <div className="bg-white rounded-sm shadow-xl max-w-sm w-full mx-4 animate-in fade-in zoom-in duration-200">
          {/* Modal Header */}
          <div className="flex items-center justify-between p-4">
            <div></div>
            <button
              onClick={handleClose}
              className="text-black hover:text-gray-200 transition-colors duration-200"
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
                className="w-full px-3 py-2 bg-[#A7B1BF] border-0 rounded text-sm text-white placeholder-white focus:outline-none"
                required
                autoFocus
              />
            </div>

            <div className="mb-4">
              <p className="text-sm font-bold text-black">
                {authStore.currentOrganization?.displayName}
              </p>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-start">
              <button
                type="submit"
                disabled={!boardName.trim() || authStore.isCreatingBoard}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed rounded transition-colors duration-200 flex items-center space-x-2"
              >
                {authStore.isCreatingBoard ? (
                  <>
                    <div className="w-4 h-4 border border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Creating...</span>
                  </>
                ) : (
                  <span>Create Board</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Mobile: Bottom sheet */}
      <div className="md:hidden flex items-end min-h-screen">
        <div className="flex flex-col bg-white w-full shadow-xl animate-in slide-in-from-bottom duration-300">
          <button
            onClick={handleClose}
            className="text-gray-500 self-end p-2 hover:text-gray-700 transition-colors duration-200"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
          {/* Mobile Body */}
          <form onSubmit={handleSubmit} className="p-6 pb-8">
            <div className="mb-6">
              <input
                type="text"
                id="mobileBoardName"
                value={boardName}
                onChange={(e) => setBoardName(e.target.value)}
                placeholder="Add board title"
                className="w-full px-2 py-1 bg-[#A7B1BF] border-0 rounded-lg text-base text-white placeholder-white focus:outline-none"
                required
                autoFocus
              />
            </div>

            <div className="mb-6">
              <p className="text-base font-semibold text-gray-900">
                {authStore.currentOrganization?.displayName}
              </p>
            </div>

            {/* Mobile Footer */}
            <div className="space-y-3 flex justify-start">
              <button
                type="submit"
                disabled={!boardName.trim() || authStore.isCreatingBoard}
                className="w-50 px-3 py-2 text-base font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
              >
                {authStore.isCreatingBoard ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Creating...</span>
                  </>
                ) : (
                  <span>Create Board</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
});

export default CreateBoardModal;
