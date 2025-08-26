import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';
import Icon from '../../assets/icons';
import { useNavigate } from 'react-router-dom';
import { useOrganizations, useBoardsStore } from '../../contexts';

interface CreateBoardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CreateBoardModal: React.FC<CreateBoardModalProps> = observer(({ isOpen, onClose }) => {
  const [boardName, setBoardName] = useState('');
  const navigate = useNavigate();
  const { currentOrganization } = useOrganizations();
  const { createBoard, isCreating } = useBoardsStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const handleCreateBoard = async () => {
      if (!boardName.trim() || !currentOrganization) return;

      const newBoard = await createBoard(boardName.trim(), currentOrganization.id);
      if (newBoard) {
        setBoardName('');
        onClose();
        navigate(`/board/${newBoard.id}`);
      }
    };
    handleCreateBoard();
  };

  const handleClose = () => {
    setBoardName('');
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
              <Icon type="close" className="w-5 h-5" />
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

            {currentOrganization ? (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Organization
                </label>
                <div className="px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700">
                  {currentOrganization.displayName}
                </div>
              </div>
            ) : null}

            {/* Modal Footer */}
            <div className="flex justify-start">
              <button
                type="submit"
                disabled={!boardName.trim() || isCreating}
                className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${isCreating
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                  }`}
              >
                {isCreating ? (
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

      {/* Mobile: Bottom sheet */}
      <div className="md:hidden flex items-end min-h-screen">
        <div className="flex flex-col bg-white w-full shadow-xl animate-in slide-in-from-bottom duration-300">
          <button
            onClick={handleClose}
            className="text-gray-500 self-end p-2 hover:text-gray-700 transition-colors duration-200"
          >
            <Icon type="close" className="w-6 h-6" />
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

            {currentOrganization ? (
              <div className="mb-6">
                <label className="block text-base font-semibold text-gray-900 mb-2">
                  Organization
                </label>
                <div className="px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700">
                  {currentOrganization.displayName}
                </div>
              </div>
            ) : null}

            {/* Mobile Footer */}
            <div className="space-y-3 flex justify-start">
              <button
                type="submit"
                disabled={!boardName.trim() || isCreating}
                className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${isCreating
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                  }`}
              >
                {isCreating ? (
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
