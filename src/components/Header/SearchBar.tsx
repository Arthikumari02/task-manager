import React, { useRef, useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
import { useSearchStore } from "../../contexts/SearchContext";
import { useSearch } from "../../hooks/APIs/PerformSearch";
import Icon from "../../assets/icons";
import SearchResults from "./SearchResults";
import { useTranslation } from "react-i18next";

interface SearchBarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  showSearchResults: boolean;
  setShowSearchResults: (show: boolean) => void;
  isMobile?: boolean;
  onMobileToggle?: () => void;
}

const SearchBar: React.FC<SearchBarProps> = observer(
  ({
    searchQuery,
    setSearchQuery,
    showSearchResults,
    setShowSearchResults,
    isMobile = false,
    onMobileToggle,
  }) => {
    const searchStore = useSearchStore();
    const { clearSearch, hasResults } = searchStore;
    const { performSearch, isSearching } = useSearch();
    const searchInputRef = useRef<HTMLInputElement>(null);
    const mobileSearchInputRef = useRef<HTMLInputElement>(null);
    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const { t } = useTranslation('header');
    // const [localQuery, setLocalQuery] = useState(searchQuery);

    useEffect(() => {
      if (!searchQuery.trim() || isMobile) {
        if (!searchQuery.trim()) {
          clearSearch();
        }
        return;
      }

      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
      searchTimeoutRef.current = setTimeout(() => {
        performSearch(searchQuery);
        setShowSearchResults(true);
      }, 300);

      return () => {
        if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
      };
    }, [searchQuery, isMobile]);

    // Handle input change
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      // setLocalQuery(value);
      searchStore.setSearchQuery(value);
      setSearchQuery(value);
      if (isMobile) {
        if (value.trim()) {
          performSearch(value);
          setShowSearchResults(true);
        } else {
          clearSearch();
          setShowSearchResults(false);
        }
      }
    };
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        if (searchQuery.trim()) {
          performSearch(searchQuery);
          setShowSearchResults(true);
        } else {
          clearSearch();
          setShowSearchResults(false);
        }
      }
    };

    const handleClear = () => {
      setSearchQuery("");
      clearSearch();
      setShowSearchResults(false);
      searchStore.setSearchQuery("");
    };

    // Click outside to close dropdown
    useEffect(() => {
      if (!showSearchResults) return;

      const handleClickOutside = (event: MouseEvent) => {
        const target = event.target as HTMLElement;
        const isOutsideDesktop =
          searchInputRef.current && !searchInputRef.current.contains(target);
        const isOutsideMobile =
          mobileSearchInputRef.current &&
          !mobileSearchInputRef.current.contains(target);

        if ((isMobile && isOutsideMobile) || (!isMobile && isOutsideDesktop)) {
          setShowSearchResults(false);
        }
      };

      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }, [showSearchResults, isMobile, setShowSearchResults]);

    // Desktop search JSX
    const DesktopSearch = (
      <div className="hidden lg:block relative">
        <div className="relative">
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={t('app.searchplaceholder')}
            className="block w-32 sm:w-48 pl-10 py-1.5 rounded text-sm bg-[#4E97C2] placeholder-white text-white focus:outline-none focus:ring-2 focus:ring-white"
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            {isSearching ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
            ) : (
              <Icon type="search" className="h-4 w-4 text-white" />
            )}
          </div>
          {searchQuery && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute inset-y-0 right-0 pr-2 flex items-center"
            >
              <Icon
                type="close"
                className="h-4 w-4 text-white hover:text-gray-200"
              />
            </button>
          )}
        </div>

        {showSearchResults && (searchQuery.trim() || hasResults) && (
          <div className="absolute top-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 max-h-96 overflow-y-auto w-64 sm:w-80 z-[100]">
            <SearchResults />
          </div>
        )}
      </div>
    );

    // Mobile search JSX
    const MobileSearch = isMobile && (
      <div className="fixed inset-0 top-0 z-[100] bg-[#026AA7] md:hidden">
        <div className="pt-3 px-4 pb-4 h-full overflow-y-auto">
          <div className="flex justify-between items-center mb-3">
            <div className="flex-1 relative">
              <input
                ref={mobileSearchInputRef}
                type="text"
                value={searchQuery}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                autoFocus
                placeholder="Search"
                className="block w-full pl-3 pr-10 py-2 rounded text-sm bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  <Icon type="close" className="h-4 w-4 text-gray-400" />
                </button>
              )}
            </div>
            <button
              onClick={() => {
                setShowSearchResults(false);
                onMobileToggle?.();
              }}
              className="ml-3 p-2 text-white hover:bg-[#4E97C2] rounded-sm"
            >
              <Icon type="close" className="w-4 h-4" />
            </button>
          </div>
          {(searchQuery.trim() || searchStore.searchCards.length > 0) && (
            <div className="mt-3">
              <SearchResults />
            </div>
          )}
        </div>
      </div>
    );

    return <>{isMobile ? MobileSearch : DesktopSearch}</>;
  }
);

export default SearchBar;
