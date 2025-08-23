import { makeAutoObservable } from 'mobx';
import { TrelloCard } from '../../types';

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

  performSearch = async (query: string): Promise<void> => {
    const { token, clientId } = this.getAuthData();
    if (!token || !clientId || !query.trim()) {
      this.searchResults = {
        cards: [],
        isLoading: false,
        error: null
      };
      return;
    }

    this.searchResults.isLoading = true;
    this.searchResults.error = null;

    try {
      const response = await fetch(
        `https://api.trello.com/1/search?key=${clientId}&token=${token}&query=${encodeURIComponent(query)}&modelTypes=cards&card_fields=id,name,desc,closed,pos,idList,idBoard,url`
      );

      if (!response.ok) {
        throw new Error(`Failed to search: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Filter out closed cards and map to TrelloCard format
      const cards: TrelloCard[] = (data.cards || [])
        .filter((card: any) => !card.closed)
        .map((card: any) => ({
          id: card.id,
          name: card.name,
          desc: card.desc || '',
          closed: card.closed || false,
          pos: card.pos || 0,
          listId: card.idList,
          boardId: card.idBoard,
          url: card.url || ''
        }));

      this.searchResults = {
        cards,
        isLoading: false,
        error: null
      };

    } catch (error) {
      console.error('Error searching cards:', error);
      this.searchResults = {
        cards: [],
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to search cards'
      };
    }
  };

  clearSearch = () => {
    this.searchResults = {
      cards: [],
      isLoading: false,
      error: null
    };
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
