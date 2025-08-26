import React, { useRef, useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { useSearch } from '../contexts/SearchContext';
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
  const searchStore = useSearch();
  const { performSearch, clearSearch, hasResults, isSearching } = searchStore;
  const searchInputRef = useRef<HTMLInputElement>(null);
  const mobileSearchInputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Real-time search with debounce
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (searchQuery.trim()) {
      searchTimeoutRef.current = setTimeout(() => {
        try {
          performSearch(searchQuery);
        } catch (error) {
          console.error('SearchBar: Error triggering search:', error);
        }
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
  }, [searchQuery, performSearch, clearSearch, setShowSearchResults]);

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
                    value={searchQuery}
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
                      <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
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
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
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

  return (
    <>
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
              placeholder="Search cards or boards"
              className="block w-32 sm:w-48 pl-10 pr-8 py-1.5 border-0 rounded text-sm bg-[#4E97C2] placeholder-white text-white focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 transition-all duration-200"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute inset-y-0 right-0 pr-2 flex items-center"
              >
                <svg className="h-4 w-4 text-white hover:text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Search Results Dropdown - Moved outside the hidden container */}
      {!isMobile && showSearchResults && (searchQuery.trim() || hasResults) && (
        <div className="absolute top-[56px] right-[80px] mt-1 bg-white rounded-lg shadow-lg border border-gray-200 max-h-96 overflow-y-auto z-[100] w-64 sm:w-80">
          <SearchResults />
        </div>
      )}
    </>
  );
});

export default SearchBar;
