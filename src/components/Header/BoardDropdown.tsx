import React, { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { useBoardsStore } from '../../contexts/BoardContext';
import { useNavigate } from 'react-router-dom';
import Icon from '../../assets/icons';

interface BoardDropdownProps {
  isOpen: boolean;
  onToggle: () => void;
  onCreateBoard: () => void;
  isMobile?: boolean;
}

const BoardDropdown: React.FC<BoardDropdownProps> = observer(({
  isOpen,
  onToggle,
  onCreateBoard,
  isMobile = false
}) => {
  const navigate = useNavigate();
  const boardStore = useBoardsStore();
  const { currentOrganizationBoards, isLoading: isLoadingBoards, setCurrentBoard } = boardStore;

  // Handle board selection directly in the component
  const handleBoardSelect = async (boardId: string) => {
    try {
      // Set the current board in the store first
      if (setCurrentBoard) {
        await setCurrentBoard(boardId);
      }

      setTimeout(() => {
        // Navigate to the board - BoardView component will handle loading the data
        navigate(`/board/${boardId}`);
        onToggle(); // Close dropdown after selection
      }, 100);
    } catch (error) {
      console.error('Error selecting board:', error);
      // Still navigate even if there's an error
      navigate(`/board/${boardId}`);
      onToggle();
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.board-dropdown')) {
        onToggle();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onToggle]);

  // State to track if we're on a mobile device
  const [isMobileDevice, setIsMobileDevice] = useState(isMobile);

  // Update mobile detection on window resize
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobileDevice(window.innerWidth < 768 || isMobile);
    };

    // Initial check
    checkIfMobile();

    // Add event listener for window resize
    window.addEventListener('resize', checkIfMobile);

    // Cleanup
    return () => window.removeEventListener('resize', checkIfMobile);
  }, [isMobile]);

  if (isMobileDevice) {
    return (
      <>
        {/* Mobile trigger button */}
        <button
          onClick={onToggle}
          className="bg-[#4E97C2] hover:bg-[#4E97C2] p-2 rounded-sm flex items-center justify-center w-8 h-8 transition duration-200 text-white"
          title="Boards"
        >
          <Icon type="board" />
        </button>

        {/* Mobile dropdown (bottom sheet) */}
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40 md:hidden bg-black bg-opacity-50" onClick={onToggle} />
            <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white shadow-2xl max-h-[80vh] overflow-hidden">
              {/* Header with title and close button */}
              <div className="flex justify-center border-b border-gray-200 py-3 relative">
                <h2 className="text-md text-gray-700 font-medium">Your Workspace boards</h2>
                <button
                  onClick={onToggle}
                  className="absolute right-2 p-2 text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <Icon type="close" />
                </button>
              </div>

              {/* Content */}
              <div className="pb-4 max-h-[70vh] overflow-y-auto">
                <div className={`${currentOrganizationBoards.length > 4 ? 'max-h-[calc(100vh-120px)] overflow-y-auto scrollbar-hide' : ''}`}>
                  {currentOrganizationBoards.length > 0 ? (
                    currentOrganizationBoards.map((board) => (
                      <button
                        key={board.id}
                        onClick={() => handleBoardSelect(board.id)}
                        className="w-full text-left px-4 py-3 text-base text-blue-600 hover:bg-gray-50 flex items-center space-x-3"
                      >
                        <span className="font-medium">{board.name}</span>
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-6 text-base text-gray-500 text-center">
                      No boards available
                    </div>
                  )}

                  {/* Create New Board Option */}
                  <button
                    onClick={onCreateBoard}
                    className="w-full text-left px-4 py-3 text-base hover:bg-gray-50 flex items-center space-x-3 text-blue-600"
                  >
                    <div className="w-6 h-6 rounded bg-blue-100 flex items-center justify-center">
                      <Icon type="plus" className="w-3 h-3 text-blue-600" />
                    </div>
                    <span className="font-medium">Create new board</span>
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </>
    );
  }

  return (
    <div className="relative board-dropdown">
      {/* Desktop trigger button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        className="flex items-center space-x-1 bg-[#4E97C2] hover:bg-[#4E97C2] px-3 py-2 rounded transition duration-200 text-white font-medium"
      >
        <img src="/boardlogo.png" alt="Boards" className="w-4 h-4" />
        <span>Boards</span>
      </button>

      {/* Desktop dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50 overflow-hidden" onClick={e => e.stopPropagation()}>
          <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-100">
            RECENT BOARDS
          </div>
          <div className={`py-1 ${currentOrganizationBoards.length > 4 ? 'max-h-48 overflow-y-auto scrollbar-hide' : ''}`}>
            {isLoadingBoards ? (
              <div className="px-4 py-2 text-sm text-gray-500">Loading boards...</div>
            ) : currentOrganizationBoards.length > 0 ? (
              currentOrganizationBoards.map((board) => (
                <button
                  key={board.id}
                  onClick={() => handleBoardSelect(board.id)}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-3"
                >
                  <div className="w-4 h-4 bg-blue-500 rounded"></div>
                  <span>{board.name}</span>
                </button>
              ))
            ) : (
              <div className="px-4 py-2 text-sm text-gray-500">
                No boards available
              </div>
            )}
          </div>

          {/* Create New Board Option */}
          <button
            onClick={onCreateBoard}
            className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center space-x-3 text-blue-600 border-t border-gray-100"
          >
            <div className="w-6 h-6 rounded bg-blue-100 flex items-center justify-center">
              <Icon type="plus" className="w-3 h-3 text-blue-600" />
            </div>
            <span>Create new board</span>
          </button>
        </div>
      )}
    </div>
  );
});

export default BoardDropdown;