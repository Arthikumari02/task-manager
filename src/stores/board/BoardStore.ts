import { makeAutoObservable } from 'mobx';
import { TrelloBoard } from '../../types';
import { BoardModel } from '../../models';

class BoardStore {
  boards: TrelloBoard[] = [];
  private boardModels: Map<string, BoardModel> = new Map();
  isLoading: boolean = false;
  error: string | null = null;
  isCreating: boolean = false;

  constructor(private getAuthData: () => { token: string | null; clientId: string | null }) {
    makeAutoObservable(this);
  }

  // Computed values for better performance and clean code
  get boardCount(): number {
    return this.boardModels.size;
  }

  get currentOrganizationBoards(): TrelloBoard[] {
    return this.boards;
  }

  fetchBoards = async (organizationId: string): Promise<void> => {
    const { token, clientId } = this.getAuthData();
    if (!token || !clientId) {
      console.error('Missing token or clientId');
      return;
    }
    if (!organizationId) {
      console.error('No organizationId provided');
      return;
    }

    this.isLoading = true;
    this.error = null;

    try {
      const url = `https://api.trello.com/1/organizations/${organizationId}/boards?key=${clientId}&token=${token}&filter=open`;
      console.log('Fetching boards from:', url);
      
      const response = await fetch(url);
      console.log('Boards response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to fetch boards:', response.status, errorText);
        throw new Error(`Failed to fetch boards: ${response.status} ${response.statusText}`);
      }

      const trelloBoards = await response.json();
      console.log('Fetched boards:', trelloBoards);

      this.boards = trelloBoards.map((board: any) => {
        const boardData = {
          id: board.id,
          name: board.name,
          desc: board.desc || '',
          organizationId: organizationId,
          closed: board.closed || false,
          url: board.url || '',
          prefs: board.prefs || {}
        };
        console.log('Mapped board:', boardData);
        return boardData;
      });

      // Create BoardModel instances
      this.boards.forEach(boardData => {
        const boardModel = new BoardModel({
          id: boardData.id,
          name: boardData.name,
          desc: boardData.desc,
          closed: boardData.closed,
          url: boardData.url,
          organizationId: boardData.organizationId
        });
        this.boardModels.set(boardData.id, boardModel);
      });

    } catch (err) {
      console.error('Error fetching boards:', err);
      this.error = err instanceof Error ? err.message : 'Failed to fetch boards';
      this.boards = [];
    } finally {
      this.isLoading = false;
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

      this.boards.push(boardToAdd);

      // Create BoardModel instance
      const boardModel = new BoardModel({
        id: boardToAdd.id,
        name: boardToAdd.name,
        desc: boardToAdd.desc,
        closed: boardToAdd.closed,
        url: boardToAdd.url,
        organizationId: boardToAdd.organizationId
      });
      this.boardModels.set(boardToAdd.id, boardModel);

      return boardToAdd;

    } catch (error) {
      console.error('Error creating board:', error);
      this.error = error instanceof Error ? error.message : 'Failed to create board';
      return null;
    } finally {
      this.isCreating = false;
    }
  };

  // Alias for compatibility
  fetchBoardsForOrganization = this.fetchBoards;

  // BoardModel access methods
  getBoardById = (boardId: string): BoardModel | undefined => {
    return this.boardModels.get(boardId);
  }

  addListToBoard = (boardId: string, listId: string): void => {
    const board = this.boardModels.get(boardId);
    if (board) {
      board.addListId(listId);
    }
  }

  removeListFromBoard = (boardId: string, listId: string): void => {
    const board = this.boardModels.get(boardId);
    if (board) {
      board.removeListId(listId);
    }
  }

  updateBoardName = async (boardId: string, newName: string): Promise<boolean> => {
    const { token, clientId } = this.getAuthData();
    if (!token || !clientId) return false;

    try {
      const response = await fetch(
        `https://api.trello.com/1/boards/${boardId}?key=${clientId}&token=${token}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ name: newName })
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to update board name: ${response.statusText}`);
      }

      const updatedBoard = await response.json();

      // Update local state
      const boardIndex = this.boards.findIndex(board => board.id === boardId);
      if (boardIndex !== -1) {
        this.boards[boardIndex].name = updatedBoard.name;
      }

      const boardModel = this.boardModels.get(boardId);
      if (boardModel) {
        boardModel.name = updatedBoard.name;
      }

      return true;

    } catch (error) {
      console.error('Error updating board name:', error);
      this.error = error instanceof Error ? error.message : 'Failed to update board name';
      return false;
    }
  };

  reset = () => {
    this.boards = [];
    this.boardModels.clear();
    this.error = null;
    this.isLoading = false;
    this.isCreating = false;
  };
}

export default BoardStore;
