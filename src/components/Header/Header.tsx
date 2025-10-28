import React, { useState, useEffect } from 'react';
import Icon from '../../assets/icons';
import { useNavigate } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import { useAuthStore } from '../../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
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
  const { t, i18n } = useTranslation();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  const [isCreateBoardModalOpen, setIsCreateBoardModalOpen] = useState(false);
  const [isCreateOrgModalOpen, setIsCreateOrgModalOpen] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isOrgDropdownOpen, setIsOrgDropdownOpen] = useState(false);
  const [isMobileOrgDropdownOpen, setIsMobileOrgDropdownOpen] = useState(false);
  const [isBoardDropdownOpen, setIsBoardDropdownOpen] = useState(false);
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (isOrgDropdownOpen && !target.closest('.organization-dropdown')) {
        setIsOrgDropdownOpen(false);
      }
      if (isBoardDropdownOpen && !target.closest('.board-dropdown')) {
        setIsBoardDropdownOpen(false);
      }
      if (isLangDropdownOpen && !target.closest('.language-dropdown')) {
        setIsLangDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOrgDropdownOpen, isBoardDropdownOpen, isLangDropdownOpen]);

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
              <span className="font-cursive">{t('app.title')}</span>
            </div>
          </div>

          {/* Right Side - Language, Search and User Profile */}
          <div className="flex items-center space-x-2">
            {/* Language Selector Dropdown - Desktop Only */}
            <div className="hidden md:block relative">
              <button
                onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
                className="flex items-center text-white hover:bg-[#4E97C2] p-1.5 rounded-sm transition-colors language-dropdown"
                title="Change language"
              >
                <span className="text-xs font-medium">{i18n.language.toUpperCase()}</span>
                <Icon type="chevronDown" className="w-3 h-3 ml-1" />
              </button>

              {/* Dropdown menu */}
              {isLangDropdownOpen && (
                <div className="absolute right-0 mt-1 w-32 bg-white rounded-sm shadow-lg z-50 language-dropdown">
                  <div className="py-1">
                    <button
                      onClick={() => {
                        changeLanguage('en');
                        setIsLangDropdownOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm ${i18n.language === 'en' ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'}`}
                    >
                      EN - English
                    </button>
                    <button
                      onClick={() => {
                        changeLanguage('hi');
                        setIsLangDropdownOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm ${i18n.language === 'hi' ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'}`}
                    >
                      HI - हिंदी
                    </button>
                    <button
                      onClick={() => {
                        changeLanguage('te');
                        setIsLangDropdownOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm ${i18n.language === 'te' ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'}`}
                    >
                      TE - తెలుగు
                    </button>
                  </div>
                </div>
              )}
            </div>
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
              className="p-2 cursor-pointer bg-[#4E97C2] rounded-sm flex items-center justify-center w-7 h-7"
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
                className="p-2 cursor-pointer bg-[#4E97C2] rounded-sm flex items-center justify-center w-7 h-7"
                onClick={toggleMobileSearch}
              >
                <Icon type="search" className="w-4 h-4" />
              </div>
            )}
          </div>

          {/* Middle - App Title */}
          <div className="flex items-center justify-center mx-1">
            <div className="text-[13px] sm:text-xl font-bold">
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
