import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { useNavigate } from 'react-router-dom';
import Header from './Header';
import CreateBoardModal from './CreateBoardModal';
import { authStore } from '../stores/AuthStore';

const Boards: React.FC = observer(() => {
  const navigate = useNavigate();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const currentBoards = authStore.currentOrganizationBoards;
  const isLoading = authStore.isLoadingBoards;
  const error = authStore.boardsError;

  const getBoardColor = (index: number) => {
    const colors = ['bg-blue-500', 'bg-green-500', 'bg-red-500', 'bg-purple-500', 'bg-yellow-500', 'bg-indigo-500'];
    return colors[index % colors.length];
  };

  const getBoardBackground = (board: any) => {
    if (board.prefs?.backgroundColor) {
      return { backgroundColor: board.prefs.backgroundColor };
    }
    if (board.prefs?.backgroundImage) {
      return { backgroundImage: `url(${board.prefs.backgroundImage})` };
    }
    return {};
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        title="Trello Boards"
        currentPage="boards"
        showSearch={true}
        showNavigation={true}
      />

      <main className="max-w-7xl mx-auto py-4 sm:py-6 px-4 sm:px-6 lg:px-8">
        <div className="py-4 sm:py-6">
          <div className="mb-4 sm:mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
              {authStore.currentOrganization?.displayName} Boards
            </h2>
            <p className="text-sm sm:text-base text-gray-600">Manage and organize your boards in this organization</p>
          </div>

          {/* Organization Selector */}
          <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
            <label htmlFor="org-select" className="text-gray-700 font-medium text-sm sm:text-base">
              Organization:
            </label>
            <select
              id="org-select"
              value={authStore.currentOrganization?.id || ''}
              onChange={(e) => {
                const selectedOrg = authStore.organizations.find(
                  (org) => org.id === e.target.value
                );
                if (selectedOrg) {
                  authStore.setCurrentOrganization(selectedOrg);
                  authStore.fetchBoardsForOrganization(selectedOrg.id);
                }
              }}
              className="w-full sm:w-auto px-3 py-2 border rounded-md bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
            >
              {authStore.organizations.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.displayName}
                </option>
              ))}
            </select>
          </div>

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex">
                <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Error loading boards</h3>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-600">Loading...</p>
            </div>
          )}

          {/* Board Grid - Show when not loading */}
          {!isLoading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {/* Create New Board Card - Always visible when not loading */}
              <div 
                onClick={() => setIsCreateModalOpen(true)}
                className="bg-white rounded-lg shadow-sm border-2 border-dashed border-gray-300 hover:border-blue-400 transition-colors duration-200 p-4 sm:p-6 flex flex-col items-center justify-center min-h-[160px] sm:min-h-[200px] cursor-pointer group"
              >
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-full flex items-center justify-center mb-3 sm:mb-4 group-hover:bg-blue-200 transition-colors duration-200">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">Create New Board</h3>
                <p className="text-xs sm:text-sm text-gray-500 text-center">Start organizing your tasks with a new board</p>
              </div>

              {/* Render actual boards */}
              {currentBoards.map((board, index) => (
                <div
                  key={board.id}
                  onClick={() => navigate(`/board/${board.id}`)}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200 p-4 sm:p-6 cursor-pointer group min-h-[160px] sm:min-h-[200px] flex flex-col"
                  style={getBoardBackground(board)}
                >
                  <div className="flex-1">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors duration-200">
                      {board.name}
                    </h3>
                  </div>
                  <div className="flex items-center justify-between mt-auto">
                    <span className={`inline-block w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full ${getBoardColor(index)}`}></span>
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 group-hover:text-blue-500 transition-colors duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty State - Only show when no boards exist and not loading */}
          {!isLoading && currentBoards.length === 0 && !error && (
            <div className="text-center py-12 mt-8">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <img src="/Icon.png" alt="Task Manager Icon" className="w-8 h-8 sm:w-10 sm:h-10" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                You Don't have any board in workspace
              </h3>
              <p className="text-gray-600 mb-6">
                Get started by creating your first board in {authStore.currentOrganization?.displayName}
              </p>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="bg-white hover:bg-[#2FA9F1] text-white px-6 py-3 rounded-lg transition duration-200 flex items-center space-x-2 mx-auto"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>Create new board</span>
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Create Board Modal */}
      <CreateBoardModal 
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </div>
  );
});

export default Boards;
