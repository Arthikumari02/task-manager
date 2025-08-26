import { makeAutoObservable, runInAction } from 'mobx';
import { TrelloCard } from '../../types';
import { useSearch } from '../../hooks/APIs/PerformSearch';

interface SearchResult {
  cards: TrelloCard[];
  isLoading: boolean;
  error: string | null;
}

class SearchStore {
  searchResults: SearchResult = {
    cards: [],
    isLoading: false,
    error: null
  };

  constructor(private getAuthData: () => { token: string | null; clientId: string | null }) {
    makeAutoObservable(this);
  }

  clearSearch = () => {
    runInAction(() => {
      this.searchResults = {
        cards: [],
        isLoading: false,
        error: null
      };
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

  get searchCards(): TrelloCard[] {
    return this.searchResults.cards;
  }
}

export default SearchStore;