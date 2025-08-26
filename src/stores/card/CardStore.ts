import { action, makeObservable, observable, computed, runInAction } from 'mobx';
import { TrelloCard } from '../../types';
import { CardModel } from '../../models';

class CardStore {
  cardsMap = new Map<string, CardModel>();
  isLoading: boolean = false;
  error: string | null = null;
  isCreating: boolean = false;
  creatingListIds = new Set<string>();
  cardUpdateListeners = new Map<string, Set<() => void>>();

  constructor(private getAuthData: () => { token: string | null; clientId: string | null }) {
    makeObservable(this, {
      cardsMap: observable,
      isLoading: observable,
      error: observable,
      isCreating: observable,
      creatingListIds: observable,
      cardUpdateListeners: observable,
      allCards: computed,
      cardCount: computed,
      isCreatingInList: computed,
      renameCard: action,
      updateCardDescription: action,
      deleteCard: action,
      addComment: action,
      moveCard: action,
      reorderCardsInList: action,
      fetchBoardCards: action,
      getCardById: action,
      reset: action,
      registerCardUpdateListener: action,
      unregisterCardUpdateListener: action,
      notifyCardUpdated: action
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

  fetchCards = async (boardId: string, onSuccessFetch: (cards: CardModel[]) => void): Promise<void> => {
    const { token, clientId } = this.getAuthData();
    if (!token || !clientId || !boardId) return;

    // Check if we've fetched this board recently
    const now = Date.now();
    const lastFetch = this.lastFetchTimes.get(boardId) || 0;
    if (now - lastFetch < this.fetchDebounceMs) {
      // Return existing data instead of fetching again
      const existingCards = this.getCardsForBoard(boardId);
      if (existingCards.length > 0) {
        const cardModels = existingCards.map(card => this.cardsMap.get(card.id)).filter(Boolean) as CardModel[];
        onSuccessFetch(cardModels);
        return;
      }
    }

    runInAction(() => {
      // Update last fetch time
      this.lastFetchTimes.set(boardId, now);
      this.isLoading = true;
      this.error = null;
    });

    try {
      const response = await fetch(
        `https://api.trello.com/1/boards/${boardId}/cards?key=${clientId}&token=${token}&filter=open`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch cards: ${response.statusText}`);
      }

      const trelloCards = await response.json();

      // Process cards outside of runInAction to minimize transaction size
      const cardModelsToAdd: CardModel[] = [];
      
      trelloCards.forEach((card: any) => {
        if (card.closed) return; // Skip closed cards
        
        const cardModel = new CardModel({
          id: card.id,
          name: card.name,
          desc: card.desc || '',
          closed: card.closed || false,
          pos: card.pos || 0,
          listId: card.idList,
          boardId: boardId,
          url: card.url || ''
        });
        
        cardModelsToAdd.push(cardModel);
      });
      
      // Update observable state in a single action
      runInAction(() => {
        // Add all cards to the map
        cardModelsToAdd.forEach(cardModel => {
          this.cardsMap.set(cardModel.id, cardModel);
        });
      });
      
      onSuccessFetch(cardModelsToAdd);
    } catch (err) {
      console.error('Error fetching cards:', err);
      runInAction(() => {
        this.error = err instanceof Error ? err.message : 'Failed to fetch cards';
      });
    } finally {
      runInAction(() => {
        this.isLoading = false;
      });
    }
  };

  createCard = async (name: string, listId: string, onSuccessCreate: (cardId: string) => void): Promise<TrelloCard | null> => {
    const { token, clientId } = this.getAuthData();
    if (!token || !clientId || !listId) return null;

    runInAction(() => {
      this.isCreating = true;
      this.creatingListIds.add(listId); // Track which list is creating a card
      this.error = null;
    });

    try {
      const response = await fetch(
        `https://api.trello.com/1/cards?key=${clientId}&token=${token}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name,
            idList: listId
          })
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to create card: ${response.statusText}`);
      }

      const newCard = await response.json();

      const cardToAdd: TrelloCard = {
        id: newCard.id,
        name: newCard.name,
        desc: newCard.desc || '',
        listId: newCard.idList,
        boardId: newCard.idBoard,
        closed: false,
        pos: newCard.pos || 0,
        url: newCard.url || ''
      };

      // Create CardModel instance
      const cardModel = new CardModel({
        id: cardToAdd.id,
        name: cardToAdd.name,
        desc: cardToAdd.desc,
        closed: cardToAdd.closed,
        pos: cardToAdd.pos,
        listId: cardToAdd.listId,
        boardId: cardToAdd.boardId,
        url: cardToAdd.url
      });

      runInAction(() => {
        this.cardsMap.set(cardModel.id, cardModel);
        this.isCreating = false;
        this.creatingListIds.delete(listId); // Remove list from creating state
      });

      // Notify listeners that a card was added to this list
      this.notifyCardUpdated(cardToAdd.id, listId);

      onSuccessCreate(cardToAdd.id);

      return cardToAdd;

    } catch (error) {
      console.error('Error creating card:', error);
      runInAction(() => {
        this.error = error instanceof Error ? error.message : 'Failed to create card';
        this.isCreating = false;
        this.creatingListIds.delete(listId); // Remove list from creating state on error
      });
      return null;
    }
  };

  renameCard = async (boardId: string, cardId: string, newName: string): Promise<void> => {
    const { token, clientId } = this.getAuthData();
    if (!token || !clientId) return;

    console.log('Renaming card in CardStore:', { cardId, newName });

    // Get the card model from the map
    const cardModel = this.cardsMap.get(cardId);
    if (!cardModel) {
      console.error('Card not found in cardsMap:', cardId);
      return;
    }

    // Store original name for potential revert
    const originalName = cardModel.name;
    const listId = cardModel.listId;

    // Update local state immediately for better UX
    cardModel.name = newName;

    // Force update of the card in the map to ensure reactivity
    this.cardsMap.set(cardId, cardModel);

    // Notify any subscribers that this card has been updated
    this.notifyCardUpdated(cardId, listId);

    try {
      const response = await fetch(
        `https://api.trello.com/1/cards/${cardId}?key=${clientId}&token=${token}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ name: newName })
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to rename card: ${response.statusText}`);
      }

      console.log('Card renamed successfully:', newName);

      // Notify again after successful API call
      this.notifyCardUpdated(cardId, listId);
    } catch (error) {
      console.error('Error renaming card:', error);
      // Revert on error
      if (cardModel) {
        cardModel.name = originalName;
        // Force update with reverted data
        this.cardsMap.set(cardId, cardModel);
        // Notify of revert
        this.notifyCardUpdated(cardId, listId);
      }
      this.error = error instanceof Error ? error.message : 'Failed to rename card';
    }
  };

  updateCardDescription = async (cardId: string, description: string): Promise<void> => {
    const { token, clientId } = this.getAuthData();
    if (!token || !clientId) return;

    try {
      const response = await fetch(
        `https://api.trello.com/1/cards/${cardId}?key=${clientId}&token=${token}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ desc: description })
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to update card description: ${response.statusText}`);
      }

      // Update CardModel
      const cardModel = this.cardsMap.get(cardId);
      if (cardModel) {
        cardModel.desc = description;
      }
    } catch (error) {
      console.error('Error updating card description:', error);
      this.error = error instanceof Error ? error.message : 'Failed to update card description';
    }
  };

  deleteCard = async (cardId: string): Promise<boolean> => {
    const { token, clientId } = this.getAuthData();
    if (!token || !clientId) return false;

    try {
      // Get the card's list ID before deleting it
      const card = this.cardsMap.get(cardId);
      if (!card) {
        console.error('Card not found for deletion:', cardId);
        return false;
      }
      const listId = card.listId;

      const response = await fetch(
        `https://api.trello.com/1/cards/${cardId}?key=${clientId}&token=${token}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ closed: true })
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to delete card: ${response.statusText}`);
      }

      // Remove from local state
      this.cardsMap.delete(cardId);

      // Notify listeners that a card was deleted from this list
      console.log(`Notifying card deletion for list ${listId}`);
      this.notifyCardUpdated(cardId, listId);

      return true;

    } catch (error) {
      console.error('Error deleting card:', error);
      this.error = error instanceof Error ? error.message : 'Failed to delete card';
      return false;
    }
  };

  addComment = async (cardId: string, comment: string): Promise<boolean> => {
    const { token, clientId } = this.getAuthData();
    if (!token || !clientId) return false;

    try {
      const response = await fetch(
        `https://api.trello.com/1/cards/${cardId}/actions/comments?key=${clientId}&token=${token}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ text: comment })
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to add comment: ${response.statusText}`);
      }

      return true;

    } catch (error) {
      console.error('Error adding comment:', error);
      this.error = error instanceof Error ? error.message : 'Failed to add comment';
      return false;
    }
  };

  moveCard = async (boardId: string, cardId: string, sourceListId: string, destinationListId: string, position: number): Promise<void> => {
    const { token, clientId } = this.getAuthData();
    if (!token || !clientId) return;

    console.log('Moving card in CardStore:', { cardId, sourceListId, destinationListId, position });

    // Store original state for potential revert
    const cardModel = this.cardsMap.get(cardId);
    if (!cardModel) {
      console.error('Card not found in cardsMap:', cardId);
      return;
    }

    // const originalListId = cardModel.listId;
    // const originalPos = cardModel.pos;

    // console.log(`Moving card "${cardModel.name}" from list ${sourceListId} to ${destinationListId}`);

    // // Calculate proper position value for Trello API
    // let newPosition: string | number;

    // const cardsInDestination = this.getCardsForList(boardId, destinationListId);
    // console.log(`Destination list has ${cardsInDestination.length} cards`);

    // if (cardsInDestination.length === 0) {
    //   // If the list is empty, use 'top'
    //   newPosition = 'top';
    //   console.log('Empty destination list, using position: top');
    // } else if (position === 0) {
    //   // If moving to the top of a non-empty list
    //   newPosition = 'top';
    //   console.log('Moving to top of list, using position: top');
    // } else if (position >= cardsInDestination.length) {
    //   // If moving to the bottom of the list
    //   newPosition = 'bottom';
    //   console.log('Moving to bottom of list, using position: bottom');
    // } else {
    //   // Calculate position between two cards
    //   const prevCard = cardsInDestination[position - 1];
    //   const nextCard = cardsInDestination[position];

    //   if (prevCard && nextCard) {
    //     // Calculate midpoint between the two positions
    //     newPosition = (prevCard.pos + nextCard.pos) / 2;
    //     console.log(`Calculated position between cards: ${newPosition}`);
    //   } else {
    //     // Fallback to index if calculation fails
    //     newPosition = position;
    //     console.log(`Using fallback position: ${position}`);
    //   }
    //    }

    // Update local state immediately for better UX
    cardModel.listId = destinationListId;
    // Store the position temporarily, will be updated with actual pos from API
    cardModel.pos = position;

    // Force update of the card in the map to ensure reactivity
    this.cardsMap.set(cardId, cardModel);

    try {
      const response = await fetch(
        `https://api.trello.com/1/cards/${cardId}?key=${clientId}&token=${token}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            idList: destinationListId,
            pos: position
          })
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to move card: ${response.statusText}`);
      }

      // Update with server response
      const updatedCard = await response.json();
      if (cardModel) {
        cardModel.pos = updatedCard.pos;
        // Force update again with server data
        this.cardsMap.set(cardId, cardModel);

        // Notify listeners for both source and destination lists
        console.log(`Notifying card update for source list ${sourceListId}`);
        this.notifyCardUpdated(cardId, sourceListId);

        console.log(`Notifying card update for destination list ${destinationListId}`);
        this.notifyCardUpdated(cardId, destinationListId);
      }
      console.log('Card moved successfully, new position:', updatedCard.pos);
    } catch (error) {
      console.error('Error moving card:', error);
      // Revert on error
      // if (cardModel) {
      //   cardModel.listId = originalListId;
      //   cardModel.pos = originalPos;
      //   // Force update with reverted data
      //   this.cardsMap.set(cardId, cardModel);
      // }
      this.error = error instanceof Error ? error.message : 'Failed to move card';
    }
  };

  reorderCardsInList = async (boardId: string, listId: string, sourceIndex: number, destinationIndex: number): Promise<void> => {
    const listCards = this.getCardsForList(boardId, listId);
    if (listCards.length === 0 || sourceIndex === destinationIndex) return;

    console.log('Reordering cards in list:', { boardId, listId, sourceIndex, destinationIndex });

    const [movedCard] = listCards.splice(sourceIndex, 1);
    listCards.splice(destinationIndex, 0, movedCard);

    // Store original position for potential revert
    const cardModel = this.cardsMap.get(movedCard.id);
    if (!cardModel) {
      console.error('Card not found in cardsMap:', movedCard.id);
      return;
    }



    const originalPos = cardModel.pos;
    console.log(`Reordering card "${cardModel.name}" from position ${sourceIndex} to ${destinationIndex}`);
    cardModel.pos = destinationIndex;
    console.log("position here -------------", cardModel.pos)
    // Calculate proper position value for Trello API
    let newPosition: string | number;

    // Re-fetch cards after our local splice operations
    const updatedListCards = this.getCardsForList(boardId, listId);
    console.log(`List has ${updatedListCards.length} cards after local reordering`);

    if (destinationIndex === 0) {
      // If moving to the top of the list
      newPosition = 'top';
      console.log('Moving to top of list, using position: top');
    } else if (destinationIndex >= updatedListCards.length - 1) {
      // If moving to the bottom of the list
      newPosition = 'bottom';
      console.log('Moving to bottom of list, using position: bottom');
    } else {
      // Calculate position between two cards
      const prevCard = updatedListCards[destinationIndex - 1];
      const nextCard = updatedListCards[destinationIndex + 1];

      if (prevCard && nextCard) {
        // Calculate midpoint between the two positions
        newPosition = (prevCard.pos + nextCard.pos) / 2;
        console.log(`Calculated position between cards: ${newPosition}`);
      } else {
        // Fallback to index if calculation fails
        newPosition = destinationIndex;
        console.log(`Using fallback position: ${destinationIndex}`);
      }
    }

    console.log('Calculated new position for reorder:', newPosition);

    // Update local state immediately for better UX
    if (cardModel) {
      cardModel.pos = typeof newPosition === 'number' ? newPosition : destinationIndex;
      // Force update of the card in the map to ensure reactivity
      this.cardsMap.set(movedCard.id, cardModel);
    }

    // Update position on server
    const { token, clientId } = this.getAuthData();
    if (!token || !clientId) return;

    try {
      const response = await fetch(
        `https://api.trello.com/1/cards/${movedCard.id}?key=${clientId}&token=${token}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ pos: newPosition })
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to reorder card: ${response.statusText}`);
      }

      // Update with server response
      const updatedCard = await response.json();
      if (cardModel) {
        cardModel.pos = updatedCard.pos;
        // Force update again with server data
        this.cardsMap.set(movedCard.id, cardModel);

        // Notify listeners for this list that a card has been reordered
        console.log(`Notifying card update for list ${listId} after reordering`);
        this.notifyCardUpdated(movedCard.id, listId);
      }
      console.log('Card reordered successfully, new position:', updatedCard.pos);
    } catch (error) {
      console.error('Error reordering cards:', error);
      // Revert on error
      if (cardModel && originalPos !== undefined) {
        cardModel.pos = originalPos;
        // Force update with reverted data
        this.cardsMap.set(movedCard.id, cardModel);
      }
      this.error = error instanceof Error ? error.message : 'Failed to reorder cards';
    }
  };

  // Alias for compatibility with useBoardData hook
  fetchBoardCards = this.fetchCards;

  getCardById = (cardId: string): CardModel | undefined => {
    return this.cardsMap.get(cardId);
  };

  // Register a listener for card updates in a specific list
  registerCardUpdateListener = (listId: string, callback: () => void): void => {
    if (!this.cardUpdateListeners.has(listId)) {
      this.cardUpdateListeners.set(listId, new Set());
      console.log(`[CardStore] Created new listener set for list ${listId}`);
    }
    this.cardUpdateListeners.get(listId)?.add(callback);
    console.log(`[CardStore] Registered card update listener for list ${listId}. Total listeners: ${this.cardUpdateListeners.get(listId)?.size || 0}`);
  };

  // Unregister a listener for card updates in a specific list
  unregisterCardUpdateListener = (listId: string, callback: () => void): void => {
    const listeners = this.cardUpdateListeners.get(listId);
    if (listeners) {
      const hadCallback = listeners.has(callback);
      listeners.delete(callback);
      console.log(`[CardStore] Unregistered card update listener for list ${listId}. Listener was ${hadCallback ? 'found' : 'not found'}. Remaining listeners: ${listeners.size}`);
      if (listeners.size === 0) {
        this.cardUpdateListeners.delete(listId);
        console.log(`[CardStore] Removed empty listener set for list ${listId}`);
      }
    } else {
      console.log(`[CardStore] Attempted to unregister listener for list ${listId}, but no listeners found`);
    }
  };

  // Notify all listeners that a card has been updated
  notifyCardUpdated = (cardId: string, listId: string): void => {
    console.log(`Notifying card update for card ${cardId} in list ${listId}`);

    // Notify listeners for this specific list
    const listListeners = this.cardUpdateListeners.get(listId);
    if (listListeners) {
      console.log(`Found ${listListeners.size} listeners for list ${listId}`);
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
    runInAction(() => {
      this.cardsMap.clear();
      this.error = null;
      this.isLoading = false;
      this.isCreating = false;
      this.creatingListIds.clear(); // Clear creating list IDs
      this.cardUpdateListeners.clear(); // Clear all listeners
      // Clear last fetch times to ensure fresh data after login
      this.lastFetchTimes.clear();
    });
  };
}

export default CardStore;
