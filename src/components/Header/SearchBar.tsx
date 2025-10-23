import React, { useRef, useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { useSearchStore } from '../../contexts/SearchContext';
import { useSearch } from '../../hooks/APIs/PerformSearch';
import Icon from '../../assets/icons';
import SearchResults from './SearchResults';

interface SearchBarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  showSearchResults: boolean;
  setShowSearchResults: (show: boolean) => void;
  isMobile?: boolean;
  onMobileToggle?: () => void;
}

const SearchBar: React.FC<SearchBarProps> = observer(({
  searchQuery,
  setSearchQuery,
  showSearchResults,
  setShowSearchResults,
  isMobile = false,
  onMobileToggle
}) => {
  const searchStore = useSearchStore();
  const { clearSearch, hasResults } = searchStore;
  const { performSearch, isSearching } = useSearch();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const mobileSearchInputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [localQuery, setLocalQuery] = useState(searchQuery);
  const isInitialMount = useRef(true);


  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    if (!localQuery.trim()) {
      clearSearch();
      setShowSearchResults(false);
      setSearchQuery('');
      return;
    }
  
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
  
    searchTimeoutRef.current = setTimeout(() => {
      setSearchQuery(localQuery); 
      performSearch(localQuery, {
        onError: (error) => console.error('SearchBar: Error triggering search:', error)
      });
      
      setShowSearchResults(true);
    }, 300); 
  
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [localQuery, performSearch, clearSearch, setSearchQuery, setShowSearchResults]);
  
    // Close search results when clicking outside
  useEffect(() => {
    if (!showSearchResults) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const isOutsideDesktopSearch = searchInputRef.current && !searchInputRef.current.contains(target);
      const isOutsideMobileSearch = mobileSearchInputRef.current && !mobileSearchInputRef.current.contains(target);

      if ((isOutsideDesktopSearch && !isMobile) || (isOutsideMobileSearch && isMobile)) {
        setShowSearchResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSearchResults, setShowSearchResults, isMobile]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      performSearch(searchQuery, {
        onError: (error) => {
          console.error('SearchBar: Error triggering search:', error);
        }
      });
      setShowSearchResults(true);
    }
  };

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocalQuery(value);
  };

  const handleClearSearch = () => {
    setLocalQuery('');
    setSearchQuery('');
    clearSearch();
    setShowSearchResults(false);
  };

  if (isMobile) {
    return (
      <>
        {/* Mobile search - Always show the full-screen overlay */}
        <div className="fixed inset-0 top-0 z-[100] bg-[#026AA7] md:hidden">
          <div className="pt-3 px-4 pb-4 h-full overflow-y-auto">
            <div className="flex justify-between items-center mb-3">
              <div className="flex-1">
                <div className="relative">
                  <input
                    ref={mobileSearchInputRef}
                    type="text"
                    value={localQuery} 
                    onChange={handleSearchInputChange}
                    placeholder="Search"
                    className="block w-full pl-3 pr-10 py-2 border border-gray-200 rounded text-sm bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:ring-opacity-50 shadow-sm transition-all duration-200"
                    autoFocus
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={handleClearSearch}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      <Icon type="close" className="h-4 w-4 text-gray-400" />
                    </button>
                  )}
                </div>
              </div>
              <button
                onClick={() => {
                  setShowSearchResults(false);
                  if (onMobileToggle) onMobileToggle();
                }}
                className="ml-3 p-2 text-white hover:bg-[#4E97C2] rounded-sm transition-colors"
              >
                <Icon type="close" className="w-4 h-4" />
              </button>
            </div>
            <div className="mt-3">
              <SearchResults />
            </div>
          </div>
        </div>
      </>
    );
  }

  // Desktop search bar
  const DesktopSearchBar = () => (
    <div className="hidden lg:block relative">
      <form onSubmit={handleSearch}>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            {isSearching ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <Icon type="search" className="h-4 w-4 text-white" />
            )}
          </div>
          <input
            ref={searchInputRef}
            type="text"
            value={localQuery} 
            onChange={handleSearchInputChange}
            placeholder="Search cards or boards"
            className="block w-32 sm:w-48 pl-10 pr-8 py-1.5 border-0 rounded text-sm bg-[#4E97C2] placeholder-white text-white focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 transition-all duration-200"
          />
          {localQuery  && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="absolute inset-y-0 right-0 pr-2 flex items-center"
            >
              <Icon type="close" className="h-4 w-4 text-white hover:text-gray-200" />
            </button>
          )}
        </div>
      </form>

      {/* Desktop Search Results Dropdown */}
      {showSearchResults && (localQuery .trim() || hasResults) && (
        <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 max-h-96 overflow-y-auto z-[100] w-64 sm:w-80">
          <SearchResults />
        </div>
      )}
    </div>
  );

  return (
    <>
      {isMobile ? (
        // Mobile search UI
        <>
          <div className="fixed inset-0 top-0 z-[100] bg-[#026AA7] md:hidden">
            <div className="pt-3 px-4 pb-4 h-full overflow-y-auto">
              <div className="flex justify-between items-center mb-3">
                <div className="flex-1">
                  <div className="relative">
                    <input
                      ref={mobileSearchInputRef}
                      type="text"
                      value={localQuery} 
                      onChange={handleSearchInputChange}
                      placeholder="Search"
                      className="block w-full pl-3 pr-10 py-2 border border-gray-200 rounded text-sm bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:ring-opacity-50 shadow-sm transition-all duration-200"
                      autoFocus
                    />
                    {localQuery  && (
                      <button
                        type="button"
                        onClick={handleClearSearch}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      >
                        <Icon type="close" className="h-4 w-4 text-gray-400" />
                      </button>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowSearchResults(false);
                    if (onMobileToggle) onMobileToggle();
                  }}
                  className="ml-3 p-2 text-white hover:bg-[#4E97C2] rounded-sm transition-colors"
                >
                  <Icon type="close" className="w-4 h-4" />
                </button>
              </div>
              <div className="mt-3">
                <SearchResults />
              </div>
            </div>
          </div>
        </>
      ) : (
        // Desktop search UI
        <DesktopSearchBar />
      )}
    </>
  );
});

export default SearchBar;
