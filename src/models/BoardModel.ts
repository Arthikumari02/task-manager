import { makeObservable, observable } from 'mobx';
import { BaseModel } from './BaseModel';

export class BoardModel extends BaseModel {
  desc: string;
  closed: boolean;
  url: string;
  organizationId: string;
  listIds: Set<string> = new Set();

  constructor(data: {
    id: string;
    name: string;
    desc: string;
    closed: boolean;
    url: string;
    organizationId: string;
  }) {
    super(data.id, data.name);
    this.desc = data.desc;
    this.closed = data.closed;
    this.url = data.url;
    this.organizationId = data.organizationId;

    makeObservable(this, {
      listIds: observable
    });
  }

  // List ID Management Methods
  addListId(listId: string): void {
    console.log("Adding list ID:", listId);
    this.listIds.add(listId);
  }

  removeListId(listId: string): boolean {
    return this.listIds.delete(listId);
  }

  hasListId(listId: string): boolean {
    return this.listIds.has(listId);
  }

  get allListIds(): string[] {
    return Array.from(this.listIds);
  }

  getListCount(): number {
    return this.listIds.size;
  }

  clearListIds(): void {
    this.listIds.clear();
  }


  // Board Operations
  async updateNameOnServer(newName: string, authData: { token: string; clientId: string }): Promise<boolean> {
    try {
      const response = await fetch(
        `https://api.trello.com/1/boards/${this.id}?key=${authData.clientId}&token=${authData.token}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ name: newName })
        }
      );

      if (response.ok) {
        this.name = newName;
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error updating board name:', error);
      return false;
    }
  }
}
