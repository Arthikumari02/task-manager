import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { useNavigate } from 'react-router-dom';
import Header from './Header';
import CreateBoardModal from './CreateBoardModal';
import Loading from './Loading';
import { authStore } from '../stores/AuthStore';

const Dashboard: React.FC = observer(() => {
  const navigate = useNavigate();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const currentBoards = authStore.currentOrganizationBoards;

  const handleBoardClick = (boardId: string) => {
    navigate(`/board/${boardId}`);
  };

  return (
    <div className="min-h-screen bg-[#0079BF]">
      <Header 
        title="Task Manager"
        currentPage="dashboard"
        showSearch={true}
        showNavigation={true}
      />

      <main className="px-4 py-6">
        {/* Workspace Header */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-orange-500 rounded flex items-center justify-center">
              <span className="text-white font-bold text-lg">W</span>
            </div>
            <h1 className="text-white text-xl font-semibold">
              {authStore.currentOrganization?.displayName || 'William John\'s Workspace'}
            </h1>
          </div>
        </div>

        {/* Boards Section */}
        <div className="max-w-4xl mx-auto">
          {/* Loading State */}
          {authStore.isLoadingBoards ? (
            <Loading message="Loading" size="large" className="text-white" />
          ) : (
          /* Empty State or Boards Display */
          currentBoards.length === 0 ? (
            <div className="text-center">
              <div className="flex items-center justify-center text-white mb-6">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
                <span className="text-lg">You Don't have any board in workspace</span>
              </div>
              
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded transition-colors duration-200 flex items-center space-x-2 mx-auto"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>Create new board</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {/* Create New Board Card */}
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="bg-white hover:bg-[#2FA9F7] text-[black] hover:text-white p-4 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2 min-h-[120px]"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>Create new board</span>
              </button>

              {/* Existing Boards */}
              {currentBoards.map((board) => (
                <div
                  key={board.id}
                  className="flex items-center justify-center bg-white rounded-lg p-4 cursor-pointer hover:shadow-lg transition-shadow duration-200 min-h-[120px]"
                  onClick={() => handleBoardClick(board.id)}
                >
                  <h3 className="font-semibold text-[#2FA9F7] mb-2 line-clamp-2">{board.name}</h3>
                </div>
              ))}
            </div>
          )
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

export default Dashboard;
