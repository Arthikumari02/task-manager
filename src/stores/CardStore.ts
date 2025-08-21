import { BaseStore } from './BaseStore';
import { TrelloCard } from '../types';

export interface CardStoreState {
  boardCards: { [boardId: string]: TrelloCard[] };
  isLoading: boolean;
  error: string | null;
  isCreating: boolean;
}

export class CardStore extends BaseStore {
  constructor(setState: (updater: (prev: CardStoreState) => CardStoreState) => void, token: string | null, clientId: string | null) {
    super(setState, token, clientId);
  }

  async fetchBoardCards(boardId: string): Promise<TrelloCard[]> {
    if (!this.token || !this.clientId) return [];

    this.setLoading(true);
    this.setError(null);

    const apiCards = await this.makeApiCall<any[]>(
      `https://api.trello.com/1/boards/${boardId}/cards?key=${this.clientId}&token=${this.token}`,
      {},
      'Failed to fetch cards'
    );

    if (apiCards) {
      const filteredCards: TrelloCard[] = apiCards
        .filter((card: any) => !card.closed)
        .map((card: any) => ({
          id: card.id,
          name: card.name,
          desc: card.desc || '',
          closed: card.closed,
          pos: card.pos,
          listId: card.idList,
          boardId: boardId,
          url: card.url || ''
        }));
      
      this.setState((prev: CardStoreState) => ({
        ...prev,
        boardCards: {
          ...prev.boardCards,
          [boardId]: filteredCards
        }
      }));
      
      this.setLoading(false);
      return filteredCards;
    }

    this.setLoading(false);
    return [];
  }

  async createCard(listId: string, name: string): Promise<TrelloCard | null> {
    if (!this.token || !this.clientId) return null;

    this.setCreating(true);

    const apiCard = await this.makeApiCall<any>(
      `https://api.trello.com/1/cards`,
      {
        method: 'POST',
        body: JSON.stringify({
          name,
          idList: listId,
          key: this.clientId,
          token: this.token
        })
      },
      'Failed to create card'
    );

    if (apiCard) {
      const newCard: TrelloCard = {
        id: apiCard.id,
        name: apiCard.name,
        desc: apiCard.desc || '',
        closed: apiCard.closed,
        pos: apiCard.pos,
        listId: apiCard.idList,
        boardId: apiCard.idBoard,
        url: apiCard.url || ''
      };
      
      this.setState((prev: CardStoreState) => {
        const boardId = newCard.boardId;
        return {
          ...prev,
          boardCards: {
            ...prev.boardCards,
            [boardId]: [...(prev.boardCards[boardId] || []), newCard]
          }
        };
      });
      
      this.setCreating(false);
      return newCard;
    }

    this.setCreating(false);
    return null;
  }

  async renameCard(boardId: string, cardId: string, newName: string): Promise<TrelloCard | null> {
    if (!this.token || !this.clientId) return null;

    const updatedCard = await this.makeApiCall<any>(
      `https://api.trello.com/1/cards/${cardId}?key=${this.clientId}&token=${this.token}&name=${encodeURIComponent(newName)}`,
      { method: 'PUT' },
      'Failed to rename card'
    );

    if (updatedCard) {
      this.setState((prev: CardStoreState) => {
        const updatedCards = (prev.boardCards[boardId] || []).map(card =>
          card.id === cardId ? { ...card, name: updatedCard.name } : card
        );
        return { 
          ...prev, 
          boardCards: {
            ...prev.boardCards,
            [boardId]: updatedCards
          }
        };
      });

      return {
        id: updatedCard.id,
        name: updatedCard.name,
        desc: updatedCard.desc || '',
        closed: updatedCard.closed,
        pos: updatedCard.pos,
        listId: updatedCard.idList,
        boardId: updatedCard.idBoard,
        url: updatedCard.url || ''
      };
    }

    return null;
  }

  moveCard(boardId: string, cardId: string, sourceListId: string, destinationListId: string, destinationIndex: number): void {
    this.setState((prev: CardStoreState) => {
      const cards = [...(prev.boardCards[boardId] || [])];
      const cardIndex = cards.findIndex(card => card.id === cardId);
      
      if (cardIndex === -1) return prev;
      
      const card = { ...cards[cardIndex], listId: destinationListId };
      cards.splice(cardIndex, 1);
      
      // Find the position to insert the card in the destination list
      const destinationCards = cards.filter(c => c.listId === destinationListId);
      const insertIndex = Math.min(destinationIndex, destinationCards.length);
      
      // Find the actual index in the full cards array
      let actualInsertIndex = 0;
      let destinationCount = 0;
      
      for (let i = 0; i < cards.length; i++) {
        if (cards[i].listId === destinationListId) {
          if (destinationCount === insertIndex) {
            actualInsertIndex = i;
            break;
          }
          destinationCount++;
        }
        if (i === cards.length - 1) {
          actualInsertIndex = cards.length;
        }
      }
      
      cards.splice(actualInsertIndex, 0, card);
      
      return {
        ...prev,
        boardCards: {
          ...prev.boardCards,
          [boardId]: cards
        }
      };
    });
  }

  reorderCardsInList(boardId: string, listId: string, sourceIndex: number, destinationIndex: number): void {
    this.setState((prev: CardStoreState) => {
      const allCards = [...(prev.boardCards[boardId] || [])];
      const listCards = allCards.filter(card => card.listId === listId);
      const otherCards = allCards.filter(card => card.listId !== listId);
      
      const [removed] = listCards.splice(sourceIndex, 1);
      listCards.splice(destinationIndex, 0, removed);
      
      return {
        ...prev,
        boardCards: {
          ...prev.boardCards,
          [boardId]: [...otherCards, ...listCards].sort((a, b) => {
            if (a.listId !== b.listId) {
              return a.listId.localeCompare(b.listId);
            }
            return a.pos - b.pos;
          })
        }
      };
    });
  }

  reset(): void {
    super.reset();
    this.setState((prev: CardStoreState) => ({
      ...prev,
      boardCards: {}
    }));
  }
}
