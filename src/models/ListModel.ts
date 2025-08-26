import { action, computed, makeAutoObservable } from 'mobx';
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

    // We don't call makeObservable here since it's already called in the parent class
    // and we can't mix decorator syntax with manual annotations
  }

  // Card ID Management Methods
  addCardId(cardId: string): void {
    // Create a new Set to trigger MobX reactivity
    const newSet = new Set(this.cardIds);
    newSet.add(cardId);
    this.cardIds = newSet;
  }

  removeCardId(cardId: string): boolean {
    if (this.cardIds.has(cardId)) {
      // Create a new Set to trigger MobX reactivity
      const newSet = new Set(this.cardIds);
      newSet.delete(cardId);
      this.cardIds = newSet;
      return true;
    }
    return false;
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

  get cardIdsList(): string[] {
    return Array.from(this.cardIds);
  }

  // update card position in ListModel cardIdsSet 
  updateCardPosition(cardId: string, newPos: number): void {
    const cardIds = [...this.cardIdsList];
    const [movedCardId] = cardIds.splice(cardIds.indexOf(cardId), 1);
    cardIds.splice(newPos, 0, movedCardId); // Insert at the exact position, not newPos + 1

    // Create a new Set to trigger MobX reactivity
    this.cardIds = new Set(cardIds);
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