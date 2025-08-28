import { makeObservable, observable, computed, action } from 'mobx';
import { ListModel } from '../../models';

class ListStore {
  listsMap = new Map<string, ListModel>();
  isLoading: boolean = false;
  error: string | null = null;
  isCreating: boolean = false;

  // Track last fetch time for each board to prevent duplicate fetches
  lastFetchTimes = new Map<string, number>();
  fetchDebounceMs: number = 2000; // 2 seconds debounce

  constructor(private getAuthData: () => { token: string | null; clientId: string | null }) {
    makeObservable(this, {
      // Observable properties
      listsMap: observable,
      isLoading: observable,
      error: observable,
      isCreating: observable,
      lastFetchTimes: observable,
      fetchDebounceMs: observable,

      // Computed properties
      allLists: computed,
      listCount: computed,

      // Actions
      getListsForBoard: action,
      getListsMap: action,
      getListCountForBoard: action,
      getListById: action,
      addList: action,
      removeList: action,
      addCardToList: action,
      removeCardFromList: action,
      closeList: action,
      clearListsForBoard: action,
      reset: action,
      setLoading: action,
      setError: action,
      updateListProperty: action,
      setListClosed: action,
      updateListPositions: action
    });
  }

  // Computed values for better performance and clean code
  get allLists(): ListModel[] {
    return Array.from(this.listsMap.values());
  }

  get listCount(): number {
    return this.listsMap.size;
  }

  getListsForBoard = (boardId: string): ListModel[] => {
    return this.allLists
      .filter(l => l.boardId === boardId && !l.closed)
      .sort((a, b) => (a.pos || 0) - (b.pos || 0));
  };

  getListsMap = (boardId: string): Map<string, ListModel> => {
    const listsMap = new Map<string, ListModel>();
    this.getListsForBoard(boardId).forEach(list => {
      listsMap.set(list.id, list);
    });
    return listsMap;
  };

  getListCountForBoard = (boardId: string): number => {
    return this.getListsForBoard(boardId).length;
  };

  getListById = (listId: string): ListModel | null => {

    return this.listsMap.get(listId) || null;
  };

  addList = (list: ListModel) => {
    this.listsMap.set(list.id, list);
  };

  removeList = (listId: string) => {
    this.listsMap.delete(listId);
  }

  setLoading = (isLoading: boolean) => {
    this.isLoading = isLoading;
  };

  setError = (error: string | null) => {
    this.error = error;
  };

  updateListProperty = (listId: string, property: string, value: any) => {
    const list = this.getListById(listId);
    if (list && list.hasOwnProperty(property)) {
      (list as any)[property] = value;
    }
  };

  setListClosed = (listId: string, closed: boolean) => {
    const list = this.getListById(listId);
    if (list) {
      list.closed = closed;
    }
  };

  updateListPositions = (lists: { id: string; pos: number }[]) => {
    lists.forEach(list => {
      const listModel = this.getListById(list.id);
      if (listModel) {
        listModel.pos = list.pos;
      }
    });
  };

  // Card relationship methods
  addCardToList = (cardId: string, listId: string): void => {
    const list = this.listsMap.get(listId);
    if (list) {
      list.addCardId(cardId);
    }
  }

  removeCardFromList = (listId: string, cardId: string): void => {
    const list = this.listsMap.get(listId);
    if (list) {
      list.removeCardId(cardId);
    }
  }

  closeList = async (listId: string): Promise<boolean> => {
    const { token, clientId } = this.getAuthData();
    if (!token || !clientId) return false;

    try {
      const response = await fetch(
        `https://api.trello.com/1/lists/${listId}?key=${clientId}&token=${token}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ closed: true })
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to close list: ${response.statusText}`);
      }

      // Mark the list as closed in local state instead of removing it
      this.setListClosed(listId, true);
      return true;

    } catch (error) {
      console.error('Error closing list:', error);
      this.setError(error instanceof Error ? error.message : 'Failed to close list');
      return false;
    }
  };

  clearListsForBoard = (boardId: string) => {
    const listsToRemove = Array.from(this.listsMap.values()).filter(list => list.boardId === boardId);
    listsToRemove.forEach(list => {
      this.listsMap.delete(list.id);
    });
  };

  reset = () => {
    //this.listsMap.clear();
    this.setError(null);
    this.setLoading(false);
    this.isCreating = false;
  };
}

export default ListStore;