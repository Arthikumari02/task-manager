import { makeAutoObservable, runInAction } from 'mobx';
import { CardModel } from "../../models";

class SearchStore {
  cards: CardModel[] = [];
  isLoading: boolean = false;
  error: string | null = null;
  searchQuery: string = '';

  constructor(private getAuthData: () => { token: string | null; clientId: string | null }) {
    makeAutoObservable(this);
  }

  setSearchResults = (cards: CardModel[]) => { 
    runInAction(() => {
    this.cards = cards;
    this.error = null; 
    });
  };

  setIsLoading = (isLoading: boolean) => {
    runInAction(() => {
      this.isLoading = isLoading;
      if (isLoading) {
          this.error = null;
      }
    });
  };

  setSearchError = (error: string | null) => {
    runInAction(() => {
      this.error = error;
      // this.cards = [];
    });
  }

  
  setSearchQuery = (query: string) => {
    this.searchQuery = query;
  };

  clearSearch = () => {
    this.cards = [];
    this.isLoading = false;
    this.error = null;
    this.searchQuery = '';
  };

  get hasResults(): boolean {
    return this.cards.length > 0;
  }

  get isSearching(): boolean {
    return this.isLoading;
  }

  get searchError(): string | null {
    return this.error;
  }

  get searchCards(): CardModel[] { 
    return this.cards;
  }
}

export default SearchStore;