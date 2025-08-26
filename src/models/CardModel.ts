import { makeObservable, observable, action } from 'mobx';
import { BaseModel } from './BaseModel';
// Note: Card API operations are now in hooks/APIs/CardAPI.ts

export class CardModel extends BaseModel {
  desc: string;
  closed: boolean;
  pos: number;
  listId: string;
  boardId: string;
  url: string;

  constructor(data: {
    id: string;
    name: string;
    desc: string;
    closed: boolean;
    pos: number;
    listId: string;
    boardId: string;
    url: string;
  }) {
    super(data.id, data.name);
    this.desc = data.desc;
    this.closed = data.closed;
    this.pos = data.pos;
    this.listId = data.listId;
    this.boardId = data.boardId;
    this.url = data.url;

    makeObservable(this, {
      desc: observable,
      closed: observable,
      pos: observable,
      listId: observable,
      boardId: observable,
      url: observable,
      updateNameOnServer: action,
      setListId: action,
      setPosition: action,
      setDescription: action,
      isValid: action,
      belongsToList: action,
      belongsToBoard: action,
    });
  }

  // Implement abstract method from BaseModel
  async updateNameOnServer(newName: string, authData: { token: string; clientId: string }): Promise<boolean> {
    try {
      const response = await fetch(
        `https://api.trello.com/1/cards/${this.id}?key=${authData.clientId}&token=${authData.token}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ name: newName })
        }
      );

      if (response.ok) {
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error updating card name:', error);
      return false;
    }
  }

  // Local state update methods
  setListId(newListId: string): void {
    this.listId = newListId;
  }

  setPosition(newPos: number): void {
    this.pos = newPos;
  }

  setDescription(newDesc: string): void {
    this.desc = newDesc;
  }

  // Validation Methods
  isValid(): boolean {
    return this.id.length > 0 &&
      this.name.length > 0 &&
      this.listId.length > 0 &&
      this.boardId.length > 0;
  }

  belongsToList(listId: string): boolean {
    return this.listId === listId;
  }

  belongsToBoard(boardId: string): boolean {
    return this.boardId === boardId;
  }
}
