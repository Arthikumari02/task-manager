import { makeAutoObservable, runInAction } from 'mobx';
import { TrelloBoard } from '../../types';
import { BoardModel } from '../../models';

class BoardStore {
  boardModels: Map<string, BoardModel> = new Map();
  isLoading: boolean = false;
  error: string | null = null;
  isCreating: boolean = false;
  currentBoardId: string | null = null;

  constructor(private getAuthData: () => { token: string | null; clientId: string | null }) {
    makeAutoObservable(this);
  }

  // Computed values for better performance and clean code
  get boardCount(): number {
    return this.boardModels.size;
  }

  get currentOrganizationBoards(): TrelloBoard[] {
    // Convert Map values to array of TrelloBoard objects
    return Array.from(this.boardModels.values()).map(model => ({
      id: model.id,
      name: model.name,
      desc: model.desc,
      organizationId: model.organizationId,
      closed: model.closed,
      url: model.url,
      prefs: {} // Add empty prefs to match TrelloBoard type
    }));
  }


  // Alias for compatibility
  fetchBoardsForOrganization = (organizationId: string): Promise<void> => {
    // This is a placeholder that will be replaced by the useFetchBoards hook in components
    // We keep this method for backward compatibility
    console.warn('fetchBoardsForOrganization called directly from BoardStore. Use useFetchBoards hook instead.');
    return Promise.resolve();
  };

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

  addBoardModel = (boardModel: BoardModel): void => {
    this.boardModels.set(boardModel.id, boardModel);
  }

  hasBoard = (boardId: string): boolean => {
    return this.boardModels.has(boardId);
  }

  removeListFromBoard = (boardId: string, listId: string): void => {
    const board = this.boardModels.get(boardId);
    if (board) {
      board.removeListId(listId);
    }
  }

  setCurrentBoard = async (boardId: string) => {
    runInAction(() => {
      this.currentBoardId = boardId;
    });
  }

  resetState = () => {
    runInAction(() => {
      this.boardModels.clear();
      this.isLoading = false;
      this.error = null;
      this.isCreating = false;
      this.currentBoardId = null;
    });
  };
}

export default BoardStore;