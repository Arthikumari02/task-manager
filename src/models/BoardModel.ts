import { BaseModel } from './BaseModel';

export class BoardModel extends BaseModel {
  desc: string;
  closed: boolean;
  url: string;
  organizationId: string;

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
  }

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
      return response.ok;
    } catch (error) {
      return false;
    }
  }
}
