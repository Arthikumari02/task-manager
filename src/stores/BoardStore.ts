import { BaseStore } from './BaseStore';
import { TrelloBoard } from '../types';

export interface BoardStoreState {
  boards: TrelloBoard[];
  isLoading: boolean;
  error: string | null;
  isCreating: boolean;
}

export class BoardStore extends BaseStore {
  constructor(setState: (updater: (prev: BoardStoreState) => BoardStoreState) => void, token: string | null, clientId: string | null) {
    super(setState, token, clientId);
  }

  async fetchBoardsForOrganization(organizationId: string): Promise<void> {
    if (!this.token || !this.clientId) return;

    this.setLoading(true);
    this.setError(null);

    const trelloBoards = await this.makeApiCall<any[]>(
      `https://api.trello.com/1/organizations/${organizationId}/boards?key=${this.clientId}&token=${this.token}&filter=open`,
      {},
      'Failed to fetch boards'
    );

    if (trelloBoards) {
      const fetchedBoards = trelloBoards.map((board: any) => ({
        id: board.id,
        name: board.name,
        desc: board.desc || '',
        organizationId: organizationId,
        closed: board.closed,
        url: board.url,
        shortUrl: board.shortUrl,
        prefs: {
          backgroundColor: board.prefs?.backgroundColor || '',
          backgroundImage: board.prefs?.backgroundImage
        }
      }));

      this.setState((prev: BoardStoreState) => ({
        ...prev,
        boards: [
          ...prev.boards.filter(b => b.organizationId !== organizationId),
          ...fetchedBoards
        ]
      }));
    } else {
      this.setState((prev: BoardStoreState) => ({
        ...prev,
        boards: []
      }));
    }

    this.setLoading(false);
  }

  async createBoard(name: string, organizationId: string, description: string = ''): Promise<TrelloBoard | null> {
    if (!this.token || !this.clientId) return null;

    this.setCreating(true);

    const newBoard = await this.makeApiCall<any>(
      `https://api.trello.com/1/boards/?key=${this.clientId}&token=${this.token}`,
      {
        method: 'POST',
        body: JSON.stringify({
          name,
          desc: description,
          idOrganization: organizationId,
          prefs_permissionLevel: 'org'
        })
      },
      'Failed to create board'
    );

    if (newBoard) {
      const boardToAdd: TrelloBoard = {
        id: newBoard.id,
        name: newBoard.name,
        desc: newBoard.desc || '',
        organizationId: organizationId,
        closed: false,
        url: newBoard.url,
        shortUrl: newBoard.shortUrl,
        prefs: {
          backgroundColor: newBoard.prefs?.backgroundColor || '',
          backgroundImage: newBoard.prefs?.backgroundImage
        }
      };

      this.setState((prev: BoardStoreState) => ({
        ...prev,
        boards: [...prev.boards, boardToAdd]
      }));

      this.setCreating(false);
      return boardToAdd;
    }

    this.setCreating(false);
    return null;
  }

  getCurrentOrganizationBoards(organizationId: string | undefined, currentState: BoardStoreState): TrelloBoard[] {
    if (!organizationId) return [];
    
    return currentState.boards.filter(board => 
      board.organizationId === organizationId && !board.closed
    );
  }

  reset(): void {
    super.reset();
    this.setState((prev: BoardStoreState) => ({
      ...prev,
      boards: []
    }));
  }
}
