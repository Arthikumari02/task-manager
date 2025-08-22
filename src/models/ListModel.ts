import { BaseModel } from './BaseModel';

export class ListModel extends BaseModel {
  boardId: string;
  closed: boolean;
  pos: number;

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

  async updateNameOnServer(newName: string, authData: { token: string; clientId: string }): Promise<boolean> {
    try {
      const response = await fetch(
        `https://api.trello.com/1/lists/${this.id}?key=${authData.clientId}&token=${authData.token}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ name: newName })
        }
      );
      return response.ok;
    } catch (error) {
      return false;
    }
  }
}
