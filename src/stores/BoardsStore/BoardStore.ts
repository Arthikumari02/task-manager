import { makeAutoObservable, action } from 'mobx';
import { TrelloBoard } from '../../types';
import { BoardModel } from '../../models';

class BoardStore {
  boardModels: Map<string, BoardModel> = new Map();
  isLoading: boolean = false;
  error: string | null = null;
  isCreating: boolean = false;
  currentBoardId: string | null = null;

  constructor(private getAuthData: () => { token: string | null; clientId: string | null }) {
    makeAutoObservable(this, {
      setLoading: action,
      setError: action,
      setCurrentBoardId: action,
      updateBoardProperty: action,
      resetState: action
    });
  }

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


  fetchBoardsForOrganization = (organizationId: string): Promise<void> => {
    return Promise.resolve();
  };

  // BoardModel access methods
  getBoardById = (boardId: string): BoardModel | undefined => {
    return this.boardModels.get(boardId);
  }

  getBoardsByOrganizationId = (organizationId: string): BoardModel[] => {
    return Array.from(this.boardModels.values()).filter(board => board.organizationId === organizationId);
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

  setLoading = (isLoading: boolean): void => {
    this.isLoading = isLoading;
  }

  setError = (error: string | null): void => {
    this.error = error;
  }

  setCurrentBoardId = (boardId: string | null): void => {
    this.currentBoardId = boardId;
  }

  updateBoardProperty = (boardId: string, property: string, value: any): void => {
    const board = this.getBoardById(boardId);
    if (board && board.hasOwnProperty(property)) {
      (board as any)[property] = value;
    }
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
    this.setCurrentBoardId(boardId);
  }

  resetState = () => {
    this.boardModels.clear();
    this.setLoading(false);
    this.setError(null);
    this.isCreating = false;
    this.setCurrentBoardId(null);
  };
}

export default BoardStore;