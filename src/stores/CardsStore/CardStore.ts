import { action, makeObservable, observable, computed } from 'mobx';
import { TrelloCard } from '../../types';
import { CardModel } from '../../models';

class CardStore {
  cardsMap = new Map<string, CardModel>();
  commentsMap = new Map<string, Array<{ id: string; text: string; date: string; cardId: string; memberCreator: any }>>();
  isLoading: boolean = false;
  error: string | null = null;
  isCreating: boolean = false;
  creatingListIds = new Set<string>();
  cardUpdateListeners = new Map<string, Set<() => void>>();

  constructor(private getAuthData: () => { token: string | null; clientId: string | null }) {
    makeObservable(this, {
      cardsMap: observable,
      commentsMap: observable,
      isLoading: observable,
      error: observable,
      isCreating: observable,
      creatingListIds: observable,
      cardUpdateListeners: observable,
      allCards: computed,
      cardCount: computed,
      isCreatingInList: computed,
      getCardById: action,
      reset: action,
      registerCardUpdateListener: action,
      unregisterCardUpdateListener: action,
      notifyCardUpdated: action,
      setError: action,
      setLoading: action,
      addCard: action,
      removeCard: action,
      updateLastFetchTime: action,
      clearCardsForList: action,
      setIsCreating: action,
      updateCardProperty: action,
      addComment: action,
      updateCardPositions: action,
      updateCardPosition: action,
      clearCardsForBoard: action,
    });
  }

  // Computed values for better performance and clean code
  get allCards(): CardModel[] {
    return Array.from(this.cardsMap.values());
  }

  get cardCount(): number {
    return this.cardsMap.size;
  }

  // Check if a card is being created in a specific list
  get isCreatingInList() {
    return (listId: string): boolean => {
      return this.creatingListIds.has(listId);
    };
  }

  setError = (error: string | null) => {
    this.error = error;
  };

  setLoading = (isLoading: boolean) => {
    this.isLoading = isLoading;
  };

  addCard = (card: CardModel) => {
    this.cardsMap.set(card.id, card);
  };

  removeCard = (cardId: string, listId?: string) => {
    let final_listId = listId;
    if (!final_listId) {
        const card = this.cardsMap.get(cardId);
        final_listId = card?.listId;
    }
    this.cardsMap.delete(cardId);
    if (final_listId) {
        this.notifyCardUpdated(cardId, final_listId);
    }
  };

  updateLastFetchTime = (listId: string, timestamp: number) => {
    this.lastFetchTimes.set(listId, timestamp);
  };

  clearCardsForList = (boardId: string, listId: string) => {
    const cardsToRemove = this.getCardsForList(boardId, listId);
    cardsToRemove.forEach(card => {
      this.cardsMap.delete(card.id);
    });
  };

  clearCardsForBoard = (boardId: string) => {
    const cardsToRemove = this.getCardsForBoard(boardId);
    cardsToRemove.forEach(card => {
      this.cardsMap.delete(card.id);
    });
  };

  setIsCreating = (isCreating: boolean) => {
    this.isCreating = isCreating;
  };

  updateCardProperty = (cardId: string, property: string, value: any) => {
    const card = this.getCardById(cardId);
    if (card && card.hasOwnProperty(property)) {
      (card as any)[property] = value;
    }
  };

  addComment = (cardId: string, commentData: { id: string; text: string; date: string; cardId: string; memberCreator: any }) => {
    const commentsForCard = this.commentsMap.get(cardId) || [];
    this.commentsMap.set(cardId, [...commentsForCard, commentData]);
  };

  updateCardPositions = (cards: { id: string; pos: number }[]) => {
    cards.forEach(card => {
      const cardModel = this.getCardById(card.id);
      if (cardModel) {
        cardModel.pos = card.pos;
      }
    });
  };

  updateCardPosition = (cardId: string, position: number) => {
    const card = this.getCardById(cardId);
    if (card) {
      card.pos = position;
    }
  };

  getCardsForBoard = (boardId: string): TrelloCard[] => {
    return this.allCards
      .filter(card => card.boardId === boardId)
      .map(card => ({
        id: card.id,
        name: card.name,
        desc: card.desc,
        closed: card.closed,
        pos: card.pos,
        listId: card.listId,
        boardId: card.boardId,
        url: card.url
      }));
  };

  getCardsForList = (boardId: string, listId: string): TrelloCard[] => {
    return this.allCards
      .filter(card => card.boardId === boardId && card.listId === listId)
      .map(card => ({
        id: card.id,
        name: card.name,
        desc: card.desc,
        closed: card.closed,
        pos: card.pos,
        listId: card.listId,
        boardId: card.boardId,
        url: card.url
      }))
      .sort((a, b) => (a.pos || 0) - (b.pos || 0));
  };

  getCardsByListMap = (boardId: string): Map<string, TrelloCard[]> => {
    const cardsByList = new Map<string, TrelloCard[]>();

    this.allCards
      .filter(card => card.boardId === boardId)
      .forEach(card => {
        if (!cardsByList.has(card.listId)) {
          cardsByList.set(card.listId, []);
        }
        cardsByList.get(card.listId)!.push({
          id: card.id,
          name: card.name,
          desc: card.desc,
          closed: card.closed,
          pos: card.pos,
          listId: card.listId,
          boardId: card.boardId,
          url: card.url
        });
      });

    // Sort cards within each list
    cardsByList.forEach(listCards => {
      listCards.sort((a, b) => (a.pos || 0) - (b.pos || 0));
    });

    return cardsByList;
  };

  // Track last fetch time for each board to prevent duplicate fetches
  lastFetchTimes = new Map<string, number>();
  fetchDebounceMs: number = 2000; // 2 seconds debounce


  getCardById = (cardId: string): CardModel | undefined => {
    return this.cardsMap.get(cardId);
  };

  // Register a listener for card updates in a specific list
  registerCardUpdateListener = (listId: string, callback: () => void): void => {
    if (!this.cardUpdateListeners.has(listId)) {
      this.cardUpdateListeners.set(listId, new Set());
    }
    this.cardUpdateListeners.get(listId)?.add(callback);
  };

  // Unregister a listener for card updates in a specific list
  unregisterCardUpdateListener = (listId: string, callback: () => void): void => {
    const listeners = this.cardUpdateListeners.get(listId);
    if (listeners) {
      listeners.delete(callback);
      if (listeners.size === 0) {
        this.cardUpdateListeners.delete(listId);
      }
    } else {
      console.log(`[CardStore] Attempted to unregister listener for list ${listId}, but no listeners found`);
    }
  };

  // Notify all listeners that a card has been updated
  notifyCardUpdated = (cardId: string, listId: string): void => {

    // Notify listeners for this specific list
    const listListeners = this.cardUpdateListeners.get(listId);
    if (listListeners) {
      listListeners.forEach(callback => {
        try {
          callback();
        } catch (error) {
          console.error('Error in card update listener:', error);
        }
      });
    } else {
      console.log(`No listeners found for list ${listId}`);
    }
  };

  reset = () => {
    this.cardsMap.clear();
    this.error = null;
    this.isLoading = false;
    this.isCreating = false;
    this.creatingListIds.clear(); // Clear creating list IDs
    this.cardUpdateListeners.clear(); // Clear all listeners
    // Clear last fetch times to ensure fresh data after login
    this.lastFetchTimes.clear();
  };
}

export default CardStore;
