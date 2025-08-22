import { BaseModel } from './BaseModel';

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
  }

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
      return response.ok;
    } catch (error) {
      return false;
    }
  }
}
