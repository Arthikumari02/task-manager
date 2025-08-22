import React, { useState, useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { useNavigate } from 'react-router-dom';
import Header from './Header';
import CreateBoardModal from './CreateBoardModal';
import Loading from './Loading';
import { useOrganizations, useBoards, useAuth } from '../contexts';
import { TrelloBoard } from '../types';

const Dashboard: React.FC = observer(() => {
  const navigate = useNavigate();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  
  const { currentOrganization, fetchOrganizations, isLoading: orgLoading } = useOrganizations();
  const { boards, fetchBoardsForOrganization, isLoading: boardsLoading } = useBoards();

  // Initialize data on component mount
  useEffect(() => {
    fetchOrganizations();
  }, [fetchOrganizations]);

  // Fetch user info on mount if authenticated
  const { fetchUserInfo } = useAuth();
  useEffect(() => {
    if (fetchUserInfo) {
      fetchUserInfo();
    }
  }, [fetchUserInfo]);

  // Fetch boards when current organization changes
  useEffect(() => {
    if (currentOrganization) {
      fetchBoardsForOrganization(currentOrganization.id);
    }
  }, [currentOrganization, fetchBoardsForOrganization]);

  const handleBoardClick = (boardId: string) => {
    navigate(`/board/${boardId}`);
  };

  const isLoading = orgLoading || boardsLoading;
  const currentBoards = boards;

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
              {currentOrganization?.displayName || 'William John\'s Workspace'}
            </h1>
          </div>
        </div>

        {/* Boards Section */}
        <div className="max-w-6xl mx-auto">
          {/* Loading State */}
          {isLoading ? (
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
            <div>
              {/* Section Header */}
              <div className="flex items-center text-white mb-6">
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" clipRule="evenodd"
                    d="M15.9997 5.33301C13.053 5.33301 10.6663 7.71967 10.6663 10.6663C10.6663 13.613 13.053 15.9997 15.9997 15.9997C18.9463 15.9997 21.333 13.613 21.333 10.6663C21.333 7.71967 18.9463 5.33301 15.9997 5.33301ZM18.7997 10.6663C18.7997 9.11967 17.5463 7.86634 15.9997 7.86634C14.453 7.86634 13.1997 9.11967 13.1997 10.6663C13.1997 12.213 14.453 13.4663 15.9997 13.4663C17.5463 13.4663 18.7997 12.213 18.7997 10.6663ZM24.133 22.6663C24.133 21.813 19.9597 19.8663 15.9997 19.8663C12.0397 19.8663 7.86634 21.813 7.86634 22.6663V24.133H24.133V22.6663ZM5.33301 22.6663C5.33301 19.1197 12.4397 17.333 15.9997 17.333C19.5597 17.333 26.6663 19.1197 26.6663 22.6663V25.333C26.6663 26.0663 26.0663 26.6663 25.333 26.6663H6.66634C5.93301 26.6663 5.33301 26.0663 5.33301 25.333V22.6663Z"
                    fill="white"/>
                </svg>
                <h2 className="text-lg font-medium">Your Workspace boards</h2>
              </div>

              {/* Boards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Existing Boards */}
                {currentBoards.map((board: TrelloBoard) => (
                  <div
                    key={board.id}
                    className="bg-white rounded-sm p-6 cursor-pointer hover:shadow-lg transition-all duration-200 min-h-[120px] flex items-center justify-center"
                    onClick={() => handleBoardClick(board.id)}
                  >
                    <h3 className="font-medium text-[#0079BF] text-center text-lg">{board.name}</h3>
                  </div>
                ))}

                {/* Create New Board Card - Always show in the same row */}
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="bg-white hover:bg-[#2FA9F1] hover:text-white text-gray-600 p-6 rounded-sm transition-colors duration-200 flex items-center justify-center space-x-2 min-h-[120px]"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span className="font-medium">Create new board</span>
                </button>
              </div>
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
