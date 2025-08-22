import { BaseModel } from './BaseModel';

export class OrganizationModel extends BaseModel {
  displayName: string;
  desc: string;
  url: string;
  private boardIds: Set<string> = new Set();

  constructor(data: {
    id: string;
    name: string;
    displayName: string;
    desc: string;
    url: string;
  }) {
    super(data.id, data.name);
    this.displayName = data.displayName;
    this.desc = data.desc;
    this.url = data.url;
  }

  // Board ID Management Methods
  addBoardId(boardId: string): void {
    this.boardIds.add(boardId);
  }

  removeBoardId(boardId: string): boolean {
    return this.boardIds.delete(boardId);
  }

  hasBoardId(boardId: string): boolean {
    return this.boardIds.has(boardId);
  }

  getBoardIds(): string[] {
    return Array.from(this.boardIds);
  }

  getBoardCount(): number {
    return this.boardIds.size;
  }

  // Organization Operations
  async updateNameOnServer(newName: string, authData: { token: string; clientId: string }): Promise<boolean> {
    try {
      const response = await fetch(
        `https://api.trello.com/1/organizations/${this.id}?key=${authData.clientId}&token=${authData.token}`,
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
      console.error('Error updating organization name:', error);
      return false;
    }
  }
}
