import { BaseModel } from './BaseModel';

export class ListModel extends BaseModel {
  boardId: string;
  closed: boolean;
  pos: number;
  private cardIds: string[] = [];

  constructor(data: {
    id: string;
    name: string;
    boardId: string;
    closed: boolean;
    pos: number;
  }) {
    super(data.id, data.name);
    this.boardId = data.boardId;
    this.closed = data.closed;
    this.pos = data.pos;
  }

  // Card ID Management Methods
  addCardId(cardId: string): void {
    if (!this.cardIds.includes(cardId)) {
      this.cardIds.push(cardId);
    }
  }

  removeCardId(cardId: string): boolean {
    if (this.cardIds.includes(cardId)) {
      const newSet = [...this.cardIds];
      newSet.splice(newSet.indexOf(cardId), 1);
      this.cardIds = newSet;
      return true;
    }
    return false;
  }

  hasCardId(cardId: string): boolean {
    return this.cardIds.includes(cardId);
  }

  getCardIds(): string[] {
    return this.cardIds;
  }

  getCardCount(): number {
    return this.cardIds.length;
  }

  get cardIdsList(): string[] {
    return this.cardIds;
  }

  // update card position in ListModel cardIds array
  updateCardPosition(cardId: string, newPos: number): void {
    if (!this.cardIds.includes(cardId)) {
      return;
    }

    const cardIds = [...this.cardIds];
    const currentIndex = cardIds.indexOf(cardId);
    cardIds.splice(currentIndex, 1);
    const actualLength = cardIds.length;

    if (newPos >= actualLength) {
      cardIds.push(cardId);
    } else {
      cardIds.splice(newPos, 0, cardId);
    }

    this.cardIds = cardIds;
  }

  // List Operations
  async updateNameOnServer(newName: string, authData: { token: string; clientId: string }): Promise<boolean> {
    try {
      const response = await fetch(
        `https://api.trello.com/1/lists/${this.id}?key=${authData.clientId}&token=${authData.token}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: newName }),
        }
      );

      if (response.ok) {
        this.name = newName;
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error updating list name:', error);
      return false;
    }
  }

  async updatePositionOnServer(newPos: number | string, authData: { token: string; clientId: string }): Promise<boolean> {
    try {
      const response = await fetch(
        `https://api.trello.com/1/lists/${this.id}?key=${authData.clientId}&token=${authData.token}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pos: newPos }),
        }
      );

      if (response.ok) {
        if (typeof newPos === 'number') {
          this.pos = newPos;
        }
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error updating list position:', error);
      return false;
    }
  }
}