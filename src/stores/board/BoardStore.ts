import { makeAutoObservable, runInAction } from 'mobx';
import { TrelloBoard } from '../../types';

class BoardStore {
  boards: TrelloBoard[] = [];
  isLoading: boolean = false;
  error: string | null = null;
  isCreating: boolean = false;

  constructor(private getAuthData: () => { token: string | null; clientId: string | null }) {
    makeAutoObservable(this);
  }

  fetchBoards = async (organizationId: string): Promise<void> => {
    const { token, clientId } = this.getAuthData();
    if (!token || !clientId || !organizationId) return;

    this.isLoading = true;
    this.error = null;

    try {
      const response = await fetch(
        `https://api.trello.com/1/organizations/${organizationId}/boards?key=${clientId}&token=${token}&filter=open`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch boards: ${response.statusText}`);
      }

      const trelloBoards = await response.json();
      
      runInAction(() => {
        this.boards = trelloBoards.map((board: any) => ({
          id: board.id,
          name: board.name,
          desc: board.desc || '',
          organizationId: organizationId,
          closed: board.closed || false,
          url: board.url || '',
          prefs: board.prefs || {}
        }));
      });

    } catch (err) {
      console.error('Error fetching boards:', err);
      runInAction(() => {
        this.error = err instanceof Error ? err.message : 'Failed to fetch boards';
        this.boards = [];
      });
    } finally {
      runInAction(() => {
        this.isLoading = false;
      });
    }
  };

  createBoard = async (name: string, organizationId: string): Promise<TrelloBoard | null> => {
    const { token, clientId } = this.getAuthData();
    if (!token || !clientId || !organizationId) return null;

    this.isCreating = true;
    this.error = null;

    try {
      const response = await fetch(
        `https://api.trello.com/1/boards?key=${clientId}&token=${token}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name,
            idOrganization: organizationId,
            prefs_permissionLevel: 'org'
          })
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to create board: ${response.statusText}`);
      }

      const newBoard = await response.json();
      
      const boardToAdd: TrelloBoard = {
        id: newBoard.id,
        name: newBoard.name,
        desc: newBoard.desc || '',
        organizationId: organizationId,
        closed: false,
        url: newBoard.url,
        shortUrl: newBoard.shortUrl,
        prefs: newBoard.prefs || {}
      };

      runInAction(() => {
        this.boards.push(boardToAdd);
      });
      
      return boardToAdd;

    } catch (error) {
      console.error('Error creating board:', error);
      runInAction(() => {
        this.error = error instanceof Error ? error.message : 'Failed to create board';
      });
      return null;
    } finally {
      runInAction(() => {
        this.isCreating = false;
      });
    }
  };

  reset = () => {
    this.boards = [];
    this.error = null;
    this.isLoading = false;
    this.isCreating = false;
  };
}

export default BoardStore;
