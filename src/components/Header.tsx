import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useOrganizations } from '../contexts/OrganizationContext';
import { useBoards } from '../contexts/BoardContext';
import { TrelloOrganization } from '../types';
import CreateBoardModal from './CreateBoardModal';

interface HeaderProps {
  title?: string;
  showSearch?: boolean;
  showNavigation?: boolean;
  currentPage?: 'dashboard' | 'boards' | 'tasks' | 'profile';
}

const Header: React.FC<HeaderProps> = observer(({
  title = 'Task Manager',
  showSearch = true,
}) => {
  const navigate = useNavigate();
  const { logout, userInfo } = useAuth();
  const { organizations, currentOrganization, setCurrentOrganization } = useOrganizations();
  const { currentOrganizationBoards } = useBoards();
  const [searchQuery, setSearchQuery] = useState('');
  const [isOrgDropdownOpen, setIsOrgDropdownOpen] = useState(false);
  const [isBoardDropdownOpen, setIsBoardDropdownOpen] = useState(false);
  const [isCreateBoardModalOpen, setIsCreateBoardModalOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleHomeClick = () => {
    navigate('/');
  };

  const handleOrganizationChange = (organization: TrelloOrganization) => {
    setCurrentOrganization(organization);
    setIsOrgDropdownOpen(false);
  };

  const handleBoardNavigation = (boardId: string) => {
    navigate(`/board/${boardId}`);
    setIsBoardDropdownOpen(false);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement search functionality
    console.log('Searching for:', searchQuery);
  };

  return (
    <header className="bg-[#0067A3] shadow-sm sticky top-0 z-50">
      <div className="px-2 sm:px-4">
        <div className="flex items-center justify-between h-12 sm:h-14">
          {/* Left Section - Home Icon and Organization Dropdown */}
          <div className="flex items-center space-x-1 sm:space-x-2">
            <button 
              onClick={handleHomeClick}
              className="bg-transparent p-1.5 sm:p-2 hover:bg-[#0079BF] rounded transition-colors duration-200"
            >
              <img src="/Home.png" alt="Home" className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
            
            {/* Organization Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsOrgDropdownOpen(!isOrgDropdownOpen)}
                className="flex items-center space-x-1 px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-medium text-white bg-[#4E97C2] hover:bg-[#4E97C2] rounded transition-colors duration-200"
              >
                <span className="truncate max-w-[80px] sm:max-w-none">{currentOrganization?.displayName || 'Organization'}</span>
                <svg className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Organization Dropdown Menu - Desktop */}
              {isOrgDropdownOpen && (
                <>
                  {/* Mobile Bottom Sheet */}
                  <div className="fixed inset-0 z-50 md:hidden">
                    {/* Backdrop */}
                    <div 
                      className="absolute inset-0 bg-black bg-opacity-50 transition-opacity duration-300"
                      onClick={() => setIsOrgDropdownOpen(false)}
                    />
                    
                    {/* Bottom Sheet */}
                    <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-lg shadow-xl transform transition-transform duration-300 ease-out translate-y-0 animate-slide-up">
                      {/* Handle Bar */}
                      <div className="flex justify-center pt-3 pb-2">
                        <div className="w-8 h-1 bg-gray-300 rounded-full"></div>
                      </div>
                      
                      {/* Header */}
                      <div className="flex items-center justify-between px-4 pb-3 border-b border-gray-200">
                        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">WORKSPACE</h2>
                        <button
                          onClick={() => setIsOrgDropdownOpen(false)}
                          className="p-1 hover:bg-gray-100 rounded-full"
                        >
                          <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                      
                      {/* Workspace List */}
                      <div className="max-h-96 overflow-y-auto">
                        {organizations.map((org) => (
                          <button
                            key={org.id}
                            onClick={() => handleOrganizationChange(org)}
                            className={`w-full text-left p-4 flex items-center space-x-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 ${
                              currentOrganization?.id === org.id ? 'bg-blue-50' : ''
                            }`}
                          >
                            <div className={`w-8 h-8 rounded flex items-center justify-center text-white font-bold text-sm ${
                              currentOrganization?.id === org.id ? 'bg-blue-500' : 'bg-blue-400'
                            }`}>
                              {org.displayName.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-gray-900 font-medium">{org.displayName}</span>
                          </button>
                        ))}
                      </div>
                      
                      {/* Bottom padding for safe area */}
                      <div className="h-4"></div>
                    </div>
                  </div>

                  {/* Desktop Dropdown */}
                  <div className="absolute left-0 mt-2 w-64 bg-white rounded-sm shadow-lg border border-gray-200 py-1 z-50 hidden md:block">
                    <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Organizations</p>
                      <button
                        onClick={() => setIsOrgDropdownOpen(false)}
                        className="p-1 hover:bg-gray-100 rounded-full"
                      >
                        <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    {organizations.map((org) => (
                      <button
                        key={org.id}
                        onClick={() => handleOrganizationChange(org)}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center space-x-3 ${
                          currentOrganization?.id === org.id ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                        }`}
                      >
                        <div className={`w-3 h-3 rounded-full ${
                          currentOrganization?.id === org.id ? 'bg-blue-500' : 'bg-gray-300'
                        }`}></div>
                        <span>{org.displayName}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          
          {/* Center Section - Boards Dropdown */}
          <div className="flex items-center relative">
            <button 
              onClick={() => setIsBoardDropdownOpen(!isBoardDropdownOpen)}
              className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-1 text-white bg-[#4E97C2] hover:bg-[#4E97C2] rounded transition-colors duration-200"
            >
              <img src="/boardlogo.png" alt="Boards" className="w-5 h-5 sm:w-6 sm:h-6" />
              <span className="text-xs sm:text-sm font-medium hidden sm:inline">Boards</span>
              <svg className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Boards Dropdown Menu */}
            {isBoardDropdownOpen && (
              <>
                {/* Backdrop for desktop */}
                <div 
                  className="fixed inset-0 z-40 hidden md:block"
                  onClick={() => setIsBoardDropdownOpen(false)}
                />
                
                {/* Mobile Bottom Sheet */}
                <div className="fixed inset-0 z-50 md:hidden">
                  {/* Backdrop */}
                  <div 
                    className="absolute inset-0 bg-black bg-opacity-50 transition-opacity duration-300"
                    onClick={() => setIsBoardDropdownOpen(false)}
                  />
                  
                  {/* Bottom Sheet */}
                  <div className="absolute bottom-0 left-0 right-0 bg-white shadow-xl transform transition-transform duration-300 ease-out translate-y-0 animate-slide-up">
                    {/* Handle Bar */}
                    <div className="flex justify-center pt-2 pb-1">
                      <div className="w-7 h-1 bg-gray-300 rounded-full"></div>
                    </div>
                    
                    {/* Header */}
                    <div className="flex justify-end px-3 pb-2">
                      <button
                        onClick={() => setIsBoardDropdownOpen(false)}
                        className="p-1 hover:bg-gray-100 rounded-full"
                      >
                        <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    
                    {/* Boards List */}
                    <div className="max-h-96 overflow-y-auto">
                      {currentOrganizationBoards.length > 0 ? (
                        currentOrganizationBoards.map((board) => (
                          <button
                            key={board.id}
                            onClick={() => handleBoardNavigation(board.id)}
                            className="w-full text-left p-3 flex items-center space-x-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                          >
                            <div className="w-8 h-8 rounded bg-blue-500 flex items-center justify-center text-white font-bold text-sm">
                              {board.name.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-gray-900 font-medium">{board.name}</span>
                          </button>
                        ))
                      ) : (
                        <div className="p-3 text-center text-gray-500">
                          No boards available
                        </div>
                      )}
                      
                      {/* Create New Board Option */}
                      <button
                        onClick={() => {
                          setIsBoardDropdownOpen(false);
                          setIsCreateBoardModalOpen(true);
                        }}
                        className="w-full text-left p-3 flex items-center space-x-2 hover:bg-gray-50 border-t border-gray-200 text-blue-600"
                      >
                        <div className="w-7 h-7 rounded bg-blue-100 flex items-center justify-center">
                          <svg className="w-3 h-3 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                        </div>
                        <span className="font-medium">Create new board</span>
                      </button>
                    </div>
                    
                    {/* Bottom padding for safe area */}
                    <div className="h-4"></div>
                  </div>
                </div>

                {/* Desktop Dropdown */}
                <div className="absolute left-0 top-full mt-2 w-80 bg-white rounded-sm shadow-lg border border-gray-200 py-1 z-50 hidden md:block">
                  <div className="flex items-center justify-end px-4 py-2 border-b border-gray-100">
                    <button
                      onClick={() => setIsBoardDropdownOpen(false)}
                      className="p-1 hover:bg-gray-100 rounded-full"
                    >
                      <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <div className="max-h-48 overflow-y-auto">
                    {currentOrganizationBoards.length > 0 ? (
                      currentOrganizationBoards.map((board) => (
                        <button
                          key={board.id}
                          onClick={() => handleBoardNavigation(board.id)}
                          className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center space-x-3 text-gray-700"
                        >
                          <div className="w-6 h-6 rounded bg-blue-500 flex items-center justify-center text-white font-bold text-xs">
                            {board.name.charAt(0).toUpperCase()}
                          </div>
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
                    onClick={() => {
                      setIsBoardDropdownOpen(false);
                      setIsCreateBoardModalOpen(true);
                    }}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center space-x-3 text-blue-600 border-t border-gray-100"
                  >
                    <div className="w-6 h-6 rounded bg-blue-100 flex items-center justify-center">
                      <svg className="w-3 h-3 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </div>
                    <span>Create new board</span>
                  </button>
                </div>
              </>
            )}
          </div>
          </div>

          <h1 className="text-base sm:text-lg font-bold font-pacifico text-white hidden md:block">{title}</h1>

          {/* Right Section - Search, User, Logout */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Search Bar */}
            {showSearch && (
              <form onSubmit={handleSearch} className="hidden lg:block">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search"
                    className="block w-32 sm:w-48 pl-10 pr-3 py-1.5 border-0 rounded text-sm bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-300"
                  />
                </div>
              </form>
            )}

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="text-white hover:bg-blue-700 px-2 sm:px-3 py-1 sm:py-1.5 rounded text-xs sm:text-sm font-medium transition duration-200"
            >
              Log Out
            </button>
            {/* User Avatar (non-clickable) */}
            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-white rounded-full flex items-center justify-center text-blue-600 text-xs sm:text-sm font-medium">
              {userInfo?.initials || 'U'}
            </div>
          </div>
        </div>
      </div>

      {/* Create Board Modal */}
      <CreateBoardModal 
        isOpen={isCreateBoardModalOpen}
        onClose={() => setIsCreateBoardModalOpen(false)}
      />
    </header>
  );
});

export default Header;
