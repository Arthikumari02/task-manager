import React, { useState, useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { useNavigate } from 'react-router-dom';
import Icon from '../assets/icons';
import Header from './Header/Header';
import CreateBoardModal from './Models/CreateBoardModal';
import CreateOrganizationModal from './Models/CreateOrganizationModal';
import Loading from './Loading';
import { useOrganizationsStore, useBoardsStore, useAuth } from '../contexts';
import { useFetchOrganizations } from '../hooks/APIs/FetchOrganizations';
import { useFetchBoards } from '../hooks/APIs/FetchBoards';
import { TrelloBoard } from '../types';
import { BoardModel } from '../models';

const Dashboard: React.FC = observer(() => {
  const navigate = useNavigate();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreateOrgModalOpen, setIsCreateOrgModalOpen] = useState(false);

  const { currentOrganization, isLoading: orgLoading } = useOrganizationsStore();
  const { isLoading: boardsLoading } = useBoardsStore();

  // Initialize data on component mount
  const fetchOrganizations = useFetchOrganizations();
  useEffect(() => {
    fetchOrganizations();
  }, [fetchOrganizations]);

  // Fetch user info on mount if authenticated
  const { fetchUserInfo } = useAuth();
  useEffect(() => {
    if (fetchUserInfo) {
      fetchUserInfo();
    }
  }, []);

  // Fetch boards when current organization changes
  useEffect(() => {
    if (currentOrganization) {
      useFetchBoards()(currentOrganization.id);
    }
  }, [currentOrganization]);

  const handleBoardClick = (boardId: string) => {
    navigate(`/board/${boardId}`);
  };

  const isLoading = orgLoading || boardsLoading;
  const currentBoards = useBoardsStore().currentOrganizationBoards;

  return (
    <div className="min-h-screen bg-[#0079BF]">
      <Header
        title="Task Manager"
        currentPage="dashboard"
        showSearch={true}
        showNavigation={true}
      />

      <main className="flex flex-col item-center px-4 py-6">
        {/* Workspace Header */}
        <div className="flex items-center justify-center mb-8 w-full max-w-6xl mx-auto">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-orange-500 rounded flex items-center justify-center">
              <span className="text-white font-bold text-xl">
                {currentOrganization?.displayName?.charAt(0)?.toUpperCase() || 'P'}
              </span>
            </div>
            <h1 className="text-white text-xl font-semibold">
              {currentOrganization?.displayName || ''}
            </h1>
          </div>

          {/* Create New Organization Button - Changed to + icon */}
          <button
            onClick={() => setIsCreateOrgModalOpen(true)}
            className="absolute right-4 h-10 hidden sm:inline-flex items-center justify-center bg-blue-500 hover:bg-blue-600 rounded-sm text-white px-4 transition-colors duration-200 shadow-lg"
            title="Create New Organization"
          >
            Create New Organization
          </button>
          <button
            onClick={() => setIsCreateOrgModalOpen(true)}
            className="w-10 h-10 md:hidden bg-blue-500 hover:bg-blue-600 rounded-full flex items-center justify-center text-white transition-colors duration-200 shadow-lg"
            title="Create New Organization"
          >
            <Icon type="plus" className="w-5 h-5" />
          </button>
        </div>

        {/* Boards Section */}
        <div className="w-full flex max-w-6xl mx-auto">
          {/* Loading State */}
          {isLoading ? (
            <Loading message="Loading" size="large" className="w-full flex items-center justify-center" />
          ) : (
            /* Empty State or Boards Display */
            currentBoards.length === 0 ? (
              <div className="w-full flex flex-col justify-start">
                <div className="flex items-center text-white mb-6">
                  <Icon type="board" size={22} />
                  <span className="text-lg">You Don't have any board in workspace</span>
                </div>

                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="w-60 h-20 bg-white hover:bg-blue-600 text-black hover:text-white px-6 py-3 rounded transition-colors duration-200 flex items-center space-x-2"
                >
                  <Icon type="plus" className="w-5 h-5" />
                  <span>Create new board</span>
                </button>
              </div>
            ) : (
              <div>
                {/* Section Header */}
                <div className="flex items-center text-white mb-6">
                  <Icon type="user" size={32} color="white" />
                  <h2 className="text-lg font-medium ml-2">Your Workspace boards</h2>
                </div>

                {/* Boards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                    className="w-60 h-20 bg-white hover:bg-[#2FA9F1] hover:text-white text-gray-600 p-6 rounded-sm transition-colors duration-200 flex items-center justify-center space-x-2 min-h-[120px]"
                  >
                    <Icon type="plus" className="w-6 h-6" />
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

      {/* Create Organization Modal */}
      <CreateOrganizationModal
        isOpen={isCreateOrgModalOpen}
        onClose={() => setIsCreateOrgModalOpen(false)}
      />
    </div>
  );
});

export default Dashboard;
