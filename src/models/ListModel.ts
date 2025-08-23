import { action, makeObservable, observable } from 'mobx';
import { BaseModel } from './BaseModel';

export class ListModel extends BaseModel {
  boardId: string;
  closed: boolean;
  pos: number;
  private cardIds: Set<string> = new Set();

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

    // Automatically makes fields observable and methods actions
    makeObservable(this,{
      boardId: observable,
      closed: observable,
      pos: observable,
      addCardId: action,
      removeCardId: action,
      hasCardId: action,
      getCardIds: action,
      getCardCount: action,
    });
  }

  // Card ID Management Methods
  addCardId(cardId: string): void {
    this.cardIds.add(cardId);
  }

  removeCardId(cardId: string): boolean {
    return this.cardIds.delete(cardId);
  }

  hasCardId(cardId: string): boolean {
    return this.cardIds.has(cardId);
  }

  getCardIds(): string[] {
    return Array.from(this.cardIds);
  }

  getCardCount(): number {
    return this.cardIds.size;
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