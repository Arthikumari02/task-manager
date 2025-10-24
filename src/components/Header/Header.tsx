import React, { useState } from 'react';
import Icon from '../../assets/icons';
import { useNavigate } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import { useAuthStore } from '../../contexts/AuthContext';
import { SearchStoreProvider } from '../../contexts/SearchContext';
import CreateBoardModal from '../Boards/CreateBoardModal';
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
  const { logout } = useAuthStore();

  // State for UI components
  const [isCreateBoardModalOpen, setIsCreateBoardModalOpen] = useState(false);
  const [isCreateOrgModalOpen, setIsCreateOrgModalOpen] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isOrgDropdownOpen, setIsOrgDropdownOpen] = useState(false);
  const [isMobileOrgDropdownOpen, setIsMobileOrgDropdownOpen] = useState(false);
  const [isBoardDropdownOpen, setIsBoardDropdownOpen] = useState(false);
  const [isMobileBoardDropdownOpen, setIsMobileBoardDropdownOpen] = useState(false);

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
      {/* Desktop Header */}
      <div className="hidden md:block w-full px-4">
        <div className="flex items-center justify-between h-14">
          {/* Left Side - Home Icon and Dropdowns */}
          <div className="flex items-center space-x-2">
            {/* Home Icon */}
            <div
              className="p-2 cursor-pointer bg-[#4E97C2] rounded"
              onClick={() => navigate('/')}
            >
              <Icon type="home" className="w-5 h-5" />
            </div>

            {/* Organization Dropdown - Desktop Only */}
            <div>
              <OrganizationDropdown
                isOpen={isOrgDropdownOpen}
                onToggle={() => setIsOrgDropdownOpen(!isOrgDropdownOpen)}
                onCreateOrganization={() => setIsCreateOrgModalOpen(true)}
              />
            </div>

            {/* Board Dropdown - Desktop Only */}
            <div>
              <BoardDropdown
                isOpen={isBoardDropdownOpen}
                onToggle={() => setIsBoardDropdownOpen(!isBoardDropdownOpen)}
                onCreateBoard={() => setIsCreateBoardModalOpen(true)}
              />
            </div>
          </div>

          {/* Middle - App Title */}
          <div className="flex items-center justify-center">
            <div className="text-xl font-medium">
              <span className="font-cursive">{title}</span>
            </div>
          </div>

          {/* Right Side - Search and User Profile */}
          <div className="flex items-center space-x-4">
            {/* Search Bar - Desktop */}
            {showSearch && (
              <div className="relative bg-[#4E97C2] rounded overflow-visible">
                <SearchStoreProvider>
                  <SearchBar
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    showSearchResults={showSearchResults}
                    setShowSearchResults={setShowSearchResults}
                  />
                </SearchStoreProvider>
              </div>
            )}

            {/* User Profile */}
            <UserProfile onLogout={handleLogout} />
          </div>
        </div>
      </div>

      {/* Mobile Header */}
      <div className="md:hidden w-full px-4 py-3">
        {/* Main Mobile Header Row */}
        <div className="flex items-center justify-between">
          {/* Mobile Icon Row */}
          <div className="flex items-center space-x-1">
            {/* Home Icon */}
            <div
              className="p-2 cursor-pointer bg-[#4E97C2] rounded-sm flex items-center justify-center w-8 h-8"
              onClick={() => navigate('/')}
            >
              <Icon type="home" className="w-4 h-4" />
            </div>

            {/* Mobile Dropdowns */}
            <OrganizationDropdown
              isMobile={true}
              isOpen={isMobileOrgDropdownOpen}
              onToggle={() => setIsMobileOrgDropdownOpen(!isMobileOrgDropdownOpen)}
              onCreateOrganization={() => setIsCreateOrgModalOpen(true)}
            />

            <BoardDropdown
              isMobile={true}
              isOpen={isMobileBoardDropdownOpen}
              onToggle={() => setIsMobileBoardDropdownOpen(!isMobileBoardDropdownOpen)}
              onCreateBoard={() => setIsCreateBoardModalOpen(true)}
            />

            {/* Search Icon */}
            {showSearch && (
              <div
                className="p-2 cursor-pointer bg-[#4E97C2] rounded-sm flex items-center justify-center w-8 h-8"
                onClick={toggleMobileSearch}
              >
                <Icon type="search" className="w-4 h-4" />
              </div>
            )}
          </div>

          {/* Middle - App Title */}
          <div className="flex items-center justify-center mx-4">
            <div className="text-[12px] sm:text-xl font-bold">
              <span className="font-cursive">{title}</span>
            </div>
          </div>

          {/* Right Side - User Profile */}
          <div className="flex items-center">
            <UserProfile onLogout={handleLogout} />
          </div>
        </div>

        {/* Mobile Search Bar */}
        {showSearch && showMobileSearch && (
          <div className="md:hidden py-2 pb-3">
            <SearchStoreProvider>
              <SearchBar
                isMobile={true}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                showSearchResults={showSearchResults}
                setShowSearchResults={setShowSearchResults}
                onMobileToggle={toggleMobileSearch}
              />
            </SearchStoreProvider>
          </div>
        )}
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
