import { makeAutoObservable, runInAction } from 'mobx';
import { CardModel } from "../../models";

interface SearchResult {
  cards: CardModel[];
  isLoading: boolean;
  error: string | null;
}

class SearchStore {
  searchResults: SearchResult = {
    cards: [],
    isLoading: false,
    error: null
  };
  searchQuery: string = '';

  constructor(private getAuthData: () => { token: string | null; clientId: string | null }) {
    makeAutoObservable(this);
  }

  setSearchResults = (cards: CardModel[]) => { 
    runInAction(() => {
    this.searchResults.cards = cards;
    this.searchResults.error = null; 
    });
  };

  setIsLoading = (isLoading: boolean) => {
    runInAction(() => {
      this.searchResults.isLoading = isLoading;
      if (isLoading) {
          this.searchResults.error = null;
      }
    });
  };

  setSearchError = (error: string | null) => {
    runInAction(() => {
      this.searchResults.error = error;
      this.searchResults.cards = [];
    });
  }

  
  setSearchQuery = (query: string) => {
    this.searchQuery = query;
  };

  clearSearch = () => {
    runInAction(() => {
      this.searchResults = {
        cards: [],
        isLoading: false,
        error: null
      };
      this.searchQuery = '';
    });
  };

  get hasResults(): boolean {
    return this.searchResults.cards.length > 0;
  }

  get isSearching(): boolean {
    return this.searchResults.isLoading;
  }

  get searchError(): string | null {
    return this.searchResults.error;
  }

  get searchCards(): CardModel[] { 
    return this.searchResults.cards;
  }
}

export default SearchStore;