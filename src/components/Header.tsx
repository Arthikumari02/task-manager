import { useState, useEffect, useRef } from 'react';
import { observer } from 'mobx-react-lite';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useOrganizations } from '../contexts/OrganizationContext';
import { useBoards } from '../contexts/BoardContext';
import { useSearch } from '../contexts/SearchContext';
import { TrelloOrganization } from '../types';
import CreateBoardModal from './CreateBoardModal';
import CreateOrganizationModal from './CreateOrganizationModal';
import SearchResults from './SearchResults';

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
  const { organizations, currentOrganization, setCurrentOrganization, isLoading: isLoadingOrgs } = useOrganizations();
  const { currentOrganizationBoards, fetchBoardsForOrganization, isLoading: isLoadingBoards } = useBoards();

  // State for UI
  const [searchQuery, setSearchQuery] = useState('');
  const [isOrgDropdownOpen, setIsOrgDropdownOpen] = useState(false);
  const [isBoardDropdownOpen, setIsBoardDropdownOpen] = useState(false);
  const [isCreateBoardModalOpen, setIsCreateBoardModalOpen] = useState(false);
  const [isCreateOrgModalOpen, setIsCreateOrgModalOpen] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);

  // Debug log for organizations
  useEffect(() => {
    console.log('Organizations in Header:', {
      organizations,
      currentOrganization,
      isLoadingOrgs,
      isOrgDropdownOpen
    });
  }, [organizations, currentOrganization, isLoadingOrgs, isOrgDropdownOpen]);

  // Update current organization on mount and when organizations change
  useEffect(() => {
    console.log('Updating current organization. Current org:', currentOrganization, 'All orgs:', organizations);

    if (organizations.length > 0) {
      // If we don't have a current organization, set the first one
      if (!currentOrganization) {
        console.log('No current organization, setting to first org:', organizations[0]);
        setCurrentOrganization(organizations[0]);
      } else {
        // Check if current organization still exists in the organizations list
        const orgExists = organizations.some(org => org.id === currentOrganization?.id);
        if (!orgExists) {
          console.log('Current org not in list, updating to first org:', organizations[0]);
          setCurrentOrganization(organizations[0]);
        }
      }
    } else if (currentOrganization) {
      // Clear current organization if no organizations are available
      console.log('No organizations available, clearing current org');
      setCurrentOrganization(null);
    }
  }, [organizations, currentOrganization, setCurrentOrganization]);
  const { performSearch, clearSearch, hasResults, isSearching } = useSearch();


  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const mobileSearchInputRef = useRef<HTMLInputElement>(null);

  // Real-time search with shorter debounce
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (searchQuery.trim()) {
      searchTimeoutRef.current = setTimeout(() => {
        performSearch(searchQuery);
        setShowSearchResults(true);
      }, 200); // Reduced debounce time for more responsive search
    } else {
      clearSearch();
      setShowSearchResults(false);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  // Close dropdowns and search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;

      // Check if click is outside organization dropdown
      if (isOrgDropdownOpen && !target.closest('.organization-dropdown')) {
        setIsOrgDropdownOpen(false);
      }

      // Check if click is outside board dropdown
      if (isBoardDropdownOpen && !target.closest('.board-dropdown')) {
        setIsBoardDropdownOpen(false);
      }

      // Check if click is outside search
      if (searchInputRef.current && !searchInputRef.current.contains(target)) {
        setShowSearchResults(false);
      }

      if (mobileSearchInputRef.current && !mobileSearchInputRef.current.contains(target)) {
        setShowSearchResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOrgDropdownOpen, isBoardDropdownOpen]);

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
    // Navigate to the dashboard of the selected workspace
    navigate(`/`);
  };

  const handleBoardNavigation = (boardId: string) => {
    navigate(`/board/${boardId}`);
    setIsBoardDropdownOpen(false);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      performSearch(searchQuery);
      setShowSearchResults(true);
    }
  };

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);

    // Show results immediately if there's a query
    if (value.trim()) {
      setShowSearchResults(true);
    } else {
      setShowSearchResults(false);
    }
  };

  const handleSearchInputFocus = () => {
    if (searchQuery.trim()) {
      setShowSearchResults(true);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    clearSearch();
    setShowSearchResults(false);
  };

  const handleMobileSearchToggle = () => {
    setShowMobileSearch(!showMobileSearch);
    if (!showMobileSearch) {
      // Focus the mobile search input when opening
      setTimeout(() => {
        mobileSearchInputRef.current?.focus();
      }, 100);
    } else {
      // Clear search when closing
      setSearchQuery('');
      clearSearch();
      setShowSearchResults(false);
    }
  };

  return (
    <>
      <header className="bg-[#0067A3] shadow-sm sticky top-0 z-50">
        <div className="px-2 sm:px-4">
          <div className="flex items-center justify-between h-14">
            {/* Desktop Navigation (hidden on mobile) */}
            <div className="hidden md:flex items-center space-x-4">
              {/* Home Button */}
              <button
                onClick={handleHomeClick}
                className="bg-[#4E97C2] hover:bg-[#4E97C2] p-2 rounded transition duration-200 border border-[#0079BF]"
                title="Home"
              >
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </button>

              {/* Organization Dropdown */}
              <div className="relative organization-dropdown">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsOrgDropdownOpen(!isOrgDropdownOpen);
                  }}
                  className="flex items-center space-x-1 bg-[#4E97C2] hover:bg-[#4E97C2] px-3 py-2 rounded transition duration-200 text-white font-medium"
                >
                  <span>{currentOrganization?.displayName || 'Organization'}</span>
                  <svg className={`w-4 h-4 transition-transform ${isOrgDropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {isOrgDropdownOpen && (
                  <div className="absolute top-full left-0 mt-1 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50" onClick={e => e.stopPropagation()}>
                    <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-100">
                      WORKSPACE
                    </div>
                    <div className="py-1">
                      {isLoadingOrgs ? (
                        <div className="px-4 py-2 text-sm text-gray-500">Loading organizations...</div>
                      ) : organizations.length === 0 ? (
                        <div className="px-4 py-2 text-sm text-gray-500">No organizations found</div>
                      ) : (
                        organizations.map((org) => {
                          return (
                            <button
                              key={org.id}
                              onClick={() => handleOrganizationChange(org)}
                              className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center space-x-3 ${currentOrganization?.id === org.id ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                                }`}
                            >
                              <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                              <span>{org.displayName || org.name || 'Unnamed Workspace'}</span>
                            </button>
                          );
                        })
                      )}

                      {/* Create New Organization Option */}
                      <button
                        onClick={() => {
                          setIsOrgDropdownOpen(false);
                          setIsCreateOrgModalOpen(true);
                        }}
                        className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center space-x-3 text-blue-600 border-t border-gray-100"
                      >
                        <div className="w-4 h-4 bg-blue-100 rounded flex items-center justify-center">
                          <svg className="w-2 h-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                        </div>
                        <span>Create new organization</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Boards Dropdown */}
              <div className="relative board-dropdown">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsBoardDropdownOpen(!isBoardDropdownOpen);
                  }}
                  className="flex items-center space-x-1 bg-[#4E97C2] hover:bg-[#4E97C2] px-3 py-2 rounded transition duration-200 text-white font-medium"
                >
                  <img src="/boardlogo.png" alt="Boards" className="w-4 h-4" />
                  <span>Boards</span>
                </button>

                {isBoardDropdownOpen && (
                  <div className="absolute top-full left-0 mt-1 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50" onClick={e => e.stopPropagation()}>
                    <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-100">
                      RECENT BOARDS
                    </div>
                    <div className="py-1">
                      {isLoadingBoards ? (
                        <div className="px-4 py-2 text-sm text-gray-500">Loading boards...</div>
                      ) : currentOrganizationBoards.length > 0 ? (
                        currentOrganizationBoards.slice(0, 5).map((board) => (
                          <button
                            key={board.id}
                            onClick={() => handleBoardNavigation(board.id)}
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
                )}
              </div>
            </div>

            {/* Mobile Navigation (visible only on mobile) */}
            <div className="flex md:hidden items-center space-x-2">
              {/* Home Button */}
              <button
                onClick={handleHomeClick}
                className="bg-[#4E97C2] hover:bg-[#4E97C2] p-1 rounded transition duration-200 text-white"
                title="Home"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </button>

              {/* Organization Button */}
              <button
                onClick={() => setIsOrgDropdownOpen(!isOrgDropdownOpen)}
                className="bg-[#4E97C2] hover:bg-[#4E97C2] p-1 rounded transition duration-200 text-white"
                title="Organization"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V19a4 4 0 00-4-4H9a4 4 0 00-4 4v2" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11a4 4 0 100-8 4 4 0 000 8z" />
                </svg>
              </button>

              {/* Boards Button */}
              <button
                onClick={() => setIsBoardDropdownOpen(!isBoardDropdownOpen)}
                className="bg-[#4E97C2] hover:bg-[#4E97C2] p-1 rounded transition duration-200 text-white"
                title="Boards"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </button>

              {/* Search Button */}
              <button
                onClick={handleMobileSearchToggle}
                className={`p-1 rounded transition duration-200 ${showMobileSearch ? 'bg-[#4E97C2] text-white' : 'bg-[#4E97C2] hover:bg-[#4E97C2] text-white'
                  }`}
                title="Search"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </div>

            {/* Center Section - Title */}
            <h1 className="text-sm sm:text-lg font-bold font-pacifico text-white">{title}</h1>

            {/* Right Section - Search (Desktop), User, Logout */}
            <div className="flex items-center space-x-2 sm:space-x-3">
              {/* Search Bar (Desktop only) */}
              {showSearch && (
                <div className="relative hidden lg:block">
                  <form onSubmit={handleSearch}>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        {isSearching ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        ) : (
                          <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>
                        )}
                      </div>
                      <input
                        ref={searchInputRef}
                        type="text"
                        value={searchQuery}
                        onChange={handleSearchInputChange}
                        onFocus={handleSearchInputFocus}
                        placeholder="Search"
                        className="block w-32 sm:w-48 pl-10 pr-3 py-1.5 border-0 rounded text-sm bg-[#4E97C2] placeholder-white text-white"
                      />
                    </div>
                  </form>

                  {/* Search Results Dropdown */}
                  {showSearchResults && (searchQuery.trim() || hasResults) && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 max-h-96 overflow-y-auto z-50">
                      <SearchResults />
                    </div>
                  )}
                </div>
              )}

              {/* Log Out Button */}
              <button
                onClick={handleLogout}
                className="text-white hover:bg-[#4E97C2] px-2 sm:px-3 py-1 sm:py-1.5 rounded text-xs sm:text-sm font-medium transition duration-200"
              >
                Log Out
              </button>

              {/* User Avatar - Show actual Trello user initials */}
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-[#BAE3FF] rounded-full flex items-center justify-center text-[#0967D2] text-xs sm:text-sm font-medium">
                {userInfo?.initials || 'WJ'}
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Search Input */}
        {showMobileSearch && (
          <div className="px-2 pb-2">
            <div className="relative">
              <form onSubmit={handleSearch}>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    {isSearching ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
                    ) : (
                      <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    )}
                  </div>
                  <input
                    ref={mobileSearchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={handleSearchInputChange}
                    onFocus={handleSearchInputFocus}
                    placeholder="Search"
                    className="block w-full pl-10 pr-10 py-2 border-0 rounded text-sm bg-white text-gray-900 placeholder-gray-500"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={handleClearSearch}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      <svg className="h-4 w-4 text-gray-400 hover:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Create Board Modal */}
        <CreateBoardModal
          isOpen={isCreateBoardModalOpen}
          onClose={() => setIsCreateBoardModalOpen(false)}
        />

        {/* Create Organization Modal */}
        <CreateOrganizationModal
          isOpen={isCreateOrgModalOpen}
          onClose={() => setIsCreateOrgModalOpen(false)}
        />
      </header>

      {/* Mobile Organization Dropdown - Bottom Sheet Style */}
      {isOrgDropdownOpen && (
        <>
          <div className="fixed inset-0 z-40 md:hidden bg-black bg-opacity-50" onClick={() => setIsOrgDropdownOpen(false)} />
          <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white shadow-2xl max-h-[80vh] overflow-hidden">
            {/* Handle bar */}
            <div className="flex justify-center py-3">
              <div className="w-10 h-1 bg-gray-300 rounded-full"></div>
            </div>

            {/* Close button */}
            <div className="absolute top-3 right-4">
              <button
                onClick={() => setIsOrgDropdownOpen(false)}
                className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="px-4 pb-6">
              <div className="px-2 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-100">
                WORKSPACE
              </div>
              <div className="py-2 max-h-64 overflow-y-auto">
                {organizations.map((org) => (
                  <button
                    key={org.id}
                    onClick={() => handleOrganizationChange(org)}
                    className={`w-full text-left px-4 py-3 text-base hover:bg-gray-50 flex items-center space-x-3 rounded-lg ${currentOrganization?.id === org.id ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                      }`}
                  >
                    <div className={`w-6 h-6 rounded ${currentOrganization?.id === org.id ? 'bg-blue-500' : 'bg-blue-500'}`}></div>
                    <span className="font-medium">{org.displayName}</span>
                    {currentOrganization?.id === org.id && (
                      <svg className="w-5 h-5 text-blue-600 ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                ))}

                {/* Create New Organization Option */}
                <button
                  onClick={() => {
                    setIsOrgDropdownOpen(false);
                    setIsCreateOrgModalOpen(true);
                  }}
                  className="w-full text-left px-4 py-3 text-base hover:bg-gray-50 flex items-center space-x-3 text-blue-600 border-t border-gray-100 mt-2 pt-4 rounded-lg"
                >
                  <div className="w-6 h-6 bg-blue-100 rounded flex items-center justify-center">
                    <svg className="w-3 h-3 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <span className="font-medium">Create new organization</span>
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Mobile Boards Dropdown - Bottom Sheet Style */}
      {isBoardDropdownOpen && (
        <>
          <div className="fixed inset-0 z-40 md:hidden bg-black bg-opacity-50" onClick={() => setIsBoardDropdownOpen(false)} />
          <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white shadow-2xl max-h-[80vh] overflow-hidden">
            {/* Handle bar */}
            <div className="flex justify-center py-3">
              <div className="w-10 h-1 bg-gray-300 rounded-full"></div>
            </div>

            {/* Close button */}
            <div className="absolute top-3 right-4">
              <button
                onClick={() => setIsBoardDropdownOpen(false)}
                className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="px-4 pb-6">
              <div className="px-2 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-100">
                RECENT BOARDS
              </div>
              <div className="py-2 max-h-64 overflow-y-auto">
                {currentOrganizationBoards.length > 0 ? (
                  currentOrganizationBoards.slice(0, 10).map((board) => (
                    <button
                      key={board.id}
                      onClick={() => handleBoardNavigation(board.id)}
                      className="w-full text-left px-4 py-3 text-base text-gray-700 hover:bg-gray-50 flex items-center space-x-3 rounded-lg"
                    >
                      <div className="w-6 h-6 bg-blue-500 rounded"></div>
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
                  onClick={() => {
                    setIsBoardDropdownOpen(false);
                    setIsCreateBoardModalOpen(true);
                  }}
                  className="w-full text-left px-4 py-3 text-base hover:bg-gray-50 flex items-center space-x-3 text-blue-600 border-t border-gray-100 mt-2 pt-4 rounded-lg"
                >
                  <div className="w-6 h-6 rounded bg-blue-100 flex items-center justify-center">
                    <svg className="w-3 h-3 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <span className="font-medium">Create new board</span>
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Mobile Search Results */}
      {showMobileSearch && showSearchResults && (searchQuery.trim() || hasResults) && (
        <div className="fixed inset-0 top-0 z-40 bg-white md:hidden">
          <div className="pt-20 px-4 pb-4 h-full overflow-y-auto">
            <SearchResults />
          </div>
        </div>
      )}
    </>
  );
});

export default Header;