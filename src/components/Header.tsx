import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import { useAuth } from '../contexts/AuthContext';
import CreateBoardModal from './CreateBoardModal';
import CreateOrganizationModal from './CreateOrganizationModal';
import OrganizationDropdown from './OrganizationDropdown';
import BoardDropdown from './BoardDropdown';
import SearchBar from './SearchBar';
import UserProfile from './UserProfile';

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
  const { logout } = useAuth();

  // State for UI components
  const [isCreateBoardModalOpen, setIsCreateBoardModalOpen] = useState(false);
  const [isCreateOrgModalOpen, setIsCreateOrgModalOpen] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isOrgDropdownOpen, setIsOrgDropdownOpen] = useState(false);
  const [isBoardDropdownOpen, setIsBoardDropdownOpen] = useState(false);

  // Handle logout
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Toggle mobile search
  const toggleMobileSearch = () => {
    setShowMobileSearch(!showMobileSearch);
  };

  return (
    <header className="bg-[#026AA7] text-white">
      <div className="w-full px-4">
        <div className="flex items-center justify-between h-14">
          {/* Left Side - Home Icon and Dropdowns */}
          <div className="flex items-center space-x-2">
            {/* Home Icon */}
            <div
              className="p-2 cursor-pointer  bg-[#4E97C2] rounded "
              onClick={() => navigate('/')}
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
              </svg>
            </div>

            {/* Organization Dropdown */}
            <OrganizationDropdown
              isOpen={isOrgDropdownOpen}
              onToggle={() => setIsOrgDropdownOpen(!isOrgDropdownOpen)}
              onCreateOrganization={() => setIsCreateOrgModalOpen(true)}
            />

            {/* Board Dropdown */}
            <BoardDropdown
              isOpen={isBoardDropdownOpen}
              onToggle={() => setIsBoardDropdownOpen(!isBoardDropdownOpen)}
              onCreateBoard={() => setIsCreateBoardModalOpen(true)}
            />
          </div>

          {/* Middle - App Title */}
          <div className="hidden md:flex items-center justify-center">
            <div className="text-xl font-medium">
              <span className="font-cursive">{title}</span>
            </div>
          </div>

          {/* Right Side - Search and User Profile */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Search Bar - Desktop */}
            {showSearch && (
              <div className="hidden md:block">
                <div className="relative bg-[#4E97C2] rounded overflow-hidden">
                  <SearchBar
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    showSearchResults={showSearchResults}
                    setShowSearchResults={setShowSearchResults}
                  />
                </div>
              </div>
            )}

            {/* Search Toggle - Mobile */}
            {showSearch && (
              <div className="md:hidden">
                <button
                  onClick={toggleMobileSearch}
                  className="p-2 rounded hover:bg-[#4E97C2] transition duration-200"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </div>
            )}

            {/* Log Out Button */}
            <button
              onClick={handleLogout}
              className="px-3 py-1 bg-[#4E97C2] hover:bg-[#3d86b1] rounded text-sm font-medium transition duration-200"
            >
              Log Out
            </button>

            {/* User Profile */}
            <UserProfile onLogout={handleLogout} />
          </div>
        </div>

        {/* Mobile Search Bar */}
        {showSearch && showMobileSearch && (
          <div className="md:hidden py-2 pb-3">
            <SearchBar
              isMobile={true}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              showSearchResults={showSearchResults}
              setShowSearchResults={setShowSearchResults}
              onMobileToggle={toggleMobileSearch}
            />
          </div>
        )}

        {/* Mobile Navigation */}
        <div className="md:hidden py-2 border-t border-[#4E97C2]">
          <div className="flex items-center space-x-4">
            <OrganizationDropdown
              isMobile={true}
              isOpen={isOrgDropdownOpen}
              onToggle={() => setIsOrgDropdownOpen(!isOrgDropdownOpen)}
              onCreateOrganization={() => setIsCreateOrgModalOpen(true)}
            />
            <BoardDropdown
              isMobile={true}
              isOpen={isBoardDropdownOpen}
              onToggle={() => setIsBoardDropdownOpen(!isBoardDropdownOpen)}
              onCreateBoard={() => setIsCreateBoardModalOpen(true)}
            />
          </div>
        </div>
      </div>

      {/* Modals */}
      {isCreateOrgModalOpen && (
        <CreateOrganizationModal
          isOpen={isCreateOrgModalOpen}
          onClose={() => setIsCreateOrgModalOpen(false)}
        />
      )}

      {isCreateBoardModalOpen && (
        <CreateBoardModal
          isOpen={isCreateBoardModalOpen}
          onClose={() => setIsCreateBoardModalOpen(false)}
        />
      )}
    </header>
  );
});

export default Header;
