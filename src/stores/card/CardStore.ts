import { makeAutoObservable, runInAction } from 'mobx';
import { TrelloCard } from '../../types';

class CardStore {
  boardCards: { [boardId: string]: TrelloCard[] } = {};
  isLoading: boolean = false;
  error: string | null = null;
  isCreating: boolean = false;

  constructor(private getAuthData: () => { token: string | null; clientId: string | null }) {
    makeAutoObservable(this);
  }

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
      
      runInAction(() => {
        this.boardCards[boardId] = trelloCards
          .filter((card: any) => !card.closed)
          .map((card: any) => ({
            id: card.id,
            name: card.name,
            desc: card.desc || '',
            listId: card.idList,
            boardId: boardId,
            closed: card.closed || false,
            pos: card.pos || 0,
            url: card.url || ''
          }));
      });

    } catch (err) {
      console.error('Error fetching cards:', err);
      runInAction(() => {
        this.error = err instanceof Error ? err.message : 'Failed to fetch cards';
        this.boardCards[boardId] = [];
      });
    } finally {
      runInAction(() => {
        this.isLoading = false;
      });
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

      runInAction(() => {
        if (!this.boardCards[boardId]) {
          this.boardCards[boardId] = [];
        }
        this.boardCards[boardId].push(cardToAdd);
      });
      
      return cardToAdd;

    } catch (error) {
      console.error('Error creating card:', error);
      runInAction(() => {
        this.error = error instanceof Error ? error.message : 'Failed to create card';
      });
      return null;
    } finally {
      runInAction(() => {
        this.isCreating = false;
      });
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

      // Update local state
      runInAction(() => {
        if (this.boardCards[boardId]) {
          const cardIndex = this.boardCards[boardId].findIndex(card => card.id === cardId);
          if (cardIndex !== -1) {
            this.boardCards[boardId][cardIndex].name = newName;
          }
        }
      });
    } catch (error) {
      console.error('Error renaming card:', error);
      runInAction(() => {
        this.error = error instanceof Error ? error.message : 'Failed to rename card';
      });
    }
  };

  moveCard = async (boardId: string, cardId: string, sourceListId: string, destinationListId: string, position: number): Promise<void> => {
    const { token, clientId } = this.getAuthData();
    if (!token || !clientId) return;

    // Update local state immediately for better UX
    runInAction(() => {
      if (this.boardCards[boardId]) {
        const cardIndex = this.boardCards[boardId].findIndex(card => card.id === cardId);
        if (cardIndex !== -1) {
          this.boardCards[boardId][cardIndex].listId = destinationListId;
        }
      }
    });

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
    if (!this.boardCards[boardId]) return;

    const listCards = this.boardCards[boardId].filter(card => card.listId === listId);
    const otherCards = this.boardCards[boardId].filter(card => card.listId !== listId);
    
    const [movedCard] = listCards.splice(sourceIndex, 1);
    listCards.splice(destinationIndex, 0, movedCard);

    // Update local state immediately
    runInAction(() => {
      this.boardCards[boardId] = [...otherCards, ...listCards];
    });

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

  getCardsForBoard = (boardId: string): TrelloCard[] => {
    return this.boardCards[boardId] || [];
  };

  getCardsForList = (boardId: string, listId: string): TrelloCard[] => {
    const boardCards = this.boardCards[boardId] || [];
    return boardCards.filter(card => card.listId === listId);
  };

  reset = () => {
    this.boardCards = {};
    this.error = null;
    this.isLoading = false;
    this.isCreating = false;
  };
}

export default CardStore;
