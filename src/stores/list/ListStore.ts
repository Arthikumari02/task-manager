import { makeAutoObservable, runInAction } from 'mobx';
import { ListModel } from '../../models';

class ListStore {
  private listsMap: Map<string, ListModel> = new Map();
  isLoading: boolean = false;
  error: string | null = null;
  isCreating: boolean = false;

  constructor(private getAuthData: () => { token: string | null; clientId: string | null }) {
    makeAutoObservable(this);
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

  fetchLists = async (boardId: string, onSuccess: (lists: ListModel[]) => void): Promise<void> => {
    const { token, clientId } = this.getAuthData();
    console.log('ListStore fetchLists called:', { boardId, token: !!token, clientId: !!clientId });
    
    if (!token || !clientId || !boardId) {
      console.log('ListStore fetchLists: Missing auth data or boardId');
      return;
    }

    this.isLoading = true;
    this.error = null;

    try {
      const url = `https://api.trello.com/1/boards/${boardId}/lists?key=${clientId}&token=${token}&filter=open`;
      console.log('ListStore fetchLists: Making API call to:', url);
      
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Failed to fetch lists: ${response.statusText}`);
      }

      const trelloLists = await response.json();
      console.log('ListStore fetchLists: API response:', trelloLists);

      const listModels = trelloLists.map((list: any) => {
        const listModel = new ListModel({
          id: list.id,
          name: list.name,
          boardId: boardId,
          closed: list.closed || false,
          pos: list.pos || 0
        });

        this.listsMap.set(listModel.id, listModel);
        return listModel;
      });

      onSuccess(listModels);

    } catch (err) {
      console.error('Error fetching lists:', err);
      this.error = err instanceof Error ? err.message : 'Failed to fetch lists';
    } finally {
      this.isLoading = false;
    }
  };

  createList = async (boardId: string, name: string): Promise<ListModel | null> => {
    const { token, clientId } = this.getAuthData();
    if (!token || !clientId || !boardId) return null;

    this.isCreating = true;
    this.error = null;

    try {
      const response = await fetch(
        `https://api.trello.com/1/lists?key=${clientId}&token=${token}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name,
            idBoard: boardId
          })
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to create list: ${response.statusText}`);
      }

      const newList = await response.json();

      const listToAdd = new ListModel({
        id: newList.id,
        name: newList.name,
        boardId: boardId,
        closed: false,
        pos: newList.pos || 0
      });

      this.listsMap.set(listToAdd.id, listToAdd);

      return listToAdd;

    } catch (error) {
      console.error('Error creating list:', error);
      this.error = error instanceof Error ? error.message : 'Failed to create list';
      return null;
    } finally {
      this.isCreating = false;
    }
  };

  updateList = async (listId: string, newName: string): Promise<void> => {
    const { token, clientId } = this.getAuthData();
    if (!token || !clientId) return;

    const targetList = this.listsMap.get(listId) || null;

    if (targetList) {
      await targetList.updateNameOnServer(newName, { token, clientId });
    }
  };

  reorderLists = async (boardId: string, sourceIndex: number, destinationIndex: number): Promise<void> => {
    const lists = this.getListsForBoard(boardId).slice();

    if (lists.length === 0 || sourceIndex === destinationIndex) {
      return;
    }

    const [movedList] = lists.splice(sourceIndex, 1);
    lists.splice(destinationIndex, 0, movedList);

    // Update local order: adjust pos hints immediately
    runInAction(() => {
      lists.forEach((list, idx) => {
        list.pos = list.pos ?? 0;
      });
    });

    // Calculate new position for Trello API
    const { token, clientId } = this.getAuthData();
    if (!token || !clientId) {
      return;
    }

    try {
      let newPos: number | string;

      if (destinationIndex === 0) {
        newPos = 'top';
      } else if (destinationIndex === lists.length - 1) {
        newPos = 'bottom';
      } else {
        const prevList = lists[destinationIndex - 1];
        const nextList = lists[destinationIndex + 1];
        newPos = (prevList.pos + nextList.pos) / 2;
      }

      const response = await fetch(
        `https://api.trello.com/1/lists/${movedList.id}?key=${clientId}&token=${token}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ pos: newPos })
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to update list position: ${response.statusText}`);
      }

      const updatedList = await response.json();

      // Update the list's position with the actual value returned from Trello
      runInAction(() => {
        const target = this.listsMap.get(movedList.id);
        if (target) {
          target.pos = updatedList.pos;
        }
      });

    } catch (error) {
      console.error('Error reordering lists:', error);
      this.error = error instanceof Error ? error.message : 'Failed to reorder lists';
      // Re-fetch to restore
      await this.fetchLists(boardId, () => {});
    }
  };

  // Alias for compatibility with useBoardData hook
  fetchBoardLists = this.fetchLists;

  getListById = (listId: string): ListModel | null => {
    return this.listsMap.get(listId) || null;
  };

  addList = (list: ListModel) => {
    this.listsMap.set(list.id, list);
  };

  removeList = (listId: string) => {
    this.listsMap.delete(listId);
  }

  // Card relationship methods
  addCardToList = (listId: string, cardId: string): void => {
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

      // Remove the list from local state
      this.listsMap.delete(listId);
      return true;

    } catch (error) {
      console.error('Error closing list:', error);
      this.error = error instanceof Error ? error.message : 'Failed to close list';
      return false;
    }
  };

  clearListsForBoard = (boardId: string) => {
    console.log('ListStore: Clearing lists for board:', boardId);
    const listsToRemove = Array.from(this.listsMap.values()).filter(list => list.boardId === boardId);
    listsToRemove.forEach(list => {
      this.listsMap.delete(list.id);
    });
    console.log('ListStore: Cleared', listsToRemove.length, 'lists. Remaining:', this.listsMap.size);
  };

  reset = () => {
    this.listsMap.clear();
    this.error = null;
    this.isLoading = false;
    this.isCreating = false;
  };
}

export default ListStore;