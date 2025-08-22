import { makeAutoObservable } from 'mobx';
import { TrelloCard } from '../../types';
import { CardModel } from '../../models';

class CardStore {
  private cardsMap: Map<string, CardModel> = new Map();
  isLoading: boolean = false;
  error: string | null = null;
  isCreating: boolean = false;

  constructor(private getAuthData: () => { token: string | null; clientId: string | null }) {
    makeAutoObservable(this);
  }

  // Computed values for better performance and clean code
  get allCards(): CardModel[] {
    return Array.from(this.cardsMap.values());
  }

  get cardCount(): number {
    return this.cardsMap.size;
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

  fetchCards = async (boardId: string): Promise<void> => {
    const { token, clientId } = this.getAuthData();
    if (!token || !clientId || !boardId) return;

    this.isLoading = true;
    this.error = null;

    try {
      const response = await fetch(
        `https://api.trello.com/1/boards/${boardId}/cards?key=${clientId}&token=${token}&filter=open`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch cards: ${response.statusText}`);
      }

      const trelloCards = await response.json();
      
      // Create CardModel instances and add to cardsMap
      trelloCards
        .filter((card: any) => !card.closed)
        .forEach((card: any) => {
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
          
          this.cardsMap.set(cardModel.id, cardModel);
        });

    } catch (err) {
      console.error('Error fetching cards:', err);
      this.error = err instanceof Error ? err.message : 'Failed to fetch cards';
    } finally {
      this.isLoading = false;
    }
  };

  createCard = async (name: string, listId: string, boardId: string): Promise<TrelloCard | null> => {
    const { token, clientId } = this.getAuthData();
    if (!token || !clientId || !listId) return null;

    this.isCreating = true;
    this.error = null;

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
      
      this.cardsMap.set(cardModel.id, cardModel);
      
      return cardToAdd;

    } catch (error) {
      console.error('Error creating card:', error);
      this.error = error instanceof Error ? error.message : 'Failed to create card';
      return null;
    } finally {
      this.isCreating = false;
    }
  };

  renameCard = async (boardId: string, cardId: string, newName: string): Promise<void> => {
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
          body: JSON.stringify({ name: newName })
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to rename card: ${response.statusText}`);
      }

      // Update CardModel
      const cardModel = this.cardsMap.get(cardId);
      if (cardModel) {
        cardModel.name = newName;
      }
    } catch (error) {
      console.error('Error renaming card:', error);
      this.error = error instanceof Error ? error.message : 'Failed to rename card';
    }
  };

  moveCard = async (boardId: string, cardId: string, sourceListId: string, destinationListId: string, position: number): Promise<void> => {
    const { token, clientId } = this.getAuthData();
    if (!token || !clientId) return;

    // Update local state immediately for better UX
    const cardModel = this.cardsMap.get(cardId);
    if (cardModel) {
      cardModel.listId = destinationListId;
    }

    try {
      await fetch(
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
    } catch (error) {
      console.error('Error moving card:', error);
      // Revert on error
      await this.fetchCards(boardId);
    }
  };

  reorderCardsInList = async (boardId: string, listId: string, sourceIndex: number, destinationIndex: number): Promise<void> => {
    const listCards = this.getCardsForList(boardId, listId);
    if (listCards.length === 0) return;

    const [movedCard] = listCards.splice(sourceIndex, 1);
    listCards.splice(destinationIndex, 0, movedCard);

    // Update position on server
    const { token, clientId } = this.getAuthData();
    if (!token || !clientId) return;

    try {
      await fetch(
        `https://api.trello.com/1/cards/${movedCard.id}?key=${clientId}&token=${token}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ pos: destinationIndex })
        }
      );
    } catch (error) {
      console.error('Error reordering cards:', error);
      // Revert on error
      await this.fetchCards(boardId);
    }
  };

  // Alias for compatibility with useBoardData hook
  fetchBoardCards = this.fetchCards;

  getCardById = (cardId: string): CardModel | undefined => {
    return this.cardsMap.get(cardId);
  };

  reset = () => {
    this.cardsMap.clear();
    this.error = null;
    this.isLoading = false;
    this.isCreating = false;
  };
}

export default CardStore;
